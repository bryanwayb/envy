import { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_InstallCommand } from '../../consts';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import BaseCommand from './BaseCommand';

@Service(DI_ICommandHandler_InstallCommand)
export default class InstallCommand extends BaseCommand implements ICommandHandler {
    private async GetPackagesToInstall(): Promise<PackageModel[]> {
        const results = new Array<PackageModel>();

        const passedPackages = this.GetPassedPackages();

        this._logger.LogTrace(`validating packages to install`);

        for (const i in passedPackages) {
            const passedPackage = passedPackages[i];

            await this.EnsurePackageHasManager(passedPackage);

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
            this._logger.LogTrace(`installed ${packageToInstall}`);
        }

        this._logger.LogTrace(`installation finished`);

        return 0;
    }
};