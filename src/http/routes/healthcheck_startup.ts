import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function routeHealthcheckStartup(fastify: FastifyInstance) {

    const handler = function (_request: FastifyRequest, reply: FastifyReply) {
        reply.code(200);
        reply.send("Healthy");
    };

    fastify.route({
        url: "/healthcheck/startup",
        handler: handler,
        method: "GET"
    });
}
