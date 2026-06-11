-- CreateEnum
CREATE TYPE "Niche" AS ENUM ('VAREJO', 'SAUDE', 'ESCRITORIO', 'RESTAURANTE', 'LOGISTICA');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('CLT', 'PJ', 'FREELANCER', 'TEMPORARIO', 'ESTAGIO', 'OUTRO');

-- CreateEnum
CREATE TYPE "ApplicationMethod" AS ENUM ('WHATSAPP', 'LINK', 'EMAIL', 'OTHER');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'AWAITING_PAYMENT', 'PAID', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "contactName" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPost" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "companyName" TEXT NOT NULL,
    "cnpj" TEXT,
    "roleTitle" TEXT NOT NULL,
    "niche" "Niche" NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'São Paulo',
    "contractType" "ContractType" NOT NULL,
    "salary" TEXT NOT NULL,
    "benefits" TEXT,
    "applicationMethod" "ApplicationMethod" NOT NULL,
    "applicationWhatsapp" TEXT,
    "applicationLink" TEXT,
    "selectedPlanDays" INTEGER NOT NULL,
    "priceInCents" INTEGER NOT NULL,
    "paymentLink" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "moderationNotes" TEXT,
    "trustFlags" JSONB,
    "storyCopy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanConfig" (
    "id" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "priceInCents" INTEGER NOT NULL,
    "paymentLink" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobPost_status_idx" ON "JobPost"("status");

-- CreateIndex
CREATE INDEX "JobPost_niche_idx" ON "JobPost"("niche");

-- CreateIndex
CREATE INDEX "JobPost_createdAt_idx" ON "JobPost"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlanConfig_days_key" ON "PlanConfig"("days");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
