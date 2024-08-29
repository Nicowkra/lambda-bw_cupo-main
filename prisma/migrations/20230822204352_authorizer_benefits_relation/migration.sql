-- CreateTable
CREATE TABLE "_authorizerBenefit" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_authorizerBenefit_AB_unique" ON "_authorizerBenefit"("A", "B");

-- CreateIndex
CREATE INDEX "_authorizerBenefit_B_index" ON "_authorizerBenefit"("B");

-- AddForeignKey
ALTER TABLE "_authorizerBenefit" ADD CONSTRAINT "_authorizerBenefit_A_fkey" FOREIGN KEY ("A") REFERENCES "BenefitAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_authorizerBenefit" ADD CONSTRAINT "_authorizerBenefit_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
