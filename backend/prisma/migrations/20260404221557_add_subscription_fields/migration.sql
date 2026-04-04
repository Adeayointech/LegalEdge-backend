-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "firms" ADD COLUMN     "gracePeriodEndsAt" TIMESTAMP(3),
ADD COLUMN     "lastPaymentAt" TIMESTAMP(3),
ADD COLUMN     "paystackCustomerCode" TEXT,
ADD COLUMN     "subscriptionEndsAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);
