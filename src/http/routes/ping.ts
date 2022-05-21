import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function routePing(fastify: FastifyInstance) {

    const handler = function (_request: FastifyRequest, reply: FastifyReply) {
        reply.code(200);
        reply.send("pong 🎾");
    };

    fastify.route({
        url: "/_ping",
        handler: handler,
        method: "GET"
    });
}

