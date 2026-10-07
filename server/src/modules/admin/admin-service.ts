import {
  and,
  avg,
  count,
  eq,
  gte,
} from "drizzle-orm";

import { db } from "../../db/client.js";
import {
  documentVersions,
  queryHistory,
} from "../../db/schema.js";

export interface AdminMetrics {
  queriesToday: number;
  lowConfidenceQueries: number;
  documentsIndexed: number;
  averageRetrievalRelevance: number | null;
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const now = new Date();

  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const [
    queriesTodayResult,
    lowConfidenceResult,
    documentsIndexedResult,
  ] = await Promise.all([
    db
      .select({
        count: count(),
      })
      .from(queryHistory)
      .where(
        gte(
          queryHistory.createdAt,
          startOfDay,
        ),
      ),

    db
      .select({
        count: count(),
      })
      .from(queryHistory)
      .where(
        and(
          gte(
            queryHistory.createdAt,
            startOfDay,
          ),
          eq(
            queryHistory.status,
            "NO_CONFIDENT_MATCH",
          ),
        ),
      ),

    db
      .select({
        count: count(),
      })
      .from(documentVersions)
      .where(
        eq(
          documentVersions.ingestionStatus,
          "indexed",
        ),
      ),
  ]);

  const averageRetrievalRelevance =
    await getAverageRetrievalRelevance();

  return {
    queriesToday:
      queriesTodayResult[0]?.count ?? 0,

    lowConfidenceQueries:
      lowConfidenceResult[0]?.count ?? 0,

    documentsIndexed:
      documentsIndexedResult[0]?.count ?? 0,

    averageRetrievalRelevance,
  };
}

async function getAverageRetrievalRelevance(): Promise<
  number | null
> {
  const result =
    await db
      .select({
        average: avg(
          queryHistory.relevance,
        ),
      })
      .from(queryHistory)
      .where(
        gte(
          queryHistory.relevance,
          0,
        ),
      );

  const average =
    result[0]?.average;

  if (average === null || average === undefined) {
    return null;
  }

  return Math.round(
    Number(average),
  );
}