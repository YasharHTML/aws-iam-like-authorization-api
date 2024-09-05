import { PrismaClient, type Condition } from "@prisma/client";

const prisma = new PrismaClient();

async function authorizeRequest(
    userId: string,
    action: string,
    resource: string,
    context: Record<string, string>
) {
    try {
        const userRoles = await prisma.userRole.findMany({
            where: { userId },
            include: {
                role: {
                    include: {
                        policies: {
                            include: {
                                policy: {
                                    include: {
                                        statements: {
                                            include: { conditions: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const isAuthorized = userRoles.some((userRole) => {
            return userRole.role.policies.some((rolePolicy) => {
                return rolePolicy.policy.statements.some((statement) => {
                    const actionMatch = statement.Action.includes(action);
                    const resourceMatch = statement.Resource.includes(resource);

                    const conditionsMatch = statement.conditions.every(
                        (condition) => evaluateCondition(condition, context)
                    );

                    const { conditions, ...rest } = statement;

                    return (
                        actionMatch &&
                        resourceMatch &&
                        conditionsMatch &&
                        statement.Effect === "ALLOW"
                    );
                });
            });
        });

        return isAuthorized;
    } catch (error) {
        console.error("Authorization error:", error);

        return false;
    }
}

function evaluateCondition(
    condition: Condition,
    context: Record<string, string>
): boolean {
    switch (condition.conditionType) {
        case "StringEquals":
            return condition.conditionValue.includes(
                context[condition.conditionKey]
            );
        case "IpAddress":
            return condition.conditionValue.includes(
                context[condition.conditionKey]
            );
        default:
            return false; 
    }
}

import { z } from "zod";

const BodySchema = z.object({
    Resource: z.string(),
    Action: z.string(),
    Context: z.record(z.string()),
    UserId: z.string(),
});

const handler = Bun.serve({
    fetch: async (request) => {
        if (request.method !== "POST") {
            return new Response("Method Not Allowed", { status: 405 });
        }
        const body = await request.json();
        try {
            const { UserId, Resource, Action, Context } =
                await BodySchema.parseAsync(body);

            const result = await authorizeRequest(UserId, Action, Resource, {
                ...Context,
            });

            if (result) {
                return new Response("Authorized", { status: 200 });
            } else {
                return new Response("Unauthorized", { status: 403 });
            }
        } catch (error: any) {
            console.error("Invalid request body:", error);
            return new Response(error.message, { status: 400 });
        }
    },
});

export { handler };
