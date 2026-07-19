-- Agenda de publicação
ALTER TABLE "JobPost" ADD COLUMN "scheduledFor" TIMESTAMP(3);
ALTER TABLE "JobPost" ADD COLUMN "publishedAt" TIMESTAMP(3);

CREATE INDEX "JobPost_scheduledFor_idx" ON "JobPost"("scheduledFor");
