import type {
  FastifyInstance,
} from "fastify";

import {
  feedbackController,
} from "./feedback-controller.js";

export async function feedbackRoutes(
  app: FastifyInstance,
) {
  app.post(
    "/feedback",
    {
      schema: {
        body: {
          type: "object",
          required: [
            "queryHistoryId",
            "type",
          ],
          additionalProperties: false,
          properties: {
            queryHistoryId: {
              type: "string",
              minLength: 1,
            },

            type: {
              type: "string",
              enum: [
                "helpful",
                "not_helpful",
              ],
            },

            comment: {
              type: "string",
              maxLength: 2000,
            },
          },
        },
      },
    },
    feedbackController,
  );
}