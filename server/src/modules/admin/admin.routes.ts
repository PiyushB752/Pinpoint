import type {
  FastifyInstance,
} from "fastify";

import {
  adminMetricsController,
} from "./admin-controller.js";

export async function adminRoutes(
  app: FastifyInstance,
) {
  app.get(
    "/admin/metrics",
    adminMetricsController,
  );
}