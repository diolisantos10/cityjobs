-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "instagramHandle" TEXT NOT NULL,
    "igUserId" TEXT,
    "igAccessToken" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Region_slug_key" ON "Region"("slug");

-- AlterTable
ALTER TABLE "JobPost" ADD COLUMN "regionId" TEXT;

-- CreateIndex
CREATE INDEX "JobPost_regionId_idx" ON "JobPost"("regionId");

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed região inicial (São Paulo e Grande São Paulo)
INSERT INTO "Region" ("id", "name", "slug", "instagramHandle", "active", "isDefault", "updatedAt")
VALUES ('reg_sp_default', 'São Paulo e Grande São Paulo', 'sp', '@cityjobs.sp', true, true, CURRENT_TIMESTAMP);
