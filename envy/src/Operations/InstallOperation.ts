import { Service } from 'typedi';
import { IOperation } from '../Interfaces/IOperation';
import { IPackageService } from '../Interfaces/IPackageService';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import BaseOperation from './BaseOperation';

@Service()
export default class InstallOperation extends BaseOperation implements IOperation {
    protected _availablePackage: PackageModel = null;
    protected _packageService: IPackageService = null;

    async Prepare(): Promise<void> {
        this._packageService = await this._packageServiceFactory.GetInstance(this.PackageModel.Manager, this.PackageManagerOptions);

        this.EmitEvent('update', `finding package`);
        this._logger.LogTrace(`checking if ${this.PackageModel} exists in package manager`);

        this._availablePackage = await this._packageService.GetPackageAvaiableForInstall(this.PackageModel);
        if (this._availablePackage === null) {
            this._logger.LogTrace(`${this.PackageModel} does not exist in package manager`);
            this.EmitEvent('fail', 'package not found');
            throw new Error('Could not find package');
        }

        const packageWithoutVersion = new PackageModel(this.PackageModel);
        packageWithoutVersion.Version = null;

        if (await this._packageService.IsInstalled(packageWithoutVersion)) {
            this.EmitEvent('fail', 'already installed');
        }
        else {
            this.EmitEvent('update', `ready to install`);
        }
    }

    Execute(): Promise<void> {
        return this.Install();
    }

    async Install(): Promise<void> {
        this.EmitEvent('update', `installing`);

        try {
            this._logger.LogTrace(`attempting to install ${this._availablePackage}`);
            await this._packageService.InstallPackage(this._availablePackage);
            this._logger.LogTrace(`installed ${this._availablePackage}`);
            this.EmitEvent('success', `installed`);
        }
        catch (ex) {
            this.EmitEvent('fail', 'install failed');
        }
    }
}