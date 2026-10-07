import type {
  FastifyInstance,
} from "fastify";

import {
  queryController,
} from "./query-controller.js";

import {
  getQueryHistoryController,
  getQueryHistoryItemController,
} from "./query-history-controller.js";

export async function queryRoutes(
  app: FastifyInstance,
) {
  app.post(
    "/query",
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

  app.get(
    "/query/history",
    {
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            limit: {
              type: "string",
              pattern: "^[0-9]+$",
            },
          },
        },
      },
    },
    getQueryHistoryController,
  );

  app.get(
    "/query/history/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          additionalProperties: false,
          properties: {
            id: {
              type: "string",
              minLength: 1,
            },
          },
        },
      },
    },
    getQueryHistoryItemController,
  );
}