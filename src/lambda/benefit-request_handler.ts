import { createPrismaClient, PrismaType as Prisma } from "@libs/prisma";
import { errorHandler, createResponse, Response, createErrorResponse, notFoundResponse, LambdaAPIGatewayEvent, getSubpath, authenticate, Role } from "@libs/http";
import { APIGatewayEvent } from "aws-lambda";

const postHandler = async (event: LambdaAPIGatewayEvent): Promise<Response> => {
  if (!event.body) return;
  const id = event.pathParameters?.id;
  const subpath = getSubpath(event, 4)
  const prisma = createPrismaClient();

  if(subpath === 'status'){
    const { status, authorizedById, approved } = JSON.parse(event.body);
    try{
      await prisma.benefitRequest.update({
        where: { id },
        data: {
          status,
          approved,
          authorizedById,
        }
      })
    } catch (e) {
      return errorHandler(e, event, prisma);
    } finally {
      prisma.$disconnect();
    }
  }

  const {
    benefitAssignmentId,
    benefitGroupId,
    receiverId,
    authorizers
  }: Prisma.BenefitRequestUncheckedCreateInput = JSON.parse(event.body);

  try {
    let benefitOrigin: (Prisma.BenefitAssignment & { authorizers: Prisma.User[]}) | Prisma.BenefitGroup | null;
    let previousRequests: number;

    if(benefitGroupId){
      benefitOrigin = await prisma.benefitGroup.findUnique({ where: { id: benefitGroupId }})
      previousRequests = (await prisma.benefitRequest.aggregate({
        where: {
            benefitGroupId,
            receiverId
        },
        _count: {
          id: true
        }
      }))._count.id
    } else {
      benefitOrigin = await prisma.benefitAssignment.findUnique({ where: { id: benefitAssignmentId as string }, include: { authorizers: true } })
      previousRequests = (await prisma.benefitRequest.aggregate({
        where: {
          benefitAssignmentId,
          receiverId
        },
        _count: {
          id: true
        }
      }))._count.id
    }
    
    if(benefitOrigin?.limit as number <= previousRequests){
      return createErrorResponse(409, { error: "No limit left." })
    }

    const data: Prisma.BenefitRequestUncheckedCreateInput = {
      benefitAssignmentId,
      benefitGroupId,
      receiverId,
      authorizers
    }

    if (!benefitOrigin?.authorizers?.length) {
      data.status = "APPROVED"
      data.approved = true
    }

    const benefitRequest = await prisma.benefitRequest.create({
      data,
    });
    return createResponse(benefitRequest);
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
  const originId = event.pathParameters?.originId;
  const prisma = createPrismaClient();

  try {

    if (id) {
      const benefitRequest = await prisma.benefitRequest.findUnique({
        where: { id },
      });
      return createResponse(benefitRequest);
    } else {
      const benefitRequests = await prisma.benefitRequest.findMany({
        where: {
          OR: [
            {
              benefitAssignmentId: originId
            },
            {
              benefitGroupId: originId
            }
          ]
        }
      });
      return createResponse(benefitRequests);
    }
  } catch (e) {
    return errorHandler(e, event, prisma);
  } finally {
    prisma.$disconnect();
  }
};

const benefitRequestHandler = async (event: LambdaAPIGatewayEvent): Promise<Response | void> => {
  switch (event.requestContext.http.method) {
    case "GET": {
      if (!event.pathParameters?.originId) return createErrorResponse(429, { error: "Missing 'benefitAssignmentId'/'benefitGroupId' path parameter." })
        return authenticate(event, getHandler, [Role.User])
    }
    case "POST": {
      const subpath = getSubpath(event, 4)
      const body = JSON.parse(event.body as string)
      if (!event.pathParameters?.benefitId) return createErrorResponse(429, { error: "Missing 'benefitId' path parameter." })
      if (!body) return createErrorResponse(429, { error: "Missing body." })
      else if (subpath !== "status" && !body.benefitGroupId && !body.benefitAssignmentId) return createErrorResponse(429, { error: "Missing 'benefitAssignmentId' or 'benefitGroupId' in body." })
        return authenticate(event, postHandler, [Role.User])
    }
    default: {
      return notFoundResponse()
    }
  }
}

exports.benefitRequestHandler = benefitRequestHandler;
