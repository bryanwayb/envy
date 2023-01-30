import { Service } from 'typedi';
import yargs = require('yargs');
import { hideBin } from 'yargs/helpers';
import { PackageContextEnum } from '../PackageServices/Models/PackageServiceOptions';

const contextOptions: { [key: string]: yargs.Options } = {
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
};

@Service()
export default class CommandLineService {
    private readonly _arguments = yargs(hideBin(process.argv))
        .scriptName('envy')
        .options({
            'verbose': {
                alias: 'v',
                description: 'Enable detailed console logging',
                type: 'boolean'
            },
            'confirm': {
                alias: 'c',
                description: 'Automatically confirms requests for user input',
                type: 'boolean'
            }
        })
        .command('apply', 'Applies an nv.yml configuration file.', (yargs) => {
            yargs.usage('$0 apply [options] <target section>')
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
        .command('shell', 'Prepares an environment from an apply config and launches a shell.', (yargs) => {
            yargs.usage('$0 shell [options] <target section>')
                .option('file', {
                    alias: 'f',
                    describe: 'Which apply config to use; when not supplied defaults to ./nv.yml; Can be supplied multiple times. When multiple config files are given, processing order will be handled in the order they appear in the options list.',
                    group: 'Shell Options'
                })
                .example('$0 shell', 'Uses the default config path and all possible targets')
                .example('$0 shell -f ./path/to/config.yml', 'Supplies a custom config file path')
                .example('$0 shell -f ./firstConfig.yml -f /path/to/secondConfig.yml', 'Provides multiple apply configs')
                .example('$0 shell sectionName.toTarget', 'Will only process sections that match the specific names')
                .example('$0 shell firstSection sectionSection.subSectionTarget', 'Same as above, but will target multiple sections');
        })
        .command('install', 'Installs a package or list of packages. Package install will fail if the package is already installed.', (yargs) => {
            yargs.usage('$0 install [options] <package list>')
                .options({
                    ...contextOptions
                })
                .example('$0 install vscode', 'Attempts to install a package called "vscode" of the latest version from any package manager')
                .example('$0 install vscode@1.74.0', 'Attempts to install a "vscode" package from any package manager of version 1.74.0')
                .example('$0 install choco:vscode', 'Will install the "vscode" package from the choco manager of the latest version')
                .example('$0 install choco:vscode@1.74.0', 'Will install the "vscode" package from the choco manager of version 1.74.0')
                .example('$0 install git vscode', 'Attempts to install packages that match both "git" and "vscode"')
        })
        .command('upgrade', 'Upgrades or installs a package or list of packages. Can also be used to downgrade to an older version.', (yargs) => {
            yargs.usage('$0 upgrade [options] <package list>')
                .options({
                    ...contextOptions
                })
                .example('$0 upgrade vscode', 'Attempts to upgrade or install a package called "vscode" of the latest version from any package manager')
                .example('$0 upgrade vscode@1.74.0', 'Attempts to upgrade or install a "vscode" package from any package manager of version 1.74.0')
                .example('$0 upgrade choco:vscode', 'Will upgrade or install the "vscode" package from the choco manager of the latest version')
                .example('$0 upgrade choco:vscode@1.74.0', 'Will upgrade or install the "vscode" package from the choco manager of version 1.74.0')
                .example('$0 upgrade git vscode', 'Attempts to upgrade or install packages that match both "git" and "vscode"')
        })
        .command('uninstall', 'Uninstalls a package or list of packages.', (yargs) => {
            yargs.usage('$0 uninstall [options] <package list>')
                .options({
                    ...contextOptions
                })
                .example('$0 uninstall vscode', 'Attempts to uninstall a package called "vscode" from any package manager')
                .example('$0 uninstall choco:vscode', 'Will uninstall the "vscode" package from the choco manager')
                .example('$0 uninstall git vscode', 'Attempts to uninstall packages that match both "git" and "vscode"')
        })
        .command('list', 'Lists all installed packages.', (yargs) => {
            yargs.usage('$0 list [options]')
                .options({
                    ...contextOptions
                })
                .example('$0 list', 'Lists installed packages for the entire system and package managers')
                .example('$0 list -u', 'Lists all installed packages installed for the current user and package managers')
                .example('$0 list -d ./install/dir', 'Lists all installed packages in the targeted directory')
        })
        .command('search', 'Searches possible packages for installs or upgrades.', (yargs) => {
            yargs.usage('$0 search [options] <search package list>')
                .options({
                    ...contextOptions
                })
                .example('$0 search "vscode"', 'Searches all package managers for the "vscode" package')
                .example('$0 search "choco:vscode"', 'Searches the choco package manager for the "vscode" package')
                .example('$0 search "choco:vscode@1.74.0"', 'Searches the choco package manager for the "vscode" package with version 1.74.0')
        })
        .command('help', 'Displays this help information.')
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