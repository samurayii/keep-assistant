import { ILoggerEventEmitter } from "logger-event-emitter";
import { IScheduler, ISchedulerConfig, ISchedulerResultBody, ISchedulerTaskData, ISchedulerTaskDataSilenceAction } from "./interfaces";

export * from "./interfaces";

export class Scheduler implements IScheduler {

    constructor (
        private readonly _config: ISchedulerConfig,
        private readonly _logger: ILoggerEventEmitter
    ) {

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










        return <ISchedulerResultBody>{
            status: "success",
            message: `Operation "${request.action}" complete`
        };

    }

}