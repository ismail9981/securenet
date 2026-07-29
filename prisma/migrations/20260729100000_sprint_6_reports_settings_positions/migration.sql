CREATE TABLE "system_settings" (
    "id" VARCHAR(32) NOT NULL DEFAULT 'global',
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Muscat',
    "cpu_unit" VARCHAR(16) NOT NULL DEFAULT 'percent',
    "memory_unit" VARCHAR(16) NOT NULL DEFAULT 'percent',
    "traffic_unit" VARCHAR(16) NOT NULL DEFAULT 'Mbps',
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "topology_positions" (
    "device_id" UUID NOT NULL,
    "x" DECIMAL(12,3) NOT NULL,
    "y" DECIMAL(12,3) NOT NULL,
    "updated_by" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "topology_positions_pkey" PRIMARY KEY ("device_id")
);

CREATE INDEX "topology_positions_updated_by_updated_at_idx"
ON "topology_positions"("updated_by", "updated_at" DESC);

ALTER TABLE "system_settings"
ADD CONSTRAINT "system_settings_updated_by_fkey"
FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "topology_positions"
ADD CONSTRAINT "topology_positions_device_id_fkey"
FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "topology_positions"
ADD CONSTRAINT "topology_positions_updated_by_fkey"
FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
