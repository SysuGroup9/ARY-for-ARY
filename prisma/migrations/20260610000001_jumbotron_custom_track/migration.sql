-- Replace fixed trackId preset with per-race custom centerline control points.
-- trackId column is kept for backward compat but no longer used by Jumbotron.
ALTER TABLE "Race" ADD COLUMN "trackCenterlineJson" TEXT NULL DEFAULT NULL;
