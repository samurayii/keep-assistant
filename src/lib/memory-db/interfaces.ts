import { EventEmitter } from "events";

export type IMemoryDBRecordEventName = "outdated"
export interface IMemoryDBRecord extends EventEmitter {
    on: (event_name: IMemoryDBRecordEventName, listener: (...args: unknown[]) => void) => this
    emit: (event_name: IMemoryDBRecordEventName, ...args: unknown[]) => boolean
    get: () => unknown
    update: (data: unknown, ttl: number) => void
    destroy: () => void
}

export interface IMemoryDB {
    put: (key: string, data: unknown, ttl: number) => void
    get: (key: string) => unknown
    exist: (key: string) => boolean
    clear: () => void
}