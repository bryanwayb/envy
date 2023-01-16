import { Service } from 'typedi';
import { IOperation } from '../Interfaces/IOperation';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import InstallOperation from './InstallOperation';

@Service()
export default class UpgradeOperation extends InstallOperation implements IOperation {
    private _installedPackage: PackageModel = null;

    async Prepare(): Promise<void> {
        this._packageService = this._packageServiceFactory.GetInstance(this.PackageModel.Manager);

        this.EmitEvent('update', `finding package`);
        this._logger.LogTrace(`checking if ${this.PackageModel} exists in package manager`);

        this._availablePackage = await this._packageService.GetPackageAvaiableForInstall(this.PackageModel);
        if (this._availablePackage === null) {
            this._logger.LogTrace(`${this.PackageModel} does not exist in package manager`);
            // TODO: return an error object here for better error handling
            throw new Error('Could not find package');
        }

        const packageWithoutVersion = new PackageModel(this.PackageModel);
        packageWithoutVersion.Version = null;
        this._installedPackage = await this._packageService.GetInstalledPackage(packageWithoutVersion);
    }

    async Execute(): Promise<void> {
        if (this._installedPackage) {
            if (this._installedPackage.Version === this._availablePackage.Version) {
                this.EmitEvent('success', `package already installed`);
                this._logger.LogTrace(`${this._installedPackage} is already at the requested version, ignoring`);
            }
            else {
                this.EmitEvent('update', `upgrading from ${this._installedPackage.Version} to ${this._availablePackage.Version}`);
                this._logger.LogTrace(`${this._availablePackage} exists in package manager, upgrading from ${this._installedPackage} to ${this._availablePackage}`);

                await this._packageService.UpgradePackage(this._availablePackage);

                this.EmitEvent('success', `installed`);
            }
        }
        else {
            this._logger.LogTrace(`package ${this._availablePackage} is not installed`);
            return await this.Install();
        }
    }
}