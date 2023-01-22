import EventEmitter from "../Classes/EventEmitter";
import Container from 'typedi';
import { DI_IPackageServiceFactory } from '../../consts';
import { IPackageServiceFactory } from '../Interfaces/IPackageServiceFactory';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import LoggerService from '../Services/LoggerService';
import { IOperation } from "../Interfaces/IOperation";
import { PackageServiceOptions } from "../PackageServices/Models/PackageServiceOptions";

export default abstract class BaseOperation extends EventEmitter implements IOperation {
    public readonly PackageModel: PackageModel;
    public readonly PackageManagerOptions: PackageServiceOptions;
    protected readonly _logger = Container.get(LoggerService).ScopeByName(this.constructor.name);
    protected readonly _packageServiceFactory = Container.get<IPackageServiceFactory>(DI_IPackageServiceFactory);

    constructor(packageModel: PackageModel, packageManagerOptions: PackageServiceOptions) {
        super();
        this.PackageModel = packageModel;
        this.PackageManagerOptions = packageManagerOptions;
    }

    Prepare(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    Execute(): Promise<void> {
        throw new Error('Method not implemented.');
    }
}