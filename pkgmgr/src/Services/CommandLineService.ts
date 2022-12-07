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
        }
    });

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

    GetOption(...names: string[]): string {
        for (const i in names) {
            const value = this._arguments.argv[names[i]];
            if (value) {
                return value;
            }
        }
        return null;
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
};