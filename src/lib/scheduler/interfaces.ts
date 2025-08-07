export type TSchedulerResultBodyStatus = "success" | "error" | "fail"

export interface ISchedulerResultBody {
    status: TSchedulerResultBodyStatus
    data: unknown
    message: string
}

export type TSchedulerTaskDataActionType = "silence" | "silence:instances"
export interface ISchedulerTaskData {
    action: TSchedulerTaskDataActionType
}
export interface ISchedulerTaskDataSilenceAction extends ISchedulerTaskData {
    data: {
        fingerprint?: string
        namespace?: string
        container?: string
        cluster_name?: string
        duration?: number
    }
}
export interface ISchedulerTaskDataSilenceActionInstances extends ISchedulerTaskData {
    data: {
        duration: number
        instance: string
        actor: string
    }
}

export interface IScheduler {
    readonly ready: boolean;
    run: () => Promise<void>
    close: () => Promise<void>
    runTask: (request: ISchedulerTaskData) => Promise<ISchedulerResultBody>
}

export interface ISchedulerConfig {
    hostname: string
    port: number
    protocol: "http" | "https"
    prefix: string
    api_key: string
}

