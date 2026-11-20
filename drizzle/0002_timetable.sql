ALTER TABLE "events" ADD COLUMN "kind" text DEFAULT 'event' NOT NULL;--> statement-breakpoint
-- Data: Jacob's college timetable (group 3-1b) as weekly lessons, starting the
-- week of Mon 16 Nov 2026. Only added if there are no lessons yet.
INSERT INTO "events" ("title", "date", "start_time", "end_time", "location", "category", "repeat", "kind")
SELECT v.title, v.date::date, v.s, v.e, v.room, 'College', 'weekly', 'lesson'
FROM (VALUES
  ('Lesson', '2026-11-17', '10:15', '11:30', 'K303'),
  ('Lesson', '2026-11-17', '11:45', '12:45', 'K305'),
  ('Lesson', '2026-11-17', '13:45', '15:15', 'M223'),
  ('Lesson', '2026-11-19', '10:45', '12:15', 'A251'),
  ('Lesson', '2026-11-19', '14:15', '15:30', 'M223'),
  ('Lesson', '2026-11-20', '10:00', '11:45', 'K313'),
  ('Lesson', '2026-11-20', '12:00', '13:30', 'M223'),
  ('Lesson', '2026-11-20', '14:30', '16:00', 'K313')
) AS v(title, date, s, e, room)
WHERE NOT EXISTS (SELECT 1 FROM "events" WHERE "kind" = 'lesson');
