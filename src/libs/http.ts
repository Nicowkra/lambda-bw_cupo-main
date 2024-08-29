import {
  APIGatewayEvent as AWSAPIGatewayEvent,
  APIGatewayEventIdentity,
} from "aws-lambda";
import jwt, { JwtPayload } from "jsonwebtoken";
import { PrismaType as Prisma } from "./prisma";

export function createErrorResponse(
  code: number,
  body: { error: any; message?: string }
): Response {
  return {
    statusCode: code,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function createResponse<T>(body: T): Response {
  try {
    if ("code" in (body as PutResult<T>)) {
      if ((body as PutResult<T>).error) {
        return createErrorResponse((body as PutResult<T>).code, {
          error: (body as PutResult<T>).error,
        });
      }
      return {
        statusCode: (body as PutResult<T>).code,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify((body as PutResult<T>).item),
      };
    }
  } finally {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };
  }
}

export function notFoundResponse(): Response {
  return createErrorResponse(404, { error: "Page not found" });
}

export function createFileResponse({
  file,
  contentType,
  fileName,
}: FileResult): Response {
  if (!file || !fileName) {
    return createErrorResponse(500, { error: "Internal Server Error " });
  }
  const body = Buffer.from(file).toString("base64");
  return {
    statusCode: 200,
    headers: {
      "Content-Type": contentType ?? "text/plain",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
    body,
    isBase64Encoded: true,
  };
}

export interface LambdaAPIGatewayEvent extends AWSAPIGatewayEvent {
  // Created because the httpMethod property doesn't exist and instead comes inside http.
  requestContext: {
    accountId: string;
    apiId: string;
    authorizer: any;
    connectedAt?: number | undefined;
    connectionId?: string | undefined;
    domainName?: string | undefined;
    domainPrefix?: string | undefined;
    eventType?: string | undefined;
    extendedRequestId?: string | undefined;
    protocol: string;
    httpMethod: string;
    http: {
      method: string;
      path: string;
      protocol: string;
      sourceIp: string;
      userAgent: string;
    };
    identity: APIGatewayEventIdentity;
    messageDirection?: string | undefined;
    messageId?: string | null | undefined;
    path: string;
    stage: string;
    requestId: string;
    requestTime?: string | undefined;
    requestTimeEpoch: number;
    resourceId: string;
    resourcePath: string;
    routeKey?: string | undefined;
  };
  userToken: {
    user_id: string;
    role: string;
  };
}

export type PutResult<T> = {
  item?: T;
  code: number;
  error?: unknown;
};

export type FileResult = {
  file?: any;
  contentType?: string;
  fileName?: string;
};

export type Response = {
  statusCode: number;
  headers: { [header: string]: string };
  body: string;
  isBase64Encoded?: boolean;
} | void;

export function errorHandler(
  error: unknown,
  event: AWSAPIGatewayEvent | LambdaAPIGatewayEvent,
  prisma?: Prisma.PrismaClient
): Response {
  console.error({ error, event });
  try {
    if ((error as any).name.includes("PrismaClientKnown"))
      return createErrorResponse(400, { error });
  } catch {
    return createErrorResponse(500, { error });
  }
}

export function getSubpath(
  event: LambdaAPIGatewayEvent,
  pathPosition = 2
): string {
  return event.requestContext.http.path.split("/")[pathPosition + 1];
}

export enum Role {
  Admin = "ADMIN",
  User = "USER",
}

function validateRequiredRoles(
  requiredRoles: string[],
  currentRole: string
): boolean {
  return requiredRoles.some((role) => currentRole === role) || currentRole === Role.Admin;
}

export function authenticate(
  event: LambdaAPIGatewayEvent,
  callback: (event: LambdaAPIGatewayEvent) => {},
  requiredRoles?: string[]
): Response {
  const {
    headers: { authorization },
  } = event;
  const userToken = authorization && authorization.split(" ")[1];
  if (userToken) {
    return jwt.verify(
      userToken,
      process.env.API_KEY as string,
      (err, token) => {
        if (err) {
          console.error(err)
          console.log("auth", event.headers);
        };
        if (token) {
          const { role, user_id } = token as JwtPayload;
          if (requiredRoles && !validateRequiredRoles(requiredRoles, role))
            return createErrorResponse(401, { error: "Unauthorized." });
          return callback({ ...event, userToken: { user_id, role } });
        }
        return createErrorResponse(401, { error: "Unauthorized." });
      }
    );
  }
  return notFoundResponse();
}
