import { ILoggerEventEmitterConfig } from "logger-event-emitter";
import { IMetricsConfig } from "./metrics";
import { ISchedulerConfig } from "./scheduler";

export interface IApiServerConfig {
    enable: boolean
    logging: boolean
    port: number
    hostname: string
    backlog: number
    prefix: string
    connection_timeout: number
    keep_alive_timeout: number
    body_limit: string
    trust_proxy: boolean
}

export interface IAppConfig {
    logger: ILoggerEventEmitterConfig
    api: IApiServerConfig
    metrics: IMetricsConfig
    connection: ISchedulerConfig
}