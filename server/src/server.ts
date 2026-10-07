import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import dotenv from "dotenv";

import { healthRoutes } from "./modules/health/health.routes.js";
import { documentRoutes } from "./modules/documents/document.routes.js";
import { documentUploadRoutes } from "./modules/documents/document-upload.routes.js";
import { queryRoutes } from "./modules/query/query.routes.js";
import { feedbackRoutes } from "./modules/feedback/feedback.routes.js";
import { recoverIngestion } from "./ingestion/recover-ingestion.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";

dotenv.config();

const app = Fastify({
  logger: true,
});

async function startServer() {
  try {
    await app.register(helmet);

    await app.register(cors, {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
    });

    await app.register(multipart, {
      limits: {
        files: 1,
        fields: 0,
        fileSize: 20 * 1024 * 1024,
      },
    });

    await app.register(healthRoutes, {
      prefix: "/v1",
    });

    await app.register(documentRoutes, {
      prefix: "/v1",
    });

    await app.register(documentUploadRoutes, {
      prefix: "/v1",
    });

    await app.register(queryRoutes, {
      prefix: "/v1",
    });

    await app.register(feedbackRoutes, {
      prefix: "/v1",
    });

    await app.register(adminRoutes, {
      prefix: "/v1",
    });

    await recoverIngestion();

    const port = Number(process.env.PORT) || 4000;

    const host = process.env.HOST || "0.0.0.0";

    await app.listen({
      port,
      host,
    });

    app.log.info(`Pinpoint API running on http://localhost:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void startServer();
