import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

// ============================================================
// ENUMS
// ============================================================

// Document lifecycle status
export const documentStatusEnum = pgEnum(
  "document_status",
  [
    "active",
    "superseded",
    "draft",
    "archived",
  ],
);

// Document ingestion status
export const ingestionStatusEnum = pgEnum(
  "ingestion_status",
  [
    "queued",
    "processing",
    "indexed",
    "failed",
  ],
);

// Query result status
export const queryStatusEnum = pgEnum(
  "query_status",
  [
    "GENERATED",
    "NO_CONFIDENT_MATCH",
    "GENERATION_FAILED",
  ],
);

// User feedback type
export const feedbackTypeEnum = pgEnum(
  "feedback_type",
  [
    "helpful",
    "not_helpful",
  ],
);

// ============================================================
// DOCUMENTS
// ============================================================

export const documents = pgTable(
  "documents",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    title: text("title")
      .notNull(),

    vendor: text("vendor"),

    system: text("system"),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "documents_title_idx",
    ).on(table.title),
  ],
);

// ============================================================
// DOCUMENT VERSIONS
// ============================================================

export const documentVersions =
  pgTable(
    "document_versions",
    {
      id: uuid("id")
        .defaultRandom()
        .primaryKey(),

      documentId: uuid("document_id")
        .notNull()
        .references(
          () => documents.id,
          {
            onDelete: "cascade",
          },
        ),

      version: text("version")
        .notNull(),

      revisionDate: timestamp(
        "revision_date",
        {
          withTimezone: true,
        },
      ),

      status: documentStatusEnum(
        "status",
      )
        .notNull()
        .default("draft"),

      ingestionStatus:
        ingestionStatusEnum(
          "ingestion_status",
        )
          .notNull()
          .default("queued"),

      originalFilename: text(
        "original_filename",
      ),

      sourcePath: text("source_path")
        .notNull(),

      contentHash: text(
        "content_hash",
      ),

      createdAt: timestamp(
        "created_at",
        {
          withTimezone: true,
        },
      )
        .notNull()
        .defaultNow(),
    },
    (table) => [
      index(
        "document_versions_document_id_idx",
      ).on(table.documentId),

      index(
        "document_versions_status_idx",
      ).on(
        table.status,
        table.ingestionStatus,
      ),
    ],
  );

// ============================================================
// SECTIONS
// ============================================================

export const sections = pgTable(
  "sections",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    documentVersionId: uuid(
      "document_version_id",
    )
      .notNull()
      .references(
        () => documentVersions.id,
        {
          onDelete: "cascade",
        },
      ),

    title: text("title")
      .notNull(),

    ordinal: integer("ordinal")
      .notNull(),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "sections_version_ordinal_unique",
    ).on(
      table.documentVersionId,
      table.ordinal,
    ),
  ],
);

// ============================================================
// TROUBLESHOOTING STEPS
// ============================================================

export const steps = pgTable(
  "steps",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    documentVersionId: uuid(
      "document_version_id",
    )
      .notNull()
      .references(
        () => documentVersions.id,
        {
          onDelete: "cascade",
        },
      ),

    sectionId: uuid("section_id")
      .notNull()
      .references(
        () => sections.id,
        {
          onDelete: "cascade",
        },
      ),

    ordinal: integer("ordinal")
      .notNull(),

    title: text("title"),

    content: text("content")
      .notNull(),

    previousStepId: uuid(
      "previous_step_id",
    ),

    nextStepId: uuid(
      "next_step_id",
    ),

    embedding: vector("embedding", {
      dimensions: 1536,
    }),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "steps_document_version_id_idx",
    ).on(table.documentVersionId),

    index(
      "steps_section_id_idx",
    ).on(table.sectionId),

    uniqueIndex(
      "steps_section_ordinal_unique",
    ).on(
      table.sectionId,
      table.ordinal,
    ),
  ],
);

// ============================================================
// QUERY HISTORY
// ============================================================

export const queryHistory = pgTable(
  "query_history",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    query: text("query")
      .notNull(),

    status: queryStatusEnum(
      "status",
    ).notNull(),

    answer: text("answer"),

    explanation: text("explanation"),

    relevance: integer("relevance"),

    selectedStepId: uuid(
      "selected_step_id",
    ).references(
      () => steps.id,
      {
        onDelete: "set null",
      },
    ),

    selectedVersionId: uuid(
      "selected_version_id",
    ).references(
      () => documentVersions.id,
      {
        onDelete: "set null",
      },
    ),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "query_history_created_at_idx",
    ).on(table.createdAt),

    index(
      "query_history_status_idx",
    ).on(table.status),
  ],
);

// ============================================================
// FEEDBACK
// ============================================================

export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    queryHistoryId: uuid(
      "query_history_id",
    )
      .notNull()
      .references(
        () => queryHistory.id,
        {
          onDelete: "cascade",
        },
      ),

    type: feedbackTypeEnum(
      "type",
    ).notNull(),

    comment: text("comment"),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      },
    )
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "feedback_query_history_id_idx",
    ).on(
      table.queryHistoryId,
    ),
  ],
);

// ============================================================
// RELATIONS
// ============================================================

// Documents
export const documentsRelations =
  relations(
    documents,
    ({ many }) => ({
      versions:
        many(documentVersions),
    }),
  );

// Document versions
export const documentVersionsRelations =
  relations(
    documentVersions,
    ({ one, many }) => ({
      document: one(documents, {
        fields: [
          documentVersions.documentId,
        ],
        references: [
          documents.id,
        ],
      }),

      sections: many(sections),

      steps: many(steps),
    }),
  );

// Sections
export const sectionsRelations =
  relations(
    sections,
    ({ one, many }) => ({
      documentVersion:
        one(documentVersions, {
          fields: [
            sections.documentVersionId,
          ],
          references: [
            documentVersions.id,
          ],
        }),

      steps: many(steps),
    }),
  );

// Steps
export const stepsRelations =
  relations(
    steps,
    ({ one }) => ({
      documentVersion:
        one(documentVersions, {
          fields: [
            steps.documentVersionId,
          ],
          references: [
            documentVersions.id,
          ],
        }),

      section: one(sections, {
        fields: [
          steps.sectionId,
        ],
        references: [
          sections.id,
        ],
      }),
    }),
  );

// Query history
export const queryHistoryRelations =
  relations(
    queryHistory,
    ({ one, many }) => ({
      selectedStep: one(steps, {
        fields: [
          queryHistory.selectedStepId,
        ],
        references: [
          steps.id,
        ],
      }),

      selectedVersion:
        one(documentVersions, {
          fields: [
            queryHistory.selectedVersionId,
          ],
          references: [
            documentVersions.id,
          ],
        }),

      feedback: many(feedback),
    }),
  );

// Feedback
export const feedbackRelations =
  relations(
    feedback,
    ({ one }) => ({
      queryHistory: one(
        queryHistory,
        {
          fields: [
            feedback.queryHistoryId,
          ],
          references: [
            queryHistory.id,
          ],
        },
      ),
    }),
  );