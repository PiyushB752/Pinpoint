CREATE TYPE "public"."feedback_type" AS ENUM('helpful', 'not_helpful');--> statement-breakpoint
CREATE TYPE "public"."query_status" AS ENUM('GENERATED', 'NO_CONFIDENT_MATCH', 'GENERATION_FAILED');--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query_history_id" uuid NOT NULL,
	"type" "feedback_type" NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "query_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query" text NOT NULL,
	"status" "query_status" NOT NULL,
	"answer" text,
	"explanation" text,
	"selected_step_id" uuid,
	"selected_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_query_history_id_query_history_id_fk" FOREIGN KEY ("query_history_id") REFERENCES "public"."query_history"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "query_history" ADD CONSTRAINT "query_history_selected_step_id_steps_id_fk" FOREIGN KEY ("selected_step_id") REFERENCES "public"."steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "query_history" ADD CONSTRAINT "query_history_selected_version_id_document_versions_id_fk" FOREIGN KEY ("selected_version_id") REFERENCES "public"."document_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_query_history_id_idx" ON "feedback" USING btree ("query_history_id");--> statement-breakpoint
CREATE INDEX "query_history_created_at_idx" ON "query_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "query_history_status_idx" ON "query_history" USING btree ("status");