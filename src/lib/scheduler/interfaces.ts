export type TSchedulerResultBodyStatus = "success" | "error" | "fail"

export interface ISchedulerResultBody {
    status: TSchedulerResultBodyStatus
    data: unknown
    message: string
}

export type TSchedulerTaskDataActionType = "silence"
export interface ISchedulerTaskData {
    action: TSchedulerTaskDataActionType
}

export interface ISchedulerTaskDataSilenceAction extends ISchedulerTaskData {
    data: {
        namespace: string
        container: string
        cluster_name: string
    }
}

export interface IScheduler {
    runTask: (request: ISchedulerTaskData) => Promise<ISchedulerResultBody>
}

export interface ISchedulerConfig {
    host: string
    port: number
    protocol: "http" | "https"
    api_key: string
}

