import { Service } from 'typedi';
import { IOperation } from '../Interfaces/IOperation';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import BaseOperation from './BaseOperation';

@Service()
export default class InstallOperation extends BaseOperation implements IOperation {
    async Install(packageModel: PackageModel): Promise<void> {
        const packageService = this._packageServiceFactory.GetInstance(packageModel.Manager);

        this.EmitEvent('update', `installing ${packageModel}`);
        await packageService.InstallPackage(packageModel);
        this.EmitEvent('success', `installed`);
    }

    Execute(): Promise<void> {
        throw new Error('Method not implemented.');
    }
}