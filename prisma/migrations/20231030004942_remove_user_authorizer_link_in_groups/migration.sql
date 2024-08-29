/*
  Warnings:

  - You are about to drop the `_authorizer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_authorizer" DROP CONSTRAINT "_authorizer_A_fkey";

-- DropForeignKey
ALTER TABLE "_authorizer" DROP CONSTRAINT "_authorizer_B_fkey";

-- AlterTable
ALTER TABLE "BenefitGroup" ADD COLUMN     "authorizers" JSONB[];

-- AlterTable
ALTER TABLE "BenefitRequest" ADD COLUMN     "authorizers" JSONB[];

-- DropTable
DROP TABLE "_authorizer";
