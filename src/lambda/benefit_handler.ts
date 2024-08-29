import { createPrismaClient, PrismaType as Prisma } from "@libs/prisma";
import { errorHandler, createResponse, Response, createErrorResponse, notFoundResponse, LambdaAPIGatewayEvent, authenticate, Role } from "@libs/http";
import { APIGatewayEvent } from "aws-lambda";

const postHandler = async (event: APIGatewayEvent): Promise<Response> => {
  if (!event.body) return;
  const prisma = createPrismaClient();
  const {
    id,
    name,
    description,
    image,
    duration,
    durationUnit,
  }: Prisma.BenefitUncheckedCreateInput = JSON.parse(event.body);

  try {
    const prevBenefit = await prisma.benefit.findUnique({ where: { id } });
    if (prevBenefit) {
      const benefit = await prisma.benefit.update({
        data: {
          name,
          description,
          image,
          duration,
          durationUnit,
          deletedAt: null
        },
        where: { id },
      });
      return createResponse(benefit);
    }
    const benefit = await prisma.benefit.create({
      data: {
        id,
        name,
        description,
        image,
        duration,
        durationUnit,
      },
    });
    return createResponse(benefit);
  } catch (e) {
    return errorHandler(e, event, prisma);
  } finally {
    prisma.$disconnect();
  }
};

const getHandler = async (
  event: APIGatewayEvent
): Promise<Response | void> => {
  const id = event.pathParameters?.id;
  const prisma = createPrismaClient();

  try {
    if (id === "search") {
      const benefits = await prisma.benefit.findMany({
        where: {
          deletedAt: null
        }
      });
      return createResponse(benefits);
    } else {
      const benefit = await prisma.benefit.findUnique({
        where: { id },
      });
      return createResponse(benefit);
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

  const prisma = createPrismaClient();

  try {
    if (id) {
      await prisma.benefit.update({
        where: {
          id,
        },
        data: {
          deletedAt: new Date()
        }
      });
    } 
  } catch (e) {
    return errorHandler(e, event, prisma);
  } finally {
    prisma.$disconnect();
  }
};

const benefitHandler = async (event: LambdaAPIGatewayEvent): Promise<Response | Prisma.BatchPayload> => {
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
    default: {
      return notFoundResponse();
    }
  }
}

exports.benefitHandler = benefitHandler;
