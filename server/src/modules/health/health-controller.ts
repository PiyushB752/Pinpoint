import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { db } from "../../db/client.js";
import { sql } from "drizzle-orm";

export async function healthController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  let database: "connected" | "disconnected" =
    "disconnected";

  try {
    await db.execute(sql`SELECT 1`);
    database = "connected";
  } catch {
    database = "disconnected";
  }

  const embeddingConfigured =
    Boolean(process.env.GEMINI_API_KEY);

  const llmConfigured =
    Boolean(process.env.GROQ_API_KEY);

  const status =
    database === "connected" &&
    embeddingConfigured &&
    llmConfigured
      ? "ok"
      : "degraded";

  return reply.send({
    status,
    database,
    embedding: embeddingConfigured
      ? "configured"
      : "not_configured",
    llm: llmConfigured
      ? "configured"
      : "not_configured",
    timestamp: new Date().toISOString(),
  });
}