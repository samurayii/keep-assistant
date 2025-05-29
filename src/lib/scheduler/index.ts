import { ILoggerEventEmitter } from "logger-event-emitter";
import { IScheduler, ISchedulerConfig, ISchedulerResultBody, ISchedulerTaskData, ISchedulerTaskDataSilenceAction } from "./interfaces";
import fetch from "node-fetch";
import chalk from "chalk";

export * from "./interfaces";

type TSilenceActionResponseIgnoreStatusesType = "resolved" | "acknowledged"
type TSilenceActionResponse = {
    id: number
    name: string
    description: string
    created_by: string
    cel_query: string
    start_time: string
    end_time: string
    duration_seconds: number
    updated_at: string
    suppress: boolean
    enabled: boolean
    ignore_statuses: TSilenceActionResponseIgnoreStatusesType[]
}

export class Scheduler implements IScheduler {

    private readonly _url: string;

    constructor (
        private readonly _config: ISchedulerConfig,
        private readonly _logger: ILoggerEventEmitter
    ) {
        if (this._config.prefix === "/") {
            this._url = `${this._config.protocol}://${this._config.hostname}:${this._config.port}`;
        } else {
            this._url = `${this._config.protocol}://${this._config.hostname}:${this._config.port}${this._config.prefix}`;
        }
    }
    
    async runTask (request: ISchedulerTaskData): Promise<ISchedulerResultBody> {

        this._logger.debug(`Request for ${request.action} action`);

        if (request.action === "silence") {
            return this._silenceAction(<ISchedulerTaskDataSilenceAction>request);
        }

        return <ISchedulerResultBody>{
            status: "fail",
            message: `Operation "${request.action}" not found`
        };
    }

    async _silenceAction (request: ISchedulerTaskDataSilenceAction): Promise<ISchedulerResultBody> {

        this._logger.debug("Activate SILENCE action");

        const result_url = `${this._url}/maintenance`;
        const cel_conditions: string[] = [];

        if (typeof request.data.namespace === "string") {
            cel_conditions.push(`alert.labels.namespace == "${request.data.namespace}"`);
        }

        if (typeof request.data.cluster_name === "string") {
            cel_conditions.push(`alert.labels.cluster_name == "${request.data.cluster_name}"`);
        }

        if (typeof request.data.container === "string") {
            cel_conditions.push(`alert.labels.container == "${request.data.container}"`);
        }

        const options: fetch.RequestInit = {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-api-key": this._config.api_key
            },
            body: JSON.stringify({
                name: `silence-rule-c${Date.now()}`,
                description: `Rule created by keep-assistant. Created time: ${(new Date()).toString()}`,
                start_time: (new Date(Date.now()+((new Date()).getTimezoneOffset()*-1)*1000*60)).toISOString(),
                cel_query: cel_conditions.join(" || "),
                suppress: false,
                enabled: true,
                duration_seconds: request.data.duration,
                ignore_statuses: [
                    "resolved",
                    "acknowledged"
                ]
            }),
        };
        
        this._logger.debug(`Request to ${chalk.cyan(result_url)}`);

        const response = await fetch(result_url, options);

        if (response.ok === true) {
            
            const result: TSilenceActionResponse = await response.json();

            this._logger.debug(`Silence rule ID ${chalk.cyan(result.id)} created. Duration: ${chalk.cyan(result.duration_seconds)}, started: ${chalk.cyan(result.start_time)}`);

            return <ISchedulerResultBody>{
                status: "success",
                message: `Operation "${request.action}" completed.`
            };

        } else {
            this._logger.error(`Request ${chalk.red(result_url)} is fail. Server return code: ${chalk.red(response.status)}, status: ${chalk.red(response.statusText)}`);
            this._logger.trace(await response.text());
            return <ISchedulerResultBody>{
                status: "error",
                message: `Operation "${request.action}" is fail. Server return code: ${response.status}`
            };
        }

    }

}