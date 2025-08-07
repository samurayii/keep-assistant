import { FastifyInstance, FastifyRequest } from "fastify";
import { ILoggerEventEmitter } from "logger-event-emitter";

export interface IApiServerFastifyInstance extends FastifyInstance {
    logger: ILoggerEventEmitter
}

export interface IFastifyRequestActionsSilence extends FastifyRequest {
    query: {
        fingerprint: string
        namespace?: string
        container?: string
        cluster_name?: string
        duration?: string
    }
}

export interface IFastifyRequestActionsMemoryDBGet extends FastifyRequest {
    query: {
        key: string
    }
}

export interface IFastifyRequestActionsMemoryDBPost extends FastifyRequest {
    body: {
        key: string
        status: string
        ttl?: string
    }
}

export interface IFastifyRequestActionsInstancePost extends FastifyRequest {
    body: {
        duration: number
        instance: string
        actor?: string
    }
}