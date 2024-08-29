import { PrismaType as Prisma } from "@libs/prisma";
import { createResponse, Response, createErrorResponse, errorHandler, LambdaAPIGatewayEvent, authenticate, Role } from "@libs/http";
import { APIGatewayEvent } from "aws-lambda";
import { assignBenefit, getBenefitAssignment } from "./service/benefit-assignment";

const postHandler = async (event: APIGatewayEvent): Promise<Response> => {
  if (!event.body) return;
  const {
    assignedById,
    limit,
    validUntil,
    authorizers,
    receiverId
  }: Omit<Prisma.BenefitAssignmentUncheckedCreateInput, "authorizers"> & { authorizers: string[] } = JSON.parse(event.body);

  const benefitId = event.pathParameters?.benefitId as string;

  const benefitAssignment = await assignBenefit({
    benefitId,
    assignedById,
    limit,
    validUntil,
    authorizers,
    receiverId
  });

  if (!benefitAssignment) return errorHandler("Error creating benefit assignment", event)

  return createResponse(benefitAssignment);
};

const getHandler = async (
  event: APIGatewayEvent
): Promise<Record<string, any> | void> => {
  const id = event.pathParameters?.id;
  const benefitId = event.pathParameters?.benefitId;

  const benefitAssignment = await getBenefitAssignment({
    id,
    benefitId,
  });
  return createResponse(benefitAssignment);
};

const benefitAssignmentHandler = async (event: LambdaAPIGatewayEvent) => {
  if (!event.pathParameters?.benefitId) return createErrorResponse(429, { error: "Missing 'benefitId' path parameter." })

  switch (event.requestContext.http.method) {
    case "GET": {
      return authenticate(event, getHandler, [Role.User])
    }
    case "POST": {
      if (!event.body) return createErrorResponse(429, { error: "Missing body." })
        return authenticate(event, postHandler, [Role.User])
    }
  }
}

exports.benefitAssignmentHandler = benefitAssignmentHandler;
