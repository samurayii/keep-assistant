import { FastifyInstance } from "fastify";
import { ILoggerEventEmitter } from "logger-event-emitter";

export interface IApiServerFastifyInstance extends FastifyInstance {
    logger: ILoggerEventEmitter
}