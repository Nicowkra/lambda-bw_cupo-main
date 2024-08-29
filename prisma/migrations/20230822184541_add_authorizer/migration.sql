/*
  Warnings:

  - You are about to drop the `_BenefitGroupToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_BenefitGroupToUser" DROP CONSTRAINT "_BenefitGroupToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_BenefitGroupToUser" DROP CONSTRAINT "_BenefitGroupToUser_B_fkey";

-- DropTable
DROP TABLE "_BenefitGroupToUser";

-- CreateTable
CREATE TABLE "_authorizer" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_authorizer_AB_unique" ON "_authorizer"("A", "B");

-- CreateIndex
CREATE INDEX "_authorizer_B_index" ON "_authorizer"("B");

-- AddForeignKey
ALTER TABLE "_authorizer" ADD CONSTRAINT "_authorizer_A_fkey" FOREIGN KEY ("A") REFERENCES "BenefitGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_authorizer" ADD CONSTRAINT "_authorizer_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
