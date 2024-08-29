import { FileResult } from "@libs/http";
import { createPrismaClient } from "@libs/prisma";

export const createUserRequestsReport = async ({ receiverId, gte, lte }: { receiverId: string; gte?: string | Date; lte?: string | Date; }): Promise<FileResult> => {
    const prisma = createPrismaClient();
    try {
        const requests = await prisma.benefitRequest.findMany({
            where: {
                receiverId,
                createdAt: {
                    gte,
                    lte,
                }
            },
            include: {
                receiver: true,
                benefitAssignment: {
                    include: {
                        benefit: true
                    }
                },
                authorizedBy: true,
                benefitGroup: {
                    include: {
                        benefit: true
                    }
                },
            },
            orderBy: {
                createdAt: "desc"
            }
        })
        const header = `Fecha,Usuario,ID de Beneficio,Nombre de Beneficio,Estado,Aprobado por
`; // Next row
        let rows = header;
        for(const request of requests){
            const benefit = request.benefitAssignment ? request.benefitAssignment.benefit : request.benefitGroup?.benefit;
            rows += `${request.createdAt.toDateString()},${request.receiver.name} (${request.receiverId}),${benefit?.id},${benefit?.name},${request.status},${request.authorizedById ? `${request.authorizedBy?.name} (${request.authorizedById})` : !request.approved ? "Pendiente" : "Automático"}
`; // Next row
        }
        return { file: rows, fileName: receiverId + "_requests.csv", contentType: "text/csv" };
    } catch (e) {
        console.error(e)
        return { file: undefined, fileName: undefined, contentType: undefined}
      } finally {
        prisma.$disconnect();
      }
}

export const createUserPendingRequestsReport = async ({ receiverId, gte, lte }: { receiverId: string; gte?: string | Date; lte?: string | Date; }): Promise<FileResult> => {
    const prisma = createPrismaClient();
    try {
        const requests = await prisma.benefitRequest.findMany({
            where: {
                receiverId,
                createdAt: {
                    gte,
                    lte,
                },
                status: "PENDING",
            },
            include: {
                receiver: true,
                benefitAssignment: {
                    include: {
                        benefit: true
                    }
                },
                authorizedBy: true,
                benefitGroup: {
                    include: {
                        benefit: true
                    }
                },
            },
            orderBy: {
                createdAt: "desc"
            }
        })
        const header = `Fecha,Usuario,ID de Beneficio,Nombre de Beneficio,Estado,Autorizantes
`; // Next row
        let rows = header;
        for(const request of requests){
            const benefit = request.benefitAssignment ? request.benefitAssignment.benefit : request.benefitGroup?.benefit;
            const origin = request.benefitAssignment ? await prisma.benefitAssignment.findUnique({ where: { id: request.benefitAssignmentId as string }, include: { authorizers: true } }) : await prisma.benefitGroup.findUnique({ where: { id: request.benefitGroupId as string } })
            const authorizers = origin?.authorizers;
            
            rows += `${request.createdAt.toDateString()},${request.receiver.name} (${request.receiverId}),${benefit?.id},${benefit?.name},${request.status},${authorizers?.length ? `"${authorizers?.join(', ')}"` : authorizers?.join(', ')}
`; // Next row
        }

        return { file: rows, fileName: receiverId + "_pending.csv", contentType: "text/csv" };
    } catch (e) {
        console.error(e)

        return { file: undefined, fileName: undefined, contentType: undefined}
      } finally {
        prisma.$disconnect();
      }
}