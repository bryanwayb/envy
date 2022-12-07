import Container, { Service } from 'typedi';
import CommandLineService from './CommandLineService';

export enum LogLevel {
    Trace,
    Info
};

function logLevelToString(logLevel: LogLevel): string {
    switch (logLevel) {
        case LogLevel.Trace:
            return 'trace';
        case LogLevel.Info:
            return 'info';
        default:
            return 'unknown';
    }
}

@Service()
export default class LoggerService {
    private readonly _commandLineService = Container.get(CommandLineService);
    private readonly _enableConsoleOutput = this._commandLineService.IsVerbose();
    private readonly _scope: string = null;

    constructor(scope: string = null) {
        if (scope) {
            this._scope = scope;
        }
    }

    Log(logLevel: LogLevel, input: string): void {
        if (this._enableConsoleOutput) {
            console.log(`[${this._scope ? `${this._scope},` : ''}${logLevelToString(logLevel)}]: ${input}`);
        }
    }

    LogTrace(input: string): void {
        this.Log(LogLevel.Trace, input);
    }

    ScopeByType<T>(type: new () => T): LoggerService {
        return new LoggerService(type.name);
    }

    ScopeByName(type: string): LoggerService {
        return new LoggerService(type);
    }

    Serialize<T>(data: T): string {
        return JSON.stringify(data, null, 2);
    }
};