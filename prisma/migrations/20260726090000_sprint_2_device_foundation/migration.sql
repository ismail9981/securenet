-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'NETWORK_ENGINEER', 'VIEWER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('SERVER', 'ROUTER', 'SWITCH', 'FIREWALL', 'AP', 'WORKSTATION', 'PRINTER', 'NAS');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ONLINE', 'DEGRADED', 'OFFLINE', 'MAINTENANCE', 'UNKNOWN');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL,
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "hostname" VARCHAR(120) NOT NULL,
    "ip_address" INET NOT NULL,
    "mac_address" VARCHAR(17),
    "type" "DeviceType" NOT NULL,
    "status" "DeviceStatus" NOT NULL,
    "os_name" VARCHAR(120),
    "location_id" UUID NOT NULL,
    "parent_device_id" UUID,
    "importance_weight" SMALLINT NOT NULL DEFAULT 1,
    "last_seen_at" TIMESTAMPTZ(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "archived_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "devices_importance_weight_check" CHECK ("importance_weight" BETWEEN 1 AND 5),
    CONSTRAINT "devices_mac_address_check" CHECK (
      "mac_address" IS NULL OR
      "mac_address" ~ '^[0-9A-F]{2}(:[0-9A-F]{2}){5}$'
    ),
    CONSTRAINT "devices_parent_not_self_check" CHECK (
      "parent_device_id" IS NULL OR "parent_device_id" <> "id"
    )
);

-- CreateTable
CREATE TABLE "device_metrics" (
    "id" BIGSERIAL NOT NULL,
    "device_id" UUID NOT NULL,
    "cpu_pct" DECIMAL(5,2),
    "ram_pct" DECIMAL(5,2),
    "disk_pct" DECIMAL(5,2),
    "ping_ms" DECIMAL(8,2),
    "packet_loss_pct" DECIMAL(5,2),
    "download_mbps" DECIMAL(12,2),
    "upload_mbps" DECIMAL(12,2),
    "uptime_seconds" BIGINT,
    "source_time" TIMESTAMPTZ(3) NOT NULL,
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batch_key" UUID,

    CONSTRAINT "device_metrics_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "device_metrics_cpu_pct_check" CHECK ("cpu_pct" IS NULL OR "cpu_pct" BETWEEN 0 AND 100),
    CONSTRAINT "device_metrics_ram_pct_check" CHECK ("ram_pct" IS NULL OR "ram_pct" BETWEEN 0 AND 100),
    CONSTRAINT "device_metrics_disk_pct_check" CHECK ("disk_pct" IS NULL OR "disk_pct" BETWEEN 0 AND 100),
    CONSTRAINT "device_metrics_ping_ms_check" CHECK ("ping_ms" IS NULL OR "ping_ms" BETWEEN 0 AND 5000),
    CONSTRAINT "device_metrics_packet_loss_pct_check" CHECK ("packet_loss_pct" IS NULL OR "packet_loss_pct" BETWEEN 0 AND 100),
    CONSTRAINT "device_metrics_download_mbps_check" CHECK ("download_mbps" IS NULL OR "download_mbps" >= 0),
    CONSTRAINT "device_metrics_upload_mbps_check" CHECK ("upload_mbps" IS NULL OR "upload_mbps" >= 0),
    CONSTRAINT "device_metrics_uptime_seconds_check" CHECK ("uptime_seconds" IS NULL OR "uptime_seconds" >= 0)
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "actor_user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" VARCHAR(100),
    "before_data" JSONB,
    "after_data" JSONB,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "locations_name_key" ON "locations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "devices_active_hostname_key"
ON "devices"(LOWER("hostname"))
WHERE "archived_at" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "devices_active_ip_address_key"
ON "devices"("ip_address")
WHERE "archived_at" IS NULL;

-- CreateIndex
CREATE INDEX "devices_status_type_location_id_idx" ON "devices"("status", "type", "location_id");

-- CreateIndex
CREATE INDEX "devices_parent_device_id_idx" ON "devices"("parent_device_id");

-- CreateIndex
CREATE INDEX "device_metrics_device_id_source_time_idx" ON "device_metrics"("device_id", "source_time" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_actor_created_at_idx" ON "audit_logs"("actor_user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_parent_device_id_fkey" FOREIGN KEY ("parent_device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_metrics" ADD CONSTRAINT "device_metrics_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
