import { createPrismaClient, JsonAttributes, PrismaType as Prisma } from "@libs/prisma";
import { getDurationCycle, isDeepEqual } from "@libs/utils";
import { PutResult } from "@libs/http";
import moment from "moment";

export const createUser = async (data: Prisma.UserUncheckedCreateInput): Promise<PutResult<Prisma.User>> => {
  const prisma = createPrismaClient();

  const{
    id,
    name,
    role,
    attributes,
    managerId
  } = data;

  try {
    const prevUser = await prisma.user.findUnique({ where: { id } });
    
    if (prevUser) {
      const { createdAt, ...user } = prevUser

      if(isDeepEqual(data, user)){

        return { item: prevUser, code: 200 };
      } else {

      const update = await prisma.user.update({
        data,
        where: { id },
      });
      return { item: update, code: 204 };
    }
    }
    const dataCreate: Prisma.UserUncheckedCreateInput & { manager?: any } = {
      id,
        name,
        role,
        attributes,
    }
    if(managerId){
      dataCreate.manager = {
        connectOrCreate: {
          where: {
            id: managerId as string,
          },
          create: {
            id: managerId as string,
            name: "Manager",
            attributes: { ID: managerId }
          }
        }
      }
    }
    const user = await prisma.user.create({
      data: dataCreate,
    });
    return { item: user, code: 201 };
  } catch (e) {
    console.error(e)
    return { error: e, code: 501 };
  } finally {
    prisma.$disconnect();
  }
};

export const getUser = async (
  { id }: { id: string; }
): Promise<Prisma.User | Prisma.User[] | null | void> => {
  const prisma = createPrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user;
  } catch (e) {
    console.error(e)
  } finally {
    prisma.$disconnect();
  }
};

export const searchUsers = async (): Promise<Prisma.User | Prisma.User[] | null | void> => {
  const prisma = createPrismaClient();
  try {
    const users = await prisma.user.findMany();
    return users;
  } catch (e) {
    console.error(e)
  } finally {
    prisma.$disconnect();
  }
};

export const getUserRequests = async ({ id, status }: Prisma.BenefitRequestWhereInput): Promise<Prisma.BenefitRequest[] | void> => {
  const prisma = createPrismaClient();
  try {
    const requests = await prisma.benefitRequest.findMany({
      where: { receiverId: id, status },
      include: { benefitAssignment: { select: { benefit: true } }, benefitGroup: { select: { benefit: true } }}
    });
    return requests;
  } catch (e) {
    console.error(e)
  } finally {
    prisma.$disconnect();
  }
}

export const getUserPendingRequests = async ({ id }: {id: string}): Promise<Prisma.BenefitRequest[] | void> => {
  const prisma = createPrismaClient();
  try {
    const requests = await prisma.benefitRequest.findMany({
      where: { OR: [{benefitGroup: { authorizers: { hasSome: { id }}}}, {benefitAssignment: { authorizers: { some: { id }}}}], status: "PENDING" },
      include: { benefitGroup: { select: { benefit: true } }, benefitAssignment: { select: { benefit: true } }, receiver: true }
    });
    return requests;
  } catch (e) {
    console.error(e)
  } finally {
    prisma.$disconnect();
  }
}

export const getUserAssgined = async ({ id }: { id: string; }): Promise<(Prisma.BenefitAssignment & { usable: number })[] | void> => {
  const prisma = createPrismaClient();
  try {
    const assignments = [];
    const userAssignments = await prisma.benefitAssignment.findMany({
      where: { receiverId: id },
      include: { authorizers: true, benefit: true }
    });
    for(const assignment of userAssignments){
      const requests = (await prisma.benefitRequest.aggregate({
        where: { benefitAssignmentId: assignment.id },
        _count: { id: true }
      }))._count.id

      assignments.push({
        ...assignment,
        usable: assignment.limit - requests,
      })
    }
    return assignments;
  } catch (e) {
    console.error(e)
  } finally {
    prisma.$disconnect();
  }
}

export const getUserGroups = async ({ id }: { id: string; }): Promise<any | void> => {
  const prisma = createPrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    const attributes = user?.attributes as JsonAttributes;

    const where: Prisma.BenefitGroupWhereInput & { benefit: Prisma.BenefitWhereInput} = {
      OR: [],
      benefit: {
        deletedAt: null
      },
      deletedAt: null
    }

    for (const att in attributes) {
      if (attributes[att]) {
        (where.OR as Array<any>).push({
          conditions: {
            path: [att],
            equals: attributes[att]
          }
        })
      }
    }

    const groups = await prisma.benefitGroup.findMany({
      where,
      include: { benefit: true }
    });

    const userGroups = groups.filter(group => Object.entries(group.conditions as Prisma.JsonObject).every(([key, value]) => attributes[key] === value))

    let benefitsByGroup: { [key: string]: any } = {};

    for (const group of userGroups) {
      const { cycles, currentCycle } = getDurationCycle({duration: group.benefit.duration, durationUnit: group.benefit.durationUnit as moment.unitOfTime.DurationConstructor})
      const [startMonth, endMonth] = currentCycle as number[];
      const startDate = moment().set({ date: 1, month: startMonth - 1, hour: 0, minute: 0 , s: 0, ms: 0})
      const endDate = moment(startDate).set({ month: endMonth - 1 }).subtract({ ms: 1 })

      console.log("cycle", {
        [group.benefit.durationUnit]: group.benefit.duration,
        cycles,
        currentCycle,
        startDate,
        endDate
      })

      const requests = (await prisma.benefitRequest.aggregate({
        where: {
          receiverId: id,
          createdAt: {
            gte: startDate.toDate(),
            lte: endDate.toDate(),
          },
          benefitGroup: { id: group.id, benefitId: group.benefitId },
          status: {
            in: ["PENDING", "APPROVED", "DELIVERED"]
          }
        },
        _count: { id: true }
      }))._count.id

      console.log("requests", requests)

      const limit = (benefitsByGroup[group.benefitId]?.limit ?? 0) + group.limit
      const groupUsable = group.limit - requests
      const usable = (benefitsByGroup[group.benefitId]?.usable ?? benefitsByGroup[group.benefitId]?.limit ?? 0) + groupUsable

      benefitsByGroup[group.benefitId] = {
        groups: [...benefitsByGroup[group.benefitId]?.groups ?? [], {...group, usable: groupUsable}],
        usable,
        limit,
      }
    }

    return benefitsByGroup;
  } catch (e) {
    console.error(e)
  } finally {
    prisma.$disconnect();
  }
}