-- Mercado Pago (Checkout Transparente) payment tracking on JobPost
ALTER TABLE "JobPost" ADD COLUMN "mpPaymentId" TEXT;
ALTER TABLE "JobPost" ADD COLUMN "mpStatus" TEXT;
ALTER TABLE "JobPost" ADD COLUMN "mpStatusDetail" TEXT;
ALTER TABLE "JobPost" ADD COLUMN "paidAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "JobPost_mpPaymentId_key" ON "JobPost"("mpPaymentId");
