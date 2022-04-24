import { FastifyInstance, FastifyRequest } from "fastify";
import { ILoggerEventEmitter } from "logger-event-emitter";

export interface ApiServerFastifyRequest extends FastifyRequest {
    server: ApiServerFastifyInstance
}

export interface ApiServerFastifyInstance extends FastifyInstance {
    logger: ILoggerEventEmitter
}