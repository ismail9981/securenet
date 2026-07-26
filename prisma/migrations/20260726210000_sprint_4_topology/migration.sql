CREATE TYPE "NetworkConnectionType" AS ENUM ('ETHERNET', 'WIFI', 'VPN', 'VIRTUAL');

CREATE TYPE "NetworkConnectionStatus" AS ENUM ('ACTIVE', 'DEGRADED', 'DOWN');

CREATE TABLE "network_connections" (
    "id" UUID NOT NULL,
    "source_device_id" UUID NOT NULL,
    "target_device_id" UUID NOT NULL,
    "connection_type" "NetworkConnectionType" NOT NULL,
    "label" VARCHAR(120),
    "bandwidth_capacity_mbps" DECIMAL(12,2),
    "status" "NetworkConnectionStatus" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "network_connections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "network_connections_no_self_link_check"
      CHECK ("source_device_id" <> "target_device_id"),
    CONSTRAINT "network_connections_canonical_endpoints_check"
      CHECK ("source_device_id"::text < "target_device_id"::text),
    CONSTRAINT "network_connections_positive_capacity_check"
      CHECK ("bandwidth_capacity_mbps" IS NULL OR "bandwidth_capacity_mbps" > 0)
);

CREATE UNIQUE INDEX "network_connections_endpoints_type_key"
  ON "network_connections"("source_device_id", "target_device_id", "connection_type");

CREATE INDEX "network_connections_source_device_id_idx"
  ON "network_connections"("source_device_id");

CREATE INDEX "network_connections_target_device_id_idx"
  ON "network_connections"("target_device_id");

ALTER TABLE "network_connections"
  ADD CONSTRAINT "network_connections_source_device_id_fkey"
  FOREIGN KEY ("source_device_id") REFERENCES "devices"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "network_connections"
  ADD CONSTRAINT "network_connections_target_device_id_fkey"
  FOREIGN KEY ("target_device_id") REFERENCES "devices"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
