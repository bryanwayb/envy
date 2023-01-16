import { Service } from 'typedi';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

@Service()
export default class CommandLineService {
    private readonly _arguments = yargs(hideBin(process.argv)).options({
        'verbose': {
            alias: 'v',
            description: 'Enable detailed logging',
            type: 'boolean'
        },
        'confirm': {
            alias: 'c',
            description: 'Automatically confirms requests for user input',
            type: 'boolean'
        }
    });

    GetCommand(): string {
        const args = this._arguments.argv as any;

        if (args._.length) {
            return args._[0];
        }

        return null;
    }

    HelpText(): Promise<string> {
        return this._arguments.getHelp();
    }

    GetOption(...names: string[]): string {
        for (const i in names) {
            const value = this._arguments.argv[names[i]];

            if (Array.isArray(value)) {
                return value[0];
            }
            else if (value) {
                return value;
            }
        }
        return null;
    }

    GetOptionList(...names: string[]): string[] {
        for (const i in names) {
            const value = this._arguments.argv[names[i]] as string;

            if (Array.isArray(value)) {
                return value;
            }
            else if (value) {
                return [value];
            }
        }
        return [];
    }

    HasOption(...names: string[]): boolean {
        return this.GetOption(...names) !== null;
    }

    GetArgument(index: number): string {
        const args: string[] = (this._arguments.argv as any)._ as string[];
        return args[index + 1];
    }

    IsVerbose(): boolean {
        return this.HasOption('v', 'verbose');
    }

    IsConfirmed(): boolean {
        return this.HasOption('c', 'confirm');
    }
};