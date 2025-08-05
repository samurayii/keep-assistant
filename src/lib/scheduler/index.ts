import { ILoggerEventEmitter } from "logger-event-emitter";
import { IScheduler, ISchedulerConfig, ISchedulerResultBody, ISchedulerTaskData, ISchedulerTaskDataSilenceAction, ISchedulerTaskDataSilenceActionInstances } from "./interfaces";
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
    private _ready_flag: boolean;
    private _ready_interval: ReturnType<typeof setTimeout>;

    constructor (
        private readonly _config: ISchedulerConfig,
        private readonly _logger: ILoggerEventEmitter
    ) {
        
        this._ready_flag = false;
        
        if (this._config.prefix === "/") {
            this._url = `${this._config.protocol}://${this._config.hostname}:${this._config.port}`;
        } else {
            this._url = `${this._config.protocol}://${this._config.hostname}:${this._config.port}${this._config.prefix}`;
        }
    }

    get ready (): boolean {
        return this._ready_flag;
    }

    async run (): Promise<void> {

        const result_url = `${this._url}/whoami`;

        const options: fetch.RequestInit = {
            method: "GET",
            headers: {
                "x-api-key": this._config.api_key
            }
        };

        const startInterval = () => {
            this._logger.debug("New access check after 5 seconds");
            this._ready_interval = setTimeout( () => {
                this.run();
            }, 5000);
        };
        
        this._logger.debug(`Request to ${chalk.cyan(result_url)}`);

        let response: fetch.Response; 

        try {
            response = await fetch(result_url, options);
        } catch (error) {
            this._logger.error(`Request is fail. Error: ${chalk.red(error.message)}`);
            this._logger.trace(error.stack);
            startInterval();
            return;
        }      

        if (response.ok === true) {

            const content_type = response.headers.get("content-type");

            if (typeof content_type !== "string") {
                this._logger.error(`Access check if fail. Scheduler is ${chalk.red("NOT READY")}. Server return content-type: ${content_type}`);
                startInterval();
                return;
            }

            if (content_type.toLowerCase() !== "application/json") {
                this._logger.error(`Access check if fail. Scheduler is ${chalk.red("NOT READY")}. Server return content-type: ${content_type}`);
                startInterval();
                return;
            }

            this._logger.debug(`Access check if success. Scheduler is ${chalk.green("READY")}`);

            this._ready_flag = true;

        } else {
            this._logger.error(`Request ${chalk.red(result_url)} is fail. Server return code: ${chalk.red(response.status)}, status: ${chalk.red(response.statusText)}`);
            this._logger.trace(await response.text());
            startInterval();
        }

    }

    async close (): Promise<void> {
        clearTimeout(this._ready_interval);
    }
    
    async runTask (request: ISchedulerTaskData): Promise<ISchedulerResultBody> {

        if (this._ready_flag === false) {
            return <ISchedulerResultBody>{
                status: "fail",
                message: "Server not ready"
            };
        }

        this._logger.debug(`Request for ${request.action} action`);

        if (request.action === "silence") {
            return this._silenceActionGeneral(<ISchedulerTaskDataSilenceAction>request);
        }

        if (request.action === "silence:instances") {
            return this._silenceActionInstances(<ISchedulerTaskDataSilenceActionInstances>request);
        }

        return <ISchedulerResultBody>{
            status: "fail",
            message: `Operation "${request.action}" not found`
        };
    }

    async _silenceAction (options: fetch.RequestInit): Promise<ISchedulerResultBody> {

        const result_url = `${this._url}/maintenance`;

        this._logger.debug(`Request to ${chalk.cyan(result_url)}`);

        let response: fetch.Response; 

        try {
            response = await fetch(result_url, options);
        } catch (error) {
            this._logger.error(`Request is fail. Error: ${chalk.red(error.message)}`);
            this._logger.trace(error.stack);
            return <ISchedulerResultBody>{
                status: "error",
                message: "Operation \"silence\" is fail"
            };
        }      

        if (response.ok === true) {

            const content_type = response.headers.get("content-type");

            if (typeof content_type !== "string") {
                return <ISchedulerResultBody>{
                    status: "error",
                    message: "Operation \"silence\" is fail. Server return content-type: ${content_type}"
                };
            }

            if (content_type.toLowerCase() !== "application/json") {
                return <ISchedulerResultBody>{
                    status: "error",
                    message: "Operation \"silence\" is fail. Server return content-type: ${content_type}"
                };
            }

            let result: TSilenceActionResponse;
            
            try {
                result = await response.json();
            } catch (error) {
                this._logger.error(`Response JSON parsing error. Error: ${chalk.red(error.message)}`);
                this._logger.trace(error.stack);
                return <ISchedulerResultBody>{
                    status: "error",
                    message: "Operation \"silence\" is fail. Server return code: ${response.status}"
                };
            }           

            this._logger.debug(`Silence rule ID ${chalk.cyan(result.id)} created. Duration: ${chalk.cyan(result.duration_seconds)}, started: ${chalk.cyan(result.start_time)}`);

            return <ISchedulerResultBody>{
                status: "success",
                message: "Operation \"silence\" completed."
            };

        } else {
            this._logger.error(`Request ${chalk.red(result_url)} is fail. Server return code: ${chalk.red(response.status)}, status: ${chalk.red(response.statusText)}`);
            this._logger.trace(await response.text());
            return <ISchedulerResultBody>{
                status: "error",
                message: "Operation \"silence\" is fail. Server return code: ${response.status}"
            };
        }

    }

    async _silenceActionGeneral (request: ISchedulerTaskDataSilenceAction): Promise<ISchedulerResultBody> {

        this._logger.debug("Activate SILENCE action");

        const cel_conditions: string[] = [];

        if (typeof request.data.namespace === "string") {
            cel_conditions.push(`alert.labels.namespace == "${request.data.namespace}"`);
        }

        if (typeof request.data.cluster_name === "string") {
            cel_conditions.push(`alert.labels.cluster_name == "${request.data.cluster_name}"`);
        }

        if (typeof request.data.fingerprint === "string") {
            cel_conditions.push(`fingerprint == "${request.data.fingerprint}"`);
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
        
        return this._silenceAction(options);

    }

    async _silenceActionInstances (request: ISchedulerTaskDataSilenceActionInstances): Promise<ISchedulerResultBody> {

        this._logger.debug("Activate SILENCE:INSTANCES action");

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
                cel_query: `message.contains("${request.data.instance}")`,
                suppress: false,
                enabled: true,
                duration_seconds: request.data.duration,
                ignore_statuses: [
                    "resolved",
                    "acknowledged"
                ]
            }),
        };
        
        return this._silenceAction(options);

    }

}