import { ILoggerEventEmitter } from "logger-event-emitter";
import { IMemoryDB, IMemoryDBRecord } from "./interfaces";
import chalk from "chalk";
import { MemoryDBRecord } from "./lib/record";


export * from "./interfaces";

export class MemoryDB implements IMemoryDB {

    private readonly _store: {
        [key: string]: IMemoryDBRecord
    };

    constructor (
        private readonly _logger: ILoggerEventEmitter
    ) {
        this._store = {};
    }

    put (key: string, data: unknown, ttl: number): void {
        if (this._store[key] !== undefined) {
            this._store[key].update(data, ttl);
            this._logger.debug(`Key ID ${chalk.cyan(key)} updated`);
            return;
        }
        const new_record = new MemoryDBRecord(data, ttl);
        new_record.on("outdated", () => {
            this._store[key].destroy();
            delete this._store[key];
            this._logger.debug(`Key ID ${chalk.cyan(key)} deleted (outdated)`);
        });
        this._store[key] = new_record;
        this._logger.debug(`Key ID ${chalk.cyan(key)} created`);
    }
    
    get (key: string): unknown {
        if (this._store[key] !== undefined) {
            return this._store[key].get();
        }
        return undefined;
    }

    exist (key: string): boolean {
        if (this._store[key] !== undefined) {
            return true;
        }
        return false;
    }

    clear (): void {
        for (const key_name in this._store) {
            this._store[key_name].destroy();
            delete this._store[key_name];
        }
    }

}