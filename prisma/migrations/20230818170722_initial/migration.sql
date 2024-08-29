-- CreateEnum
CREATE TYPE "BenefitRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DELIVERED');

-- CreateTable
CREATE TABLE "Benefit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "duration" TEXT NOT NULL,
    "durationUnit" TEXT NOT NULL,

    CONSTRAINT "Benefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenefitAssignment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "benefitId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "limit" INTEGER,
    "validUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BenefitAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenefitGroup" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "benefitId" TEXT NOT NULL,
    "limit" INTEGER NOT NULL,
    "conditions" JSONB NOT NULL,

    CONSTRAINT "BenefitGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenefitRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "benefitAssignmentId" TEXT,
    "benefitGroupId" TEXT,
    "authorizedById" TEXT,
    "receiverId" TEXT NOT NULL,
    "status" "BenefitRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BenefitRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "attributes" JSONB NOT NULL,
    "managerId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BenefitGroupToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Benefit_id_key" ON "Benefit"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "_BenefitGroupToUser_AB_unique" ON "_BenefitGroupToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_BenefitGroupToUser_B_index" ON "_BenefitGroupToUser"("B");

-- AddForeignKey
ALTER TABLE "BenefitAssignment" ADD CONSTRAINT "BenefitAssignment_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "Benefit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenefitAssignment" ADD CONSTRAINT "BenefitAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenefitGroup" ADD CONSTRAINT "BenefitGroup_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "Benefit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenefitRequest" ADD CONSTRAINT "BenefitRequest_benefitAssignmentId_fkey" FOREIGN KEY ("benefitAssignmentId") REFERENCES "BenefitAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenefitRequest" ADD CONSTRAINT "BenefitRequest_benefitGroupId_fkey" FOREIGN KEY ("benefitGroupId") REFERENCES "BenefitGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenefitRequest" ADD CONSTRAINT "BenefitRequest_authorizedById_fkey" FOREIGN KEY ("authorizedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BenefitRequest" ADD CONSTRAINT "BenefitRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BenefitGroupToUser" ADD CONSTRAINT "_BenefitGroupToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "BenefitGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BenefitGroupToUser" ADD CONSTRAINT "_BenefitGroupToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
