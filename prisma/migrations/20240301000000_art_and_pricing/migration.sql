-- CreateEnum
CREATE TYPE "ArtMode" AS ENUM ('WE_CREATE', 'SELF_UPLOAD');

-- CreateEnum
CREATE TYPE "AssetKind" AS ENUM ('ART', 'LOGO');

-- AlterTable
ALTER TABLE "JobPost" ADD COLUMN "planPriceInCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "JobPost" ADD COLUMN "artMode" "ArtMode";
ALTER TABLE "JobPost" ADD COLUMN "artDesignCount" INTEGER;
ALTER TABLE "JobPost" ADD COLUMN "artPriceInCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "JobPost" ADD COLUMN "designBrief" JSONB;

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "kind" "AssetKind" NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtPriceConfig" (
    "id" TEXT NOT NULL,
    "designCount" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "priceInCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtPriceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Asset_jobId_idx" ON "Asset"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtPriceConfig_designCount_key" ON "ArtPriceConfig"("designCount");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
