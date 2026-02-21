-- Allow duplicate ingests while keeping lookups indexed.
DROP INDEX IF EXISTS "items_url_key";
DROP INDEX IF EXISTS "items_type_raw_input_key";

CREATE INDEX IF NOT EXISTS "items_url_idx" ON "items"("url");
CREATE INDEX IF NOT EXISTS "items_type_raw_input_idx" ON "items"("type", "raw_input");
