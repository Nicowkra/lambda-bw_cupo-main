import { LambdaAPIGatewayEvent, Response, createFileResponse, getSubpath, notFoundResponse, authenticate,Role } from "@libs/http"
import { createUserPendingRequestsReport, createUserRequestsReport } from "./service/report";

const getHandler = async (
    event: LambdaAPIGatewayEvent
  ): Promise<Response> => {
    const receiverId = event.pathParameters?.userId as string;
    const path = getSubpath(event, 3);

    switch (path) {
        case "requests": {
            const requests = await createUserRequestsReport({
                receiverId,
              })
            return createFileResponse(requests)
        }
        case "pending": {
            const pending = await createUserPendingRequestsReport({
                receiverId
            })
            return createFileResponse(pending)
        }
    }
  };

const reportHandler = async (event: LambdaAPIGatewayEvent): Promise<Response> => {
    switch (event.requestContext.http.method) {
      case "GET": {
        return authenticate(event, getHandler, [Role.User])
        //return authenticate(event, getHandler, ["USER"])
      }
      default: {
        console.log("request", event.requestContext)
        return notFoundResponse()
      }
    }
  }
  
  exports.reportHandler = reportHandler;
  