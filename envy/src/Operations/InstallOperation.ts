import { Service } from 'typedi';
import { IOperation } from '../Interfaces/IOperation';
import { IPackageService } from '../Interfaces/IPackageService';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import BaseOperation from './BaseOperation';

@Service()
export default class InstallOperation extends BaseOperation implements IOperation {
    protected _availablePackage: PackageModel = null;
    protected _packageService: IPackageService = null;

    async Install(): Promise<void> {
        this.EmitEvent('update', `installing`);

        try {
            await this._packageService.InstallPackage(this._availablePackage);
            this.EmitEvent('success', `installed`);
        }
        catch (ex) {
            this.EmitEvent('fail', 'install failed');
        }
    }
}