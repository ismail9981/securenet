import { SimulationService } from "@/modules/simulation/application/simulation-service";
import { PrismaSimulationRepository } from "@/modules/simulation/infrastructure/prisma-simulation-repository";

export const simulationRepository = new PrismaSimulationRepository();
export const simulationService = new SimulationService(simulationRepository);
