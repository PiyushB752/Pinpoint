import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  getAdminMetrics,
} from "./admin-service.js";

export async function adminMetricsController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const metrics =
      await getAdminMetrics();

    return reply.send(metrics);
  } catch (error) {
    return reply.code(500).send({
      error:
        "Failed to load admin metrics.",
    });
  }
}