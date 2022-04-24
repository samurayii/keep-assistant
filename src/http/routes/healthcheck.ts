import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function routeHealthcheck(fastify: FastifyInstance) {

    const handler = function (request: FastifyRequest, reply: FastifyReply) {
        reply.code(200);
        reply.send("Healthy");
    };

    fastify.route({
        url: "/healthcheck",
        handler: handler,
        method: "GET"
    });
}


