import { createPrismaClient, PrismaType as Prisma } from "@libs/prisma";
import { errorHandler, createResponse, Response, createErrorResponse, LambdaAPIGatewayEvent, authenticate, Role } from "@libs/http";
import { APIGatewayEvent } from "aws-lambda";

const postHandler = async (event: APIGatewayEvent): Promise<Response> => {
  if (!event.body) return;
  const prisma = createPrismaClient();
  const {
    id,
    limit,
    conditions,
    authorizers,
  }: Prisma.BenefitGroupUncheckedCreateInput = JSON.parse(event.body);

  const benefitId = event.pathParameters?.benefitId as string;

  try {
    const prevBenefitGroup = await prisma.benefitGroup.findUnique({ where: { id } });

    if (prevBenefitGroup) {
      const benefitGroup= await prisma.benefitGroup.update({
        data: {
          limit,
          conditions,
          authorizers,
          deletedAt: null
        },
        where: { id },
      });
      return createResponse(benefitGroup);
    } else {
    const data: Prisma.BenefitGroupUncheckedCreateInput = {
      id,
      benefitId,
      limit,
      conditions,
      authorizers
    }
    const benefitGroup = await prisma.benefitGroup.create({
      data,
    });
    return createResponse(benefitGroup);
  }
  } catch (e) {
    return errorHandler(e, event, prisma);
  } finally {
    prisma.$disconnect();
  }
};

const getHandler = async (
  event: APIGatewayEvent
): Promise<Record<string, any> | void> => {
  const id = event.pathParameters?.id;
  const benefitId = event.pathParameters?.benefitId;
  //const { all } = event.queryStringParameters as APIGatewayProxyEventQueryStringParameters;
  const prisma = createPrismaClient();

  try {
    if (id === "search") {
      const where: Prisma.BenefitGroupWhereInput = { benefitId, deletedAt: null };
      const benefitGroups = await prisma.benefitGroup.findMany({
        where
      });
      return createResponse(benefitGroups);
    } else {
      const benefitGroup = await prisma.benefitGroup.findUnique({
        where: { id },
      });
      return createResponse(benefitGroup);
    }
  } catch (e) {
    return errorHandler(e, event, prisma);
  } finally {
    prisma.$disconnect();
  }
};


const deleteHandler = async (
  event: APIGatewayEvent
): Promise<Prisma.BatchPayload | Response> => {
  const id = event.pathParameters?.id;
  const benefitId = event.pathParameters?.benefitId;

  const prisma = createPrismaClient();

  try {
    if (benefitId === "all") {
      return await prisma.benefitGroup.updateMany({ data: { deletedAt: new Date()}});
    }
    if (id) {
      await prisma.benefitGroup.update({
        where: {
          id,
        }, data: { deletedAt: new Date()}
      });
    } else {
      return await prisma.benefitGroup.updateMany({
        where: { benefitId },
        data: { deletedAt: new Date()}
      });
    }
  } catch (e) {
    return errorHandler(e, event, prisma);
  } finally {
    prisma.$disconnect();
  }
};

const benefitGroupHandler = async (event: LambdaAPIGatewayEvent) => {
  if (!event.pathParameters?.benefitId) return createErrorResponse(429, { error: "Missing 'benefitId' path parameter." })

  switch (event.requestContext.http.method) {
    case "GET": {
      return authenticate(event, getHandler, [Role.User])
    }
    case "POST": {
      if (!event.body) return createErrorResponse(429, { error: "Missing body." })
        return authenticate(event, postHandler, [Role.User])
    }
    case "DELETE": {
      return authenticate(event, deleteHandler, [Role.User])
    }
  }
}

exports.benefitGroupHandler = benefitGroupHandler;
