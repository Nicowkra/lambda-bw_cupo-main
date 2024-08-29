/*
  Warnings:

  - Made the column `limit` on table `BenefitAssignment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "BenefitAssignment" ALTER COLUMN "limit" SET NOT NULL;
