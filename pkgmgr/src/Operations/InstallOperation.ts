import { Service } from 'typedi';
import { IOperation } from '../Interfaces/IOperation';
import { PackageModel } from '../PackageServices/Models/PackageModel';

@Service()
export default class InstallOperation implements IOperation {
    public readonly PackageModel: PackageModel;

    constructor(packageModel: PackageModel) {
        this.PackageModel = packageModel;
    }
}