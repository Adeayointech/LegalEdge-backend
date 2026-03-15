-- AlterTable
ALTER TABLE "hearings" ADD COLUMN     "reminderDays" INTEGER[] DEFAULT ARRAY[1, 3, 7]::INTEGER[],
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false;
