/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `firms` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inviteCode` to the `firms` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add inviteCode column as nullable first
ALTER TABLE "firms" ADD COLUMN "inviteCode" TEXT;

-- Step 2: Generate unique codes for existing firms
DO $$
DECLARE
    firm_record RECORD;
    random_code TEXT;
BEGIN
    FOR firm_record IN SELECT id FROM "firms" WHERE "inviteCode" IS NULL
    LOOP
        -- Generate a random 8-character code with dash
        random_code := CONCAT(
            UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)),
            '-',
            UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4))
        );
        
        UPDATE "firms" 
        SET "inviteCode" = random_code 
        WHERE id = firm_record.id;
    END LOOP;
END $$;

-- Step 3: Make the column NOT NULL and add unique constraint
ALTER TABLE "firms" ALTER COLUMN "inviteCode" SET NOT NULL;
CREATE UNIQUE INDEX "firms_inviteCode_key" ON "firms"("inviteCode");

