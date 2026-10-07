CREATE TYPE "public"."ingestion_status" AS ENUM('queued', 'processing', 'indexed', 'failed');--> statement-breakpoint
ALTER TABLE "document_versions" ADD COLUMN "ingestion_status" "ingestion_status" DEFAULT 'queued' NOT NULL;--> statement-breakpoint
ALTER TABLE "document_versions" ADD COLUMN "original_filename" text;--> statement-breakpoint
CREATE INDEX "document_versions_document_id_idx" ON "document_versions" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_versions_status_idx" ON "document_versions" USING btree ("status","ingestion_status");--> statement-breakpoint
CREATE INDEX "documents_title_idx" ON "documents" USING btree ("title");--> statement-breakpoint
CREATE UNIQUE INDEX "sections_version_ordinal_unique" ON "sections" USING btree ("document_version_id","ordinal");--> statement-breakpoint
CREATE INDEX "steps_document_version_id_idx" ON "steps" USING btree ("document_version_id");--> statement-breakpoint
CREATE INDEX "steps_section_id_idx" ON "steps" USING btree ("section_id");--> statement-breakpoint
CREATE UNIQUE INDEX "steps_section_ordinal_unique" ON "steps" USING btree ("section_id","ordinal");