// from https://www.meticulous.ai/blog/getting-started-with-react-logging
// with date additions
import {DateTime} from "luxon";
import {getAge} from "./utils.ts";

/* eslint no-console: "off" */

/* eslint @typescript-eslint/no-explicit-any: "off" */

/** Signature of a logging function */
export interface LogFn {
    (message?: any, ...optionalParams: any[]): void;
}

/** Basic logger interface */
export interface Logger {
    log: LogFn;
    warn: LogFn;
    error: LogFn;
}

/** Log levels */
export type LogLevel = 'log' | 'warn' | 'error';

const NO_OP: LogFn = () => {
    // noop
};

/** Logger which outputs to the browser console */
export class ConsoleLogger implements Logger {
    readonly log: LogFn;
    readonly warn: LogFn;
    readonly error: LogFn;
    private readonly started: DateTime;

    constructor(options?: { level?: LogLevel }) {
        this.started = DateTime.now()
        const {level} = options || {};

        this.error = console.error.bind(console);

        if (level === 'error') {
            this.warn = NO_OP;
            this.log = NO_OP;

            return;
        }

        this.warn = console.warn.bind(console);

        if (level === 'warn') {
            this.log = NO_OP;

            return;
        }

        const fn = console.log.bind(console);
        this.log = (message?: any, ...optionalParams: any[]) => {
            message = getAge(DateTime.now(), this.started) + " " + message
            fn(message, ...optionalParams)
        }
    }
}


export const logger = new ConsoleLogger({level: import.meta.env.DEV ? "log" : "warn"});