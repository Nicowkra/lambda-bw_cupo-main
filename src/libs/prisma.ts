import {
  PrismaClient as PClient,
  Prisma,
  BenefitGroup as BenefitGroupPrisma,
  BenefitRequest as BenefitRequestPrisma,
  Benefit as BenefitPrisma,
  BenefitAssignment as BenefitAssignmentPrisma,
  User as UserPrisma,
  BenefitRequestStatus as BenefitRequestStatusPrisma,
  PrismaClient,
} from "@prisma/client";

let prisma: PrismaClient;

export function createPrismaClient(): PClient {
  if (!prisma) prisma = new PClient();
  prisma.$use(async (params, next) => {
    const before = Date.now()

    const result = await next(params)

    const after = Date.now()

    console.log(`Query ${params.model}.${params.action} took ${after - before}ms`)

    return result
  })
  return prisma;
};

export namespace PrismaType {
  export type PrismaClient = PClient;
  export type JsonObject = Prisma.JsonObject;
  export type BenefitGroup = BenefitGroupPrisma;
  export import BenefitGroupUncheckedCreateInput = Prisma.BenefitGroupUncheckedCreateInput;
  export import BenefitGroupWhereInput = Prisma.BenefitGroupWhereInput;
  export type BenefitRequest = BenefitRequestPrisma;
  export import BenefitRequestUncheckedCreateInput = Prisma.BenefitRequestUncheckedCreateInput;
  export import BenefitRequestWhereInput = Prisma.BenefitRequestWhereInput;
  export type Benefit = BenefitPrisma;
  export import BenefitUncheckedCreateInput = Prisma.BenefitUncheckedCreateInput;
  export import BenefitUncheckedCreateWithoutGroupsInput = Prisma.BenefitUncheckedCreateWithoutGroupsInput;
  export import BenefitWhereInput = Prisma.BenefitWhereInput;
  export type BenefitAssignment = BenefitAssignmentPrisma;
  export import BenefitAssignmentUncheckedCreateInput = Prisma.BenefitAssignmentUncheckedCreateInput;
  export import BenefitAssignmentWhereInput = Prisma.BenefitAssignmentWhereInput;
  export type User = UserPrisma;
  export import UserUncheckedCreateInput = Prisma.UserUncheckedCreateInput;
  export import UserWhereInput = Prisma.UserWhereInput;
  export import BatchPayload = Prisma.BatchPayload;
}

export const BenefitRequestStatus = BenefitRequestStatusPrisma;

export interface JsonAttributes extends Prisma.JsonObject {
  ID: string;
  Area?: string;
  Job?: string;
  Supervisor?: string;
  Group?: string;
}

export function getSearchJsonAttributes({ path: paramPath, searchType, value }: { attributes: Prisma.JsonObject; path: string; value: string; searchType: "equals" | "string_contains" | "string_starts_with" | "string_ends_with"; }) {
  const path = paramPath.split('.');
  const jsonSearch = {
    path,
    [searchType]: value
  }

  return jsonSearch
}