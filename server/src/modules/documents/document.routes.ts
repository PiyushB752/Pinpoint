
import type { FastifyInstance } from "fastify";

import {
  getDocumentById,
  listDocuments,
} from "./document.repository.js";

export async function documentRoutes(app: FastifyInstance) {
  app.get("/documents", async (_request, reply) => {
    const documents = await listDocuments();

    return reply.send({
      documents,
      total: documents.length,
    });
  });

  app.get<{ Params: { id: string } }>(
    "/documents/:id",
    async (request, reply) => {
      const { id } = request.params;

      const isValidUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          id,
        );

      if (!isValidUuid) {
        return reply.status(400).send({
          status: "error",
          message: "Invalid document ID.",
        });
      }

      const document = await getDocumentById(id);

      if (!document) {
        return reply.status(404).send({
          status: "error",
          message: "Document not found.",
        });
      }

      return reply.send({ document });
    },
  );

  app.post("/documents", async (_request, reply) => {
    return reply.status(501).send({
      status: "not_implemented",
      message:
        "Use POST /v1/documents/upload to upload a document.",
    });
  });
}