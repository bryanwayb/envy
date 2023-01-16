import Container, { Service } from 'typedi';
import { printTable } from 'console-table-printer';
import * as Spinnies from 'spinnies';
import { randomUUID } from 'crypto';
import LoggerService, { LogLevel } from './LoggerService';

export interface IConsoleSpinnerInstance {
    Update(text: string): void;
    Success(text: string): void;
    Fail(text: string): void;
}

export interface IConsoleSpinners {
    Add(text: string): IConsoleSpinnerInstance;
}

export class ConsoleSpinnerInstance implements IConsoleSpinnerInstance {
    private readonly _spinnies: Spinnies;
    private readonly _id: string;

    constructor(spinnies: Spinnies, id: string) {
        this._spinnies = spinnies;
        this._id = id;
    }

    Update(text: string): void {
        this._spinnies.update(this._id, {
            text
        });
    }

    Success(text: string): void  {
        this._spinnies.succeed(this._id, {
            text
        });
    }

    Fail(text: string): void  {
        this._spinnies.fail(this._id, {
            text
        });
    }
}

export class VerboseConsoleSpinnerInstance implements IConsoleSpinnerInstance {
    private readonly _id: string;
    private readonly _logger = Container.get(LoggerService).ScopeByType(VerboseConsoleSpinners);

    constructor(id: string) {
        this._id = id;
    }

    Update(text: string): void {
        this._logger.LogTrace(`update spinner ${this._id}: ${text}`);
    }

    Success(text: string): void  {
        this._logger.LogTrace(`success spinner ${this._id}: ${text}`);
    }

    Fail(text: string): void  {
        this._logger.LogTrace(`fail spinner ${this._id}: ${text}`);
    }
}

export class ConsoleSpinners implements IConsoleSpinners {
    private readonly _spinnies = new Spinnies();

    Add(text: string): IConsoleSpinnerInstance {
        const id = randomUUID();
        this._spinnies.add(id, {
            text
        });
        return new ConsoleSpinnerInstance(this._spinnies, id);
    }
}

export class VerboseConsoleSpinners implements IConsoleSpinners {
    private readonly _logger = Container.get(LoggerService).ScopeByType(VerboseConsoleSpinners);

    Add(text: string): IConsoleSpinnerInstance {
        const id = randomUUID();

        this._logger.LogTrace(`creating spinner instance with id ${id} and text: ${text}`);

        return new VerboseConsoleSpinnerInstance(id);
    }
}

@Service()
export default class ConsoleGUI {
    private readonly _logger = Container.get(LoggerService).ScopeByType(ConsoleGUI);

    PrintConsoleTable(records: Array<any>): void {
        printTable(records);
    }

    CreateSpinners(): IConsoleSpinners {
        if (this._logger.IsEnabled(LogLevel.Trace)) {
            return new VerboseConsoleSpinners();
        }
        else {
            return new ConsoleSpinners();
        }
    }
};