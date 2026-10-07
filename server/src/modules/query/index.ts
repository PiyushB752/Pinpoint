import type { FastifyInstance } from "fastify";

import { queryController } from "./query-controller";

export async function queryRoutes(
  app: FastifyInstance,
) {
  app.post(
    "/v1/query",
    {
      schema: {
        body: {
          type: "object",
          required: ["query"],
          additionalProperties: false,
          properties: {
            query: {
              type: "string",
              minLength: 1,
              maxLength: 2000,
            },
          },
        },
      },
    },
    queryController,
  );
}