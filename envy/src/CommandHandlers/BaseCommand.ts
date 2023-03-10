import Container from "typedi";
import { PackageModel } from "../PackageServices/Models/PackageModel";
import CommandLineService from "../Services/CommandLineService";
import LoggerService from "../Services/LoggerService";
import { IPackageServiceFactory } from '../Interfaces/IPackageServiceFactory';
import { DI_IPackageServiceFactory } from "../../consts";
import ConsoleGUI from "../Services/ConsoleGUI";
import HashSet from "../Classes/HashSet";
import { PackageContextEnum, PackageServiceOptions } from "../PackageServices/Models/PackageServiceOptions";

class PackageManagerWithOption {
    public readonly PackageManager: string;
    public readonly Options: PackageServiceOptions;

    constructor(packageManager: string, options: PackageServiceOptions) {
        this.PackageManager = packageManager;
        this.Options = options;
    }
}

export default abstract class BaseCommand {
    protected readonly _commandLineService = Container.get(CommandLineService);
    protected readonly _logger = Container.get(LoggerService).ScopeByName(this.constructor.name);
    protected readonly _packageServiceFactory = Container.get<IPackageServiceFactory>(DI_IPackageServiceFactory);
    protected readonly _consoleGUI = Container.get(ConsoleGUI);

    private readonly _requiredPackageManagers = new HashSet<PackageManagerWithOption>();

    protected GetPassedPackages(): PackageModel[] {
        const results = new Array<PackageModel>();

        this._logger.LogTrace('getting passed arguments of packages to install');

        let currentPackageString;
        let index = 0;
        while ((currentPackageString = this._commandLineService.GetArgument(index++))) {
            this._logger.LogTrace(`passed package ${index} = ${currentPackageString}`);

            results.push(PackageModel.Parse(currentPackageString));
        }

        this._logger.LogTrace(`found requested packages to install: ${results.map(m => m.toString()).join(', ')}`);

        return results;
    }

    protected GetPackageOptionsFromCommandLine(): PackageServiceOptions {
        const options = new PackageServiceOptions();

        options.Context = this._commandLineService.GetPackageContext();
        options.Directory = this._commandLineService.GetPackageContextDirectory();

        return options;
    }

    private async FindPossiblePackageManagers(packageModel: PackageModel): Promise<string[]> {
        const packageManagerOptions = this.GetPackageOptionsFromCommandLine();
        const packageManagers = await this._packageServiceFactory.GetAllInstances(packageManagerOptions);

        this._logger.LogTrace(`attempting to find manager for package ${packageModel}`);

        const results = new Array<string>();

        for (const i in packageManagers) {
            const currentPackageManager = packageManagers[i];

            this._logger.LogTrace(`checking if ${currentPackageManager.ServiceIdentifier} has package ${packageModel}`);
            if (await currentPackageManager.GetPackageAvaiableForInstall(packageModel)) {
                this._logger.LogTrace(`package ${packageModel} was found in ${currentPackageManager.ServiceIdentifier}`);
                results.push(currentPackageManager.ServiceIdentifier);
            }
        }

        return results;
    }

    protected async EnsurePackageHasManager(packageModel: PackageModel): Promise<void> {
        if (!packageModel.HasManager()) {
            this._logger.LogTrace(`package ${packageModel} has no manager supplied`);
            const managers = await this.FindPossiblePackageManagers(packageModel);

            if (managers.length === 0) {
                throw new Error(`Package ${packageModel} was not found in any package manager`);
            }
            if (managers.length > 1) {
                // TODO: Allow option CLI selection of manager to install from
                throw new Error(`Package ${packageModel} matches packages from multiple managers: ${managers.join(',')}`);
            }

            packageModel.Manager = managers[0];

            this._logger.LogTrace(`package ${packageModel} was assigned manager ${packageModel.Manager}`);
        }
    }

    protected AddRequiredPackageManager(packageManager: string, options: PackageServiceOptions): void {
        const hashEntry = new PackageManagerWithOption(packageManager, options);
        this._requiredPackageManagers.Add(hashEntry);
    }

    protected async PreparePackageManagers(): Promise<boolean> {
        const packageManagersWithOptions = this._requiredPackageManagers.GetItems();
        this._logger.LogTrace(`command requires the following package managers: ${packageManagersWithOptions.map(m => m.PackageManager).join(', ')}`);

        const missingManagers: PackageManagerWithOption[] = [];
        const installableManagers: PackageManagerWithOption[] = [];
        const autoInstallableManagers: PackageManagerWithOption[] = [];
        const failedManagers: { Manager: PackageManagerWithOption, Reason: string }[] = [];

        for (const i in packageManagersWithOptions) {
            const packageManagerWithOption = packageManagersWithOptions[i];
            this._logger.LogTrace(`checking if package manager ${packageManagerWithOption.PackageManager} is available`);

            try {
                const packageManagerInstance = await this._packageServiceFactory.GetInstance(packageManagerWithOption.PackageManager, packageManagerWithOption.Options);
                if (!await packageManagerInstance.IsServiceAvailable()) {
                    this._logger.LogTrace(`package manager ${packageManagerWithOption.PackageManager} is not available`);
                    if (await packageManagerInstance.IsServiceInstallable()) {
                        this._logger.LogTrace(`package manager ${packageManagerWithOption.PackageManager} is installable`);

                        // TODO: Auto confirm installation only when install context is a local directory (not a absoulte path or above current pwd)
                        if (packageManagerWithOption.Options.Context === PackageContextEnum.Directory) {
                            this._logger.LogTrace(`package manager ${packageManagerWithOption.PackageManager} will be auto installed`);
                            autoInstallableManagers.push(packageManagerWithOption);
                        }
                        else {
                            this._logger.LogTrace(`package manager ${packageManagerWithOption.PackageManager} will prompt for user approval`);
                            installableManagers.push(packageManagerWithOption);
                        }
                    }
                    else {
                        this._logger.LogTrace(`package manager ${packageManagerWithOption.PackageManager} is not installable`);
                        missingManagers.push(packageManagerWithOption);
                    }
                }
            }
            catch (ex) {
                this._logger.LogError(`package manager ${packageManagerWithOption.PackageManager} failed with the following error: ${ex}`);
                failedManagers.push({
                    Manager: packageManagerWithOption,
                    Reason: ex.message
                });
            }
        }

        if (missingManagers.length + installableManagers.length + failedManagers.length + autoInstallableManagers.length > 0) {
            if (missingManagers.length > 0) {
                this._consoleGUI.Output('The following package managers are missing but cannot be auto installed');

                for (const i in missingManagers) {
                    const missingManager = missingManagers[i];
                    this._consoleGUI.Output(`\t[${missingManager.Options.GetContextAsString()}] ${missingManager.PackageManager}`);
                }

                this._consoleGUI.Output('');
            }

            if (installableManagers.length > 0) {
                this._consoleGUI.Output('The following package managers are missing and can be auto installed');

                for (const i in installableManagers) {
                    const installableManager = installableManagers[i];
                    this._consoleGUI.Output(`\t[${installableManager.Options.GetContextAsString()}] ${installableManager.PackageManager}`);
                }

                this._consoleGUI.Output('');
            }

            if (failedManagers.length > 0) {
                this._consoleGUI.DisplayError('The following package managers failed to resolve');

                for (const i in failedManagers) {
                    const failedManager = failedManagers[i];
                    this._consoleGUI.Output(`\t[${failedManager.Manager.Options.GetContextAsString()}] ${failedManager.Manager.PackageManager}: ${failedManager.Reason}`);
                }

                this._consoleGUI.Output('');

                return false;
            }

            if (missingManagers.length > 0) {
                this._consoleGUI.Output('Please install the missing package manager(s) above and re-run command');
                return false;
            }

            // TODO: Should this even output?
            if (autoInstallableManagers.length > 0) {
                this._consoleGUI.Output('The following package managers will be auto installed');

                for (const i in autoInstallableManagers) {
                    const autoInstallableManager = autoInstallableManagers[i];
                    this._consoleGUI.Output(`\t[${autoInstallableManager.Options.GetContextAsString()}] ${autoInstallableManager.PackageManager}`);
                }

                this._consoleGUI.Output('');
            }

            const shouldInstall = installableManagers.length === 0
                || await this._consoleGUI.ConfirmUserInput('Install missing package managers?');

            if (shouldInstall) {
                try {
                    await this.InstallPackageManagers(installableManagers);
                    await this.InstallPackageManagers(autoInstallableManagers);

                    this._consoleGUI.Output('');

                    return true;
                }
                catch (ex) {
                    this._consoleGUI.Output(`Error during package manager install\n\n${ex}`);
                    return false;
                }
            }
            else {
                this._consoleGUI.Output('Not continuing with auto installation');
                return false;
            }
        }

        return true;
    }

    private async InstallPackageManagers(packageManagers: PackageManagerWithOption[]): Promise<void> {
        for (const i in packageManagers) {
            const packageManagerWithOption = packageManagers[i];

            // TODO: Improve the display of this
            this._consoleGUI.Output(`Installing [${packageManagerWithOption.Options.GetContextAsString()}] ${packageManagerWithOption.PackageManager}`);

            const packageService = await this._packageServiceFactory.GetInstance(packageManagerWithOption.PackageManager, packageManagerWithOption.Options);

            if (!await packageService.InstallService()) {
                throw new Error(`Error while attempting to install the ${packageManagerWithOption.PackageManager} service`);
            }
        }
    }
}