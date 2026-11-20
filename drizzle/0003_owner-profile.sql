-- Data only. Keeps Jacob's existing dashboard personal now that the app is a
-- template: sets his name and timetable group in settings, but only on his
-- database (recognised by his projects or timetable). Does nothing elsewhere.
UPDATE "settings"
SET "data" = "data"
  || CASE WHEN "data" ? 'ownerName' THEN '{}'::jsonb ELSE '{"ownerName": "Jacob"}'::jsonb END
  || CASE WHEN "data" ? 'timetableGroup' THEN '{}'::jsonb ELSE '{"timetableGroup": "3-1b"}'::jsonb END
WHERE EXISTS (SELECT 1 FROM "projects" WHERE "name" IN ('Northminster', 'Westbridge'))
   OR EXISTS (SELECT 1 FROM "events" WHERE "kind" = 'lesson' AND "location" IN ('K303', 'K313', 'A251'));
