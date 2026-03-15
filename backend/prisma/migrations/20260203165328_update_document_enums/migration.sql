/*
  Warnings:

  - The values [READY] on the enum `DocumentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [MOTION_ON_NOTICE,MOTION_EX_PARTE,COUNTER_AFFIDAVIT,FURTHER_AFFIDAVIT,WRITTEN_ADDRESS,PETITION,AGREEMENT,NOTICE_OF_APPEAL,BRIEF_OF_ARGUMENT,STATEMENT_OF_CLAIM,STATEMENT_OF_DEFENCE,WITNESS_STATEMENT] on the enum `DocumentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DocumentStatus_new" AS ENUM ('DRAFT', 'READY_TO_FILE', 'FILED', 'SERVED', 'REJECTED');
ALTER TABLE "documents" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "documents" ALTER COLUMN "status" TYPE "DocumentStatus_new" USING ("status"::text::"DocumentStatus_new");
ALTER TYPE "DocumentStatus" RENAME TO "DocumentStatus_old";
ALTER TYPE "DocumentStatus_new" RENAME TO "DocumentStatus";
DROP TYPE "DocumentStatus_old";
ALTER TABLE "documents" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "DocumentType_new" AS ENUM ('COMPLAINT', 'MOTION', 'BRIEF', 'AFFIDAVIT', 'EXHIBIT', 'PLEADING', 'DISCOVERY_REQUEST', 'DISCOVERY_RESPONSE', 'DEPOSITION', 'SUBPOENA', 'COURT_ORDER', 'JUDGMENT', 'APPEAL', 'CONTRACT', 'CORRESPONDENCE', 'INVOICE', 'RECEIPT', 'EVIDENCE', 'OTHER');
ALTER TABLE "documents" ALTER COLUMN "documentType" TYPE "DocumentType_new" USING ("documentType"::text::"DocumentType_new");
ALTER TYPE "DocumentType" RENAME TO "DocumentType_old";
ALTER TYPE "DocumentType_new" RENAME TO "DocumentType";
DROP TYPE "DocumentType_old";
COMMIT;
