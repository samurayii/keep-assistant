import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function routeHealthcheckLiveness(fastify: FastifyInstance) {

    const handler = function (_request: FastifyRequest, reply: FastifyReply) {
        reply.code(200);
        reply.send("Healthy");
    };

    fastify.route({
        url: "/healthcheck/liveness",
        handler: handler,
        method: "GET"
    });
}
