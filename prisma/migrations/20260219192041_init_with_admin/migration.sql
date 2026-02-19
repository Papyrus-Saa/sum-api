-- AlterTable
ALTER TABLE "tire_codes" ALTER COLUMN "codePublic" SET DEFAULT nextval('tire_code_seq')::text;
