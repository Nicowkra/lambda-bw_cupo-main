import { PrismaType as Prisma } from "@libs/prisma";
import { errorHandler, createResponse, Response, createErrorResponse, notFoundResponse, LambdaAPIGatewayEvent, authenticate, getSubpath, Role } from "@libs/http";
import { createUser, getUser, getUserAssgined, getUserGroups, getUserPendingRequests, getUserRequests, searchUsers } from "./service/user";
import { BenefitRequestStatus } from "@prisma/client";

const putHandler = async (event: LambdaAPIGatewayEvent): Promise<Response> => {
  if (!event.body) return;
  
  const {
    id,
    name,
    role,
    attributes,
    managerId
  }: Prisma.UserUncheckedCreateInput = JSON.parse(event.body);

  const user = await createUser({
    id,
    name,
    role,
    attributes,
    managerId
  });

  if (!user) return errorHandler("Error creating user", event)

  return createResponse(user);
};

const getHandler = async (
  event: LambdaAPIGatewayEvent
): Promise<Response> => {
  const id = event.pathParameters?.id as string;
  const path = getSubpath(event);

  if (id === "search") {
    const users = await searchUsers();
    return createResponse(users);
  }

  switch (path) {
    case "groups": {
      const userGroups = await getUserGroups({ id });
      return createResponse(userGroups);
    }
    case "assigned": {
      const userAssigned = await getUserAssgined({ id });
      return createResponse(userAssigned);
    }
    case "requested": {
      const userRequested = await getUserRequests({ id, status: event.queryStringParameters?.status as BenefitRequestStatus });
      return createResponse(userRequested);
    }
    case "requests": {
      const subpath = getSubpath(event, 3);
      switch (subpath) {
        case "pending": {
          const userRequested = await getUserPendingRequests({ id });
          return createResponse(userRequested);
        }
        default: {
          return createErrorResponse(429, { error: "Invalid subpath." })
        }
      }
    }
    default: {
      const user = await getUser({ id });
      return createResponse(user);
    }
  }
};

const userHandler = async (event: LambdaAPIGatewayEvent): Promise<Response> => {
  switch (event.requestContext.http.method) {
    case "GET": {
      return authenticate(event, getHandler, [Role.User])
    }
    case "PUT": {
      if (!event.body) return createErrorResponse(429, { error: "Missing body." })
      return authenticate(event, putHandler, [Role.User])
    }
    default: {
      console.log("method", event.requestContext.http.method)
      return notFoundResponse()
    }
  }
}

exports.userHandler = userHandler;
