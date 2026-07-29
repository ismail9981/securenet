CREATE TYPE "SimulationStatus" AS ENUM ('RUNNING', 'COMPLETED', 'CANCELLED', 'FAILED');
CREATE TYPE "MetricSource" AS ENUM ('SEED', 'SIMULATION', 'MANUAL');

ALTER TYPE "EventType" ADD VALUE 'SIMULATION_STARTED';
ALTER TYPE "EventType" ADD VALUE 'SIMULATION_COMPLETED';
ALTER TYPE "EventType" ADD VALUE 'SIMULATION_CANCELLED';
ALTER TYPE "EventType" ADD VALUE 'SIMULATION_FAILED';

CREATE TABLE "simulation_runs" (
    "id" UUID NOT NULL,
    "scenario_code" VARCHAR(80) NOT NULL,
    "status" "SimulationStatus" NOT NULL,
    "started_by" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL,
    "ended_at" TIMESTAMPTZ(3),
    "progress" SMALLINT NOT NULL DEFAULT 0,
    "last_tick_at" TIMESTAMPTZ(3),
    "idempotency_key" VARCHAR(120) NOT NULL,
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "result" JSONB,

    CONSTRAINT "simulation_runs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "simulation_runs_progress_check" CHECK ("progress" >= 0 AND "progress" <= 100)
);

ALTER TABLE "device_metrics"
    ADD COLUMN "source" "MetricSource" NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN "simulation_run_id" UUID;

UPDATE "device_metrics"
SET "source" = 'SEED'
WHERE "batch_key" = '20000000-0000-4000-8000-000000000001'::uuid;

ALTER TABLE "events" ADD COLUMN "simulation_run_id" UUID;

CREATE UNIQUE INDEX "simulation_runs_idempotency_key_key"
    ON "simulation_runs"("idempotency_key");
CREATE INDEX "simulation_runs_status_started_at_idx"
    ON "simulation_runs"("status", "started_at");
CREATE INDEX "simulation_runs_started_by_started_at_idx"
    ON "simulation_runs"("started_by", "started_at" DESC);
CREATE UNIQUE INDEX "device_metrics_simulation_device_batch_key"
    ON "device_metrics"("device_id", "batch_key")
    WHERE "source" = 'SIMULATION' AND "batch_key" IS NOT NULL;
CREATE INDEX "device_metrics_simulation_run_source_time_idx"
    ON "device_metrics"("simulation_run_id", "source_time" DESC);
CREATE INDEX "events_simulation_run_created_at_idx"
    ON "events"("simulation_run_id", "created_at" DESC);

ALTER TABLE "simulation_runs"
    ADD CONSTRAINT "simulation_runs_started_by_fkey"
    FOREIGN KEY ("started_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "device_metrics"
    ADD CONSTRAINT "device_metrics_simulation_run_id_fkey"
    FOREIGN KEY ("simulation_run_id") REFERENCES "simulation_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "events"
    ADD CONSTRAINT "events_simulation_run_id_fkey"
    FOREIGN KEY ("simulation_run_id") REFERENCES "simulation_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
