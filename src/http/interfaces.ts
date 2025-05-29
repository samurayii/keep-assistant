import { FastifyInstance, FastifyRequest } from "fastify";
import { ILoggerEventEmitter } from "logger-event-emitter";

export interface IApiServerFastifyInstance extends FastifyInstance {
    logger: ILoggerEventEmitter
}

export interface IFastifyRequestActions extends FastifyRequest {
    query: {
        namespace?: string
        container?: string
        cluster_name?: string
        duration?: string
    }
}

