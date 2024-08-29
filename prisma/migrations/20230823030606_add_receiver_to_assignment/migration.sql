/*
  Warnings:

  - Added the required column `receiverId` to the `BenefitAssignment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BenefitAssignment" ADD COLUMN     "receiverId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "BenefitAssignment" ADD CONSTRAINT "BenefitAssignment_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
