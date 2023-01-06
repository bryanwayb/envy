import { Service } from 'typedi';
import { IOperation } from '../Interfaces/IOperation';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import InstallOperation from './InstallOperation';

@Service()
export default class UpgradeOperation extends InstallOperation implements IOperation {
    async Execute(): Promise<void> {
        const packageService = this._packageServiceFactory.GetInstance(this.PackageModel.Manager);

        this.EmitEvent('update', `finding ${this.PackageModel} package`);
        this._logger.LogTrace(`checking if ${this.PackageModel} exists in package manager`);

        const availablePackage = await packageService.GetPackageAvaiableForInstall(this.PackageModel);
        if (availablePackage === null) {
            this._logger.LogTrace(`${this.PackageModel} does not exist in package manager`);
            // TODO: return an error object here for better error handling
            throw new Error('Could not find package');
        }

        const packageWithoutVersion = new PackageModel(this.PackageModel);
        packageWithoutVersion.Version = null;
        const installedPackage = await packageService.GetInstalledPackage(packageWithoutVersion);

        if (installedPackage) {
            if (installedPackage.Version === availablePackage.Version) {
                this.EmitEvent('update', `${installedPackage} is already installed`);
                this._logger.LogTrace(`${installedPackage} is already at the requested version, ignoring`);
            }
            else {
                this.EmitEvent('update', `upgrading from ${installedPackage} to ${availablePackage}`);
                this._logger.LogTrace(`${availablePackage} exists in package manager, upgrading from ${installedPackage} to ${availablePackage}`);

                await packageService.UpgradePackage(availablePackage);

                this.EmitEvent('success', `installed`);
            }
        }
        else {
            this._logger.LogTrace(`package ${availablePackage} is not installed`);
            return await this.Install(availablePackage);
        }
    }
}