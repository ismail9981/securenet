import { DeviceService } from "@/modules/inventory/application/device-service";
import { PrismaDeviceRepository } from "@/modules/inventory/infrastructure/prisma-device-repository";

export const deviceService = new DeviceService(new PrismaDeviceRepository());
