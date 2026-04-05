import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { registerAuthRoutes } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  registerAuthRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
