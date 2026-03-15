/*
  Warnings:

  - The `reminderDays` column on the `deadlines` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "deadlines" ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "reminderDays",
ADD COLUMN     "reminderDays" INTEGER[] DEFAULT ARRAY[3]::INTEGER[];
