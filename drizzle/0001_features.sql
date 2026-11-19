CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#9a9aa3' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "kit_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"list_id" uuid NOT NULL,
	"text" text NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kit_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"emoji" text DEFAULT '🎒' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "shot_ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"best_time" text DEFAULT 'any' NOT NULL,
	"link" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"shot" boolean DEFAULT false NOT NULL,
	"shot_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "is_assignment" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "kit_items" ADD CONSTRAINT "kit_items_list_id_kit_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."kit_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kit_items_list_idx" ON "kit_items" USING btree ("list_id");--> statement-breakpoint
-- Data: default categories (existing names in tasks/events/projects are kept too).
INSERT INTO "categories" ("name", "color", "sort_order") VALUES
  ('College', '#6E8FD8', 0), ('Cadets', '#7FA37A', 1), ('Roblox dev', '#D69A5C', 2),
  ('Music', '#B184C9', 3), ('Personal', '#5FAFAA', 4), ('Other', '#9A9AA3', 5)
ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint
INSERT INTO "categories" ("name", "sort_order")
  SELECT DISTINCT c, 100 FROM (
    SELECT "category" AS c FROM "tasks" UNION SELECT "category" FROM "events" UNION SELECT "category" FROM "projects"
  ) used
ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint
-- Data: starter cadet kit lists.
WITH l AS (
  INSERT INTO "kit_lists" ("name", "emoji", "sort_order") VALUES
    ('Parade night', '🎖️', 0), ('Field day', '🥾', 1), ('Camp', '⛺', 2)
  RETURNING "id", "name"
)
INSERT INTO "kit_items" ("list_id", "text", "sort_order")
SELECT l."id", i.text, i.ord FROM l JOIN (VALUES
  ('Parade night', 'Uniform (shirt, trousers, jumper)', 0), ('Parade night', 'Beret & badge', 1),
  ('Parade night', 'Belt', 2), ('Parade night', 'Polished boots', 3), ('Parade night', 'Cadet ID card', 4),
  ('Parade night', 'Notebook & pen', 5), ('Parade night', 'Hair kit / grips', 6), ('Parade night', 'Water bottle', 7),
  ('Field day', 'Combat clothing', 0), ('Field day', 'Boots + spare socks', 1), ('Field day', 'Waterproof jacket & trousers', 2),
  ('Field day', 'Warm layer', 3), ('Field day', 'Water (2 litres)', 4), ('Field day', 'Packed lunch & snacks', 5),
  ('Field day', 'Hat & gloves', 6), ('Field day', 'Small first aid kit', 7), ('Field day', 'Torch', 8),
  ('Field day', 'Notebook & pencil', 9), ('Field day', 'Phone (charged)', 10),
  ('Camp', 'Sleeping bag', 0), ('Camp', 'Roll mat', 1), ('Camp', 'Wash kit & towel', 2), ('Camp', 'Uniform & combats', 3),
  ('Camp', 'PT kit & trainers', 4), ('Camp', 'Underwear & socks (one per day + spare)', 5), ('Camp', 'Waterproofs', 6),
  ('Camp', 'Torch + spare batteries', 7), ('Camp', 'Mess tin & cutlery', 8), ('Camp', 'Water bottle', 9),
  ('Camp', 'Medication', 10), ('Camp', 'Cadet ID card', 11), ('Camp', 'Phone charger / power bank', 12),
  ('Camp', 'Bin bags (for wet kit)', 13)
) AS i(list, text, ord) ON i.list = l."name";
