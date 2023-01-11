import { Service } from 'typedi';
import { printTable } from 'console-table-printer';
import * as Spinnies from 'spinnies';
import { randomUUID } from 'crypto';

export class ConsoleSpinnerInstance {
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

    Success(text: string) {
        this._spinnies.succeed(this._id, {
            text
        });
    }

    Fail(text: string) {
        this._spinnies.fail(this._id, {
            text
        });
    }
}

export class ConsoleSpinners {
    private readonly _spinnies = new Spinnies();

    Add(text: string): ConsoleSpinnerInstance {
        const id = randomUUID();
        this._spinnies.add(id, {
            text
        });
        return new ConsoleSpinnerInstance(this._spinnies, id);
    }
}

@Service()
export default class ConsoleGUI {
    PrintConsoleTable(records: Array<any>): void {
        printTable(records);
    }

    CreateSpinners() {
        return new ConsoleSpinners();
    }
};