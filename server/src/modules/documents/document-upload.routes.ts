import type { FastifyInstance } from "fastify";

import { createHash } from "node:crypto";
import path from "node:path";
import { unlink } from "node:fs/promises";

import { db } from "../../db/client.js";
import {
  documents,
  documentVersions,
} from "../../db/schema.js";
import { storeDocument } from "../../storage/document-storage.js";
import { IngestionService } from "../../ingestion/ingestion-service.js";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".docx",
  ".md",
  ".markdown",
  ".html",
  ".htm",
]);

const TEXT_EXTENSIONS = new Set([
  ".md",
  ".markdown",
  ".html",
  ".htm",
]);

const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/html",
  "application/octet-stream",
]);

const DOCX_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/octet-stream",
]);

function validateFile(
  filename: string,
  mimetype: string,
  buffer: Buffer,
): string | null {
  const extension = path.extname(filename).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return "Unsupported file extension. Allowed formats: PDF, DOCX, Markdown, and HTML.";
  }

  if (buffer.length === 0) {
    return "The uploaded file is empty.";
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return "The file exceeds the 20 MB limit.";
  }

  if (extension === ".pdf") {
    if (mimetype !== "application/pdf") {
      return "The PDF content type is invalid.";
    }

    if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return "The file does not have a valid PDF signature.";
    }
  }

  if (extension === ".docx") {
    if (!DOCX_MIME_TYPES.has(mimetype)) {
      return "The DOCX content type is invalid.";
    }

    if (buffer.subarray(0, 2).toString("ascii") !== "PK") {
      return "The file does not have a valid DOCX container signature.";
    }
  }

  if (TEXT_EXTENSIONS.has(extension)) {
    if (!TEXT_MIME_TYPES.has(mimetype)) {
      return "The text document content type is invalid.";
    }

    // Reject binary-looking content only for formats expected to be text.
    if (buffer.includes(0)) {
      return "The text document contains unsupported binary content.";
    }

    const text = buffer.toString("utf8");

    if (text.includes("\uFFFD")) {
      return "The file may not contain valid UTF-8 text.";
    }
  }

  return null;
}

function isFileTooLargeError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if (!("code" in error)) {
    return false;
  }

  return (
    error.code === "FST_REQ_FILE_TOO_LARGE" ||
    error.code === "FST_PARTS_LIMIT"
  );
}

export async function documentUploadRoutes(
  app: FastifyInstance,
) {
  const ingestionService =
    new IngestionService();

  app.post(
    "/documents/upload",
    async (request, reply) => {
      let storedPath: string | undefined;

      try {
        const file = await request.file({
          limits: {
            files: 1,
            fields: 0,
            fileSize: MAX_FILE_SIZE,
          },
        });

        if (!file) {
          return reply.status(400).send({
            status: "error",
            message:
              'Upload one document using the multipart field "file".',
          });
        }

        if (file.fieldname !== "file") {
          file.file.resume();

          return reply.status(400).send({
            status: "error",
            message:
              'The upload field must be named "file".',
          });
        }

        const originalFilename =
          file.filename;

        // Reject paths rather than allowing a client-supplied path to be used.
        if (
          !originalFilename ||
          originalFilename !==
            path.basename(originalFilename) ||
          originalFilename.includes("/") ||
          originalFilename.includes("\\") ||
          originalFilename === "." ||
          originalFilename === ".."
        ) {
          file.file.resume();

          return reply.status(400).send({
            status: "error",
            message: "Invalid filename.",
          });
        }

        const extension =
          path.extname(originalFilename).toLowerCase();

        if (!ALLOWED_EXTENSIONS.has(extension)) {
          file.file.resume();

          return reply.status(400).send({
            status: "error",
            message:
              "Unsupported file extension.",
          });
        }

        const buffer =
          await file.toBuffer();

        if (
          file.file.truncated ||
          buffer.length > MAX_FILE_SIZE
        ) {
          return reply.status(413).send({
            status: "error",
            message:
              "The file exceeds the 20 MB limit.",
          });
        }

        const validationError =
          validateFile(
            originalFilename,
            file.mimetype,
            buffer,
          );

        if (validationError) {
          return reply.status(400).send({
            status: "error",
            message: validationError,
          });
        }

        const title =
          path.basename(
            originalFilename,
            extension,
          );

        const contentHash =
          createHash("sha256")
            .update(buffer)
            .digest("hex");

        const storageResult =
          await storeDocument(
            buffer,
            extension,
          );

        storedPath =
          storageResult.absolutePath;

        const created =
          await db.transaction(
            async (tx) => {
              const [document] =
                await tx
                  .insert(documents)
                  .values({ title })
                  .returning({
                    id: documents.id,
                    title: documents.title,
                  });

              const [version] =
                await tx
                  .insert(
                    documentVersions,
                  )
                  .values({
                    documentId:
                      document.id,
                    version: "1.0",
                    status: "draft",
                    ingestionStatus:
                      "queued",
                    originalFilename,
                    sourcePath:
                      storageResult.storageKey,
                    contentHash,
                  })
                  .returning({
                    id: documentVersions.id,
                    version:
                      documentVersions.version,
                    status:
                      documentVersions.status,
                    ingestionStatus:
                      documentVersions.ingestionStatus,
                  });

              return {
                document,
                version,
              };
            },
          );

        // The file and database record have both
        // been created successfully.
        storedPath = undefined;

        await ingestionService.ingestDocumentVersion(
          created.version.id,
        );

        return reply.status(201).send({
          status: "indexed",
          message:
            "Document uploaded and indexed successfully.",
          document: created.document,
          version: {
            ...created.version,
            ingestionStatus:
              "indexed",
          },
          originalFilename,
          contentHash,
        });
      } catch (error) {
        if (storedPath) {
          await unlink(storedPath).catch(
            (cleanupError: unknown) => {
              request.log.error(
                { err: cleanupError },
                "Failed to remove uploaded file after an error",
              );
            },
          );
        }

        if (
          isFileTooLargeError(error)
        ) {
          return reply.status(413).send({
            status: "error",
            message:
              "The file exceeds the 20 MB limit.",
          });
        }

        request.log.error(
          { err: error },
          "Document upload failed",
        );

        return reply.status(500).send({
          status: "error",
          message:
            "Document upload failed.",
        });
      }
    },
  );
}