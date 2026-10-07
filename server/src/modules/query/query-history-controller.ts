import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  desc,
  eq,
} from "drizzle-orm";

import { db } from "../../db/client.js";

import {
  queryHistory,
  feedback,
  steps,
  documents,
  documentVersions,
  sections,
} from "../../db/schema.js";

interface HistoryQuery {
  limit?: string;
}

interface HistoryParams {
  id: string;
}

export async function getQueryHistoryController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query =
    request.query as HistoryQuery;

  const requestedLimit =
    Number(query?.limit ?? 20);

  const limit =
    Number.isFinite(requestedLimit)
      ? Math.min(
          Math.max(
            Math.trunc(requestedLimit),
            1,
          ),
          100,
        )
      : 20;

  const history =
    await db
      .select({
        id: queryHistory.id,
        query: queryHistory.query,
        status: queryHistory.status,
        answer: queryHistory.answer,
        explanation:
          queryHistory.explanation,
        selectedStepId:
          queryHistory.selectedStepId,
        selectedVersionId:
          queryHistory.selectedVersionId,
        createdAt:
          queryHistory.createdAt,
      })
      .from(queryHistory)
      .orderBy(
        desc(queryHistory.createdAt),
      )
      .limit(limit);

  const historyWithFeedback =
    await Promise.all(
      history.map(async (item) => {
        const feedbackRows =
          await db
            .select({
              id: feedback.id,
              type: feedback.type,
              comment: feedback.comment,
              createdAt:
                feedback.createdAt,
            })
            .from(feedback)
            .where(
              eq(
                feedback.queryHistoryId,
                item.id,
              ),
            )
            .orderBy(
              desc(feedback.createdAt),
            );

        return {
          ...item,
          feedback: feedbackRows,
        };
      }),
    );

  return reply.send({
    items: historyWithFeedback,
    count: historyWithFeedback.length,
  });
}

export async function getQueryHistoryItemController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params =
    request.params as HistoryParams;

  const rows =
    await db
      .select({
        id: queryHistory.id,
        query: queryHistory.query,
        status: queryHistory.status,
        answer: queryHistory.answer,
        explanation:
          queryHistory.explanation,
        selectedStepId:
          queryHistory.selectedStepId,
        selectedVersionId:
          queryHistory.selectedVersionId,
        createdAt:
          queryHistory.createdAt,

        stepId: steps.id,
        stepOrdinal: steps.ordinal,
        stepTitle: steps.title,
        stepContent: steps.content,

        documentId: documents.id,
        documentTitle: documents.title,
        vendor: documents.vendor,
        system: documents.system,

        versionId:
          documentVersions.id,
        version:
          documentVersions.version,

        sectionId: sections.id,
        sectionTitle: sections.title,
        sectionOrdinal:
          sections.ordinal,
      })
      .from(queryHistory)
      .leftJoin(
        steps,
        eq(
          queryHistory.selectedStepId,
          steps.id,
        ),
      )
      .leftJoin(
        documentVersions,
        eq(
          steps.documentVersionId,
          documentVersions.id,
        ),
      )
      .leftJoin(
        documents,
        eq(
          documentVersions.documentId,
          documents.id,
        ),
      )
      .leftJoin(
        sections,
        eq(
          steps.sectionId,
          sections.id,
        ),
      )
      .where(
        eq(
          queryHistory.id,
          params.id,
        ),
      )
      .limit(1);

  const row = rows[0];

  if (!row) {
    return reply.code(404).send({
      error:
        "Query history record not found",
    });
  }

  let previousStep = null;
  let nextStep = null;

  if (
    row.stepId &&
    row.versionId &&
    row.sectionId
  ) {
    const previousRows =
      await db
        .select({
          id: steps.id,
          stepOrdinal: steps.ordinal,
          title: steps.title,
          content: steps.content,
        })
        .from(steps)
        .where(
          eq(
            steps.sectionId,
            row.sectionId,
          ),
        )
        .orderBy(
          steps.ordinal,
        );

    const currentIndex =
      previousRows.findIndex(
        (step) =>
          step.id === row.stepId,
      );

    if (currentIndex > 0) {
      previousStep =
        previousRows[
          currentIndex - 1
        ];
    }

    if (
      currentIndex >= 0 &&
      currentIndex <
        previousRows.length - 1
    ) {
      nextStep =
        previousRows[
          currentIndex + 1
        ];
    }
  }

  const feedbackRows =
    await db
      .select({
        id: feedback.id,
        type: feedback.type,
        comment: feedback.comment,
        createdAt:
          feedback.createdAt,
      })
      .from(feedback)
      .where(
        eq(
          feedback.queryHistoryId,
          row.id,
        ),
      )
      .orderBy(
        desc(feedback.createdAt),
      );

  return reply.send({
    id: row.id,

    query: row.query,

    status: row.status,

    answer: row.answer,

    explanation:
      row.explanation,

    queryHistoryId: row.id,

    currentStep:
      row.stepId
        ? {
            id: row.stepId,
            stepOrdinal:
              row.stepOrdinal!,
            title:
              row.stepTitle,
            content:
              row.stepContent!,
          }
        : null,

    previousStep,

    nextStep,

    source:
      row.documentId &&
      row.versionId &&
      row.sectionId &&
      row.stepId
        ? {
            documentId:
              row.documentId,

            documentTitle:
              row.documentTitle!,

            versionId:
              row.versionId,

            version:
              row.version!,

            vendor:
              row.vendor,

            system:
              row.system,

            sectionId:
              row.sectionId,

            sectionTitle:
              row.sectionTitle!,

            sectionOrdinal:
              row.sectionOrdinal!,

            stepId:
              row.stepId,

            stepOrdinal:
              row.stepOrdinal!,

            stepTitle:
              row.stepTitle,
          }
        : null,

    feedback:
      feedbackRows,
  });
}