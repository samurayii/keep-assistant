import { IMemoryDBRecord, IMemoryDBRecordEventName } from "../interfaces";
import { EventEmitter } from "events";

export class MemoryDBRecord extends EventEmitter implements IMemoryDBRecord {

    private _ttl_id_interval: ReturnType<typeof setTimeout>;
    private _data: unknown;

    constructor (
        data: unknown,
        ttl: number
    ) {
        super();
        this.update(data, ttl);
    }

    override on (event_name: IMemoryDBRecordEventName, listener: (...args: unknown[]) => void): this {
        super.on(event_name, listener);
        return this;
    }
    override emit (event_name: IMemoryDBRecordEventName, ...args: unknown[]): boolean {
        return super.emit(event_name, ...args);
    }

    get (): unknown {
        return this._data;
    }

    update (data: unknown, ttl: number): void {
        clearTimeout(this._ttl_id_interval);
        this._data = data;
        this._ttl_id_interval = setTimeout( () => {
            this.emit("outdated");
        }, ttl * 1000);
    }

    destroy (): void {
        clearTimeout(this._ttl_id_interval);
    }

}