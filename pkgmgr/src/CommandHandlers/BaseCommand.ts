import Container from "typedi";
import { PackageModel } from "../PackageServices/Models/PackageModel";
import CommandLineService from "../Services/CommandLineService";
import LoggerService from "../Services/LoggerService";
import { IPackageServiceFactory } from '../Interfaces/IPackageServiceFactory';
import { DI_IPackageServiceFactory } from "../../consts";
import ConsoleGUI from "../Services/ConsoleGUI";

export default abstract class BaseCommand {
    protected readonly _commandLineService = Container.get(CommandLineService);
    protected readonly _logger = Container.get(LoggerService).ScopeByName(this.constructor.name);
    protected readonly _packageServiceFactory = Container.get<IPackageServiceFactory>(DI_IPackageServiceFactory);
    protected readonly _consoleGUI = Container.get(ConsoleGUI);

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

    private async FindPossiblePackageManagers(packageModel: PackageModel): Promise<string[]> {
        const packageManagers = await this._packageServiceFactory.GetAllInstances();

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
}