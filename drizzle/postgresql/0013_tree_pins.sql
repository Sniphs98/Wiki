CREATE TABLE "tree_pin" (
	"path" text PRIMARY KEY NOT NULL,
	"pinned_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Pins used to be per person: what admins had pinned becomes pinned for everyone.
INSERT INTO "tree_pin" ("path", "pinned_by")
SELECT "page_pin"."path", MIN("page_pin"."user_id") FROM "page_pin"
JOIN "user" ON "user"."id" = "page_pin"."user_id" WHERE "user"."role" = 'admin'
GROUP BY "page_pin"."path"
ON CONFLICT DO NOTHING;
--> statement-breakpoint
DROP TABLE "page_pin" CASCADE;--> statement-breakpoint
ALTER TABLE "tree_pin" ADD CONSTRAINT "tree_pin_pinned_by_user_id_fk" FOREIGN KEY ("pinned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;