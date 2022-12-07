import Container, { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_InstallCommand, DI_IPackageServiceFactory } from '../../consts';
import { IPackageServiceFactory } from '../Interfaces/IPackageServiceFactory';
import CommandLineService from '../Services/CommandLineService';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import LoggerService from '../Services/LoggerService';

@Service(DI_ICommandHandler_InstallCommand)
export default class InstallCommand implements ICommandHandler {
    private _packageServiceFactory = Container.get<IPackageServiceFactory>(DI_IPackageServiceFactory);
    private _commandLineService = Container.get<CommandLineService>(CommandLineService);
    private _logger = Container.get<LoggerService>(LoggerService).Scope(InstallCommand);

    private GetPassedPackages(): PackageModel[] {
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

    private async GetPackagesToInstall(): Promise<PackageModel[]> {
        const results = new Array<PackageModel>();

        const passedPackages = this.GetPassedPackages();

        this._logger.LogTrace(`validating packages to install`);

        for (const i in passedPackages) {
            const passedPackage = passedPackages[i];

            if (!passedPackage.HasManager()) {
                this._logger.LogTrace(`package ${passedPackage} has no manager supplied`);
                const managers = await this.FindPossiblePackageManagers(passedPackage);

                if (managers.length === 0) {
                    throw new Error(`Package ${passedPackage} was not found in any package manager`);
                }
                if (managers.length > 1) {
                    // TODO: Allow option CLI selection of manager to install from
                    throw new Error(`Package ${passedPackage} matches packages from multiple managers: ${managers.join(',')}`);
                }

                passedPackage.Manager = managers[0];

                this._logger.LogTrace(`package ${passedPackage} was assigned manager ${passedPackage.Manager}`);
            }

            const packageService = this._packageServiceFactory.GetInstance(passedPackage.Manager);
            this._logger.LogTrace(`attempting to resolve ${passedPackage}`);

            const resolvedPackage = await packageService.GetPackageAvaiableForInstall(passedPackage);
            if (!resolvedPackage) {
                throw new Error(`Package ${passedPackage} was not found`);
            }

            this._logger.LogTrace(`package ${passedPackage} resolved to ${resolvedPackage}`);

            this._logger.LogTrace(`checking if ${resolvedPackage} is already installed`);
            if (await packageService.IsInstalled(resolvedPackage)) {
                throw new Error(`Package ${resolvedPackage} is already installed`);
            }

            this._logger.LogTrace(`checking if ${resolvedPackage} has a different installed version`);
            const existingInstalledVersion = await packageService.GetExistingInstalledVersion(resolvedPackage);
            if (existingInstalledVersion) {
                throw new Error(`Package ${resolvedPackage} already has a different version installed as ${existingInstalledVersion}`);
            }

            results.push(resolvedPackage);
        }

        return results;
    }

    async Execute(): Promise<number> {
        const packagesToInstall = await this.GetPackagesToInstall();
        for (const i in packagesToInstall) {
            const packageToInstall = packagesToInstall[i];
            const packageService = this._packageServiceFactory.GetInstance(packageToInstall.Manager);

            this._logger.LogTrace(`attempting to install ${packageToInstall}`);
            await packageService.InstallPackage(packageToInstall);
        }

        this._logger.LogTrace(`installation finished`);

        return 0;
    }
};