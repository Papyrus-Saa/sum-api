-- Create sequence starting at 100
CREATE SEQUENCE IF NOT EXISTS tire_code_seq START WITH 100 INCREMENT BY 1;

-- Set default for codePublic to use the sequence
ALTER TABLE tire_codes
  ALTER COLUMN "codePublic" SET DEFAULT nextval('tire_code_seq')::text;

-- Sync sequence with existing data (if any)
SELECT setval('tire_code_seq', COALESCE((
  SELECT MAX("codePublic"::integer)
  FROM tire_codes
  WHERE "codePublic" ~ '^\d+$'
), 99) + 1);
