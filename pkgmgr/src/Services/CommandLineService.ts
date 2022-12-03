import { Service } from 'typedi';
import yargs, { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers'

@Service()
export default class CommandLineService {
    private _arguments: Argv<Omit<any, keyof string[]> & string[]> = null;

    constructor() {
        this._arguments = yargs(hideBin(process.argv));
    }

    GetCommand(): string {
        if (this._arguments.argv.hasOwnProperty('install')) {
            return 'install';
        }
        else if (this._arguments.argv.hasOwnProperty('list')) {
            return 'list';
        }
        else if (this._arguments.argv.hasOwnProperty('search')) {
            return 'search';
        }

        return null;
    }

    GetOption(name: string): string {
        return this._arguments.argv[name];
    }

    GetArgument(index: number): string {
        const args: string[] = (this._arguments.argv as any)._ as string[];
        return args[index + 1];
    }
};