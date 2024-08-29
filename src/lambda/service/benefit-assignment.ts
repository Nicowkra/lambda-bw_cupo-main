import { createPrismaClient, PrismaType as Prisma } from "@libs/prisma";

export const assignBenefit = async ({
  assignedById,
  limit,
  validUntil,
  benefitId,
  authorizers,
  receiverId
}: Omit<Prisma.BenefitAssignmentUncheckedCreateInput, "authorizers"> & { authorizers: string[] }): Promise<Prisma.BenefitAssignment | void> => {
  const prisma = createPrismaClient();

  try {
    const data: Prisma.BenefitAssignmentUncheckedCreateInput = {
      benefitId,
      assignedById,
      limit: Number(limit),
      validUntil: new Date(validUntil),
      receiverId
    }

    if (authorizers?.length) {
      data.authorizers = {
        connectOrCreate: authorizers.map(id => ({ where: { id }, create: { id, name: "Authorizer", attributes: {}} })),
      }
    }

    const benefitAssignment = await prisma.benefitAssignment.create({
      data,
      include: {
        authorizers: true
      }
    });
    return benefitAssignment
  } catch (e) {
    console.error(e)
  } finally {
    prisma.$disconnect();
  }
};

export const getBenefitAssignment = async (
  { id, benefitId }: { id?: string; benefitId?: string }
): Promise<Prisma.BenefitAssignment | Prisma.BenefitAssignment[] | null | void> => {
  const prisma = createPrismaClient();

  try {
    if (id) {
      const benefitAssignment = await prisma.benefitAssignment.findUnique({
        where: { id },
        include: { authorizers: true }
      });
      return benefitAssignment;
    } else {
      const benefitAssignments = await prisma.benefitAssignment.findMany({
        where: {
          benefitId
        },
        include: { authorizers: true }
      });
      return benefitAssignments;
    }
  } catch (e) {
    console.error(e)
  } finally {
    prisma.$disconnect();
  }
};
