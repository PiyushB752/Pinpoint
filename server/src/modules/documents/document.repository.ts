import { eq } from "drizzle-orm";

import { db } from "../../db/client.js";
import { documents, documentVersions } from "../../db/schema.js";

export async function listDocuments() {
  return db.query.documents.findMany({
    columns: {
      id: true,
      title: true,
      vendor: true,
      system: true,
      createdAt: true,
      updatedAt: true,
    },

    with: {
      versions: {
        columns: {
          id: true,
          version: true,
          revisionDate: true,
          status: true,
          sourcePath: true,
          contentHash: true,
          createdAt: true,
        },

        orderBy: (versions, { desc }) => [
          desc(versions.createdAt),
        ],
      },
    },

    orderBy: (documents, { desc }) => [
      desc(documents.createdAt),
    ],
  });
}

export async function getDocumentById(id: string) {
  const [document] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);

  if (!document) {
    return null;
  }

  const versions = await db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.documentId, id));

  return {
    ...document,
    versions,
  };
}