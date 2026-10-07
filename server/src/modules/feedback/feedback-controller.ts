import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { db } from "../../db/client.js";
import {
  feedback,
  queryHistory,
} from "../../db/schema.js";

import {
  eq,
} from "drizzle-orm";

interface FeedbackRequest {
  queryHistoryId: string;
  type:
    | "helpful"
    | "not_helpful";
  comment?: string;
}

export async function feedbackController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body =
    request.body as FeedbackRequest;

  if (
    !body?.queryHistoryId ||
    !body?.type
  ) {
    return reply.code(400).send({
      error:
        "queryHistoryId and type are required",
    });
  }

  if (
    body.type !== "helpful" &&
    body.type !== "not_helpful"
  ) {
    return reply.code(400).send({
      error:
        "type must be helpful or not_helpful",
    });
  }

  const [history] =
    await db
      .select({
        id: queryHistory.id,
      })
      .from(queryHistory)
      .where(
        eq(
          queryHistory.id,
          body.queryHistoryId,
        ),
      )
      .limit(1);

  if (!history) {
    return reply.code(404).send({
      error:
        "Query history record not found",
    });
  }

  const [record] =
    await db
      .insert(feedback)
      .values({
        queryHistoryId:
          body.queryHistoryId,

        type: body.type,

        comment:
          body.comment?.trim() ||
          null,
      })
      .returning({
        id: feedback.id,
        queryHistoryId:
          feedback.queryHistoryId,
        type: feedback.type,
        comment: feedback.comment,
        createdAt:
          feedback.createdAt,
      });

  return reply.code(201).send({
    id: record.id,
    queryHistoryId:
      record.queryHistoryId,
    type: record.type,
    comment: record.comment,
    createdAt: record.createdAt,
  });
}