import { Service } from 'typedi';
import yargs = require('yargs');
import { hideBin } from 'yargs/helpers';
import { PackageContextEnum } from '../PackageServices/Models/PackageServiceOptions';

@Service()
export default class CommandLineService {
    private readonly _arguments = yargs(hideBin(process.argv))
        .scriptName('envy')
        .options({
            'verbose': {
                alias: 'v',
                description: 'Enable detailed logging',
                type: 'boolean',
                group: 'Global Options'
            },
            'confirm': {
                alias: 'c',
                description: 'Automatically confirms requests for user input',
                type: 'boolean',
                group: 'Global Options'
            },
            'system': {
                alias: 's',
                description: 'Performs pacakage operations on a system level, requires admin/root',
                type: 'boolean',
                group: 'Context Options'
            },
            'user': {
                alias: 'u',
                description: 'Performs pacakage operations on a user level',
                type: 'boolean',
                group: 'Context Options'
            },
            'directory': {
                alias: 'd',
                description: 'Performs pacakage operations in a directory',
                type: 'boolean',
                group: 'Context Options'
            }
        })
        .command('apply', 'applies an nv.yml configuration file', function (yargs) {
            return yargs
                .usage('Usage: $0 apply [options] <target section>')
                .option('file', {
                    alias: 'f',
                    describe: 'Which apply config to use; when not supplied defaults to ./nv.yml; Can be supplied multiple times. When multiple config files are given, processing order will be handled in the order they appear in the options list.',
                    group: 'Apply Options'
                })
                .example('$0 apply', 'Uses the default config path and all possible targets')
                .example("$0 apply -f ./path/to/config.yml", 'Supplies a custom config file path')
                .example("$0 apply -f ./firstConfig.yml -f /path/to/secondConfig.yml", 'Provides multiple apply configs')
                .example('$0 apply sectionName.toTarget', 'Will only process sections that match the specific names')
                .example('$0 apply firstSection sectionSection.subSectionTarget', 'Same as above, but will target multiple sections');
        })
        .command('install', 'installs a package or list of packages')
        .command('upgrade', 'upgrades or installs a package or list of packages')
        .command('uninstall', 'uninstalls a package or list of packages')
        .command('list', 'lists all installed packages')
        .command('search', 'searches possible packages for install or upgrades')
        .command('help', 'displays this help information')
        .help();

    constructor() {
        this._arguments.wrap(this._arguments.terminalWidth());
    }

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

    GetPackageContext(): PackageContextEnum {
        if (this.HasOption('s', 'system')) {
            return PackageContextEnum.System;
        }
        else if (this.HasOption('u', 'user')) {
            return PackageContextEnum.User;
        }
        else if (this.HasOption('d', 'directory')) {
            return PackageContextEnum.Directory;
        }

        return PackageContextEnum.System;
    }

    GetPackageContextDirectory(): string {
        // TODO: Get directory options
        return '';
    }
};