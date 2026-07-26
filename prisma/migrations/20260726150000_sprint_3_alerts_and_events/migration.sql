-- CreateEnum
CREATE TYPE "AlertMetric" AS ENUM ('CPU', 'RAM', 'DISK', 'PING', 'PACKET_LOSS', 'STATUS', 'BANDWIDTH');

-- CreateEnum
CREATE TYPE "AlertOperator" AS ENUM ('GT', 'GTE', 'LT', 'LTE', 'EQ');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AlertSource" AS ENUM ('METRIC_RULE', 'DEVICE_STATUS');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM (
  'ALERT_OPENED',
  'ALERT_RETRIGGERED',
  'ALERT_ACKNOWLEDGED',
  'ALERT_INVESTIGATION_STARTED',
  'ALERT_RESOLVED',
  'DEVICE_CREATED',
  'DEVICE_UPDATED',
  'DEVICE_ARCHIVED',
  'DEVICE_STATUS_CHANGED'
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "metric" "AlertMetric" NOT NULL,
    "operator" "AlertOperator" NOT NULL,
    "warning_threshold" DECIMAL(12,2),
    "critical_threshold" DECIMAL(12,2),
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "consecutive_samples" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "scope" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "alert_rules_duration_seconds_check" CHECK ("duration_seconds" >= 0),
    CONSTRAINT "alert_rules_consecutive_samples_check" CHECK (
      "consecutive_samples" IS NULL OR "consecutive_samples" > 0
    ),
    CONSTRAINT "alert_rules_threshold_check" CHECK (
      "warning_threshold" IS NOT NULL OR
      "critical_threshold" IS NOT NULL OR
      "metric" = 'STATUS'
    )
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "alert_rule_id" UUID,
    "dedupe_key" VARCHAR(255) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL,
    "source" "AlertSource" NOT NULL,
    "opened_at" TIMESTAMPTZ(3) NOT NULL,
    "acknowledged_at" TIMESTAMPTZ(3),
    "acknowledged_by" UUID,
    "acknowledgement_note" TEXT,
    "assignee_user_id" UUID,
    "resolved_at" TIMESTAMPTZ(3),
    "resolved_by" UUID,
    "resolution_note" TEXT,
    "last_triggered_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "alerts_investigating_acknowledged_check" CHECK (
      "status" <> 'INVESTIGATING' OR
      ("acknowledged_at" IS NOT NULL AND "acknowledged_by" IS NOT NULL)
    ),
    CONSTRAINT "alerts_resolved_fields_check" CHECK (
      "status" <> 'RESOLVED' OR
      ("resolved_at" IS NOT NULL AND "resolved_by" IS NOT NULL)
    ),
    CONSTRAINT "alerts_unresolved_fields_check" CHECK (
      "status" = 'RESOLVED' OR
      ("resolved_at" IS NULL AND "resolved_by" IS NULL)
    )
);

-- CreateTable
CREATE TABLE "events" (
    "id" BIGSERIAL NOT NULL,
    "device_id" UUID,
    "alert_id" UUID,
    "actor_user_id" UUID,
    "type" "EventType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alert_rules_code_key" ON "alert_rules"("code");

-- CreateIndex
CREATE INDEX "alerts_status_severity_opened_at_idx" ON "alerts"("status", "severity", "opened_at" DESC);

-- CreateIndex
CREATE INDEX "alerts_device_id_status_idx" ON "alerts"("device_id", "status");

-- CreateIndex
CREATE INDEX "alerts_dedupe_key_idx" ON "alerts"("dedupe_key");

-- CreateIndex
CREATE UNIQUE INDEX "alerts_active_device_rule_key"
ON "alerts"("device_id", "alert_rule_id")
WHERE "status" IN ('OPEN', 'ACKNOWLEDGED', 'INVESTIGATING')
  AND "alert_rule_id" IS NOT NULL;

-- CreateIndex
CREATE INDEX "events_created_at_idx" ON "events"("created_at" DESC);

-- CreateIndex
CREATE INDEX "events_device_id_created_at_idx" ON "events"("device_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "events_alert_id_created_at_idx" ON "events"("alert_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "events_actor_user_id_created_at_idx" ON "events"("actor_user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_alert_rule_id_fkey" FOREIGN KEY ("alert_rule_id") REFERENCES "alert_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
