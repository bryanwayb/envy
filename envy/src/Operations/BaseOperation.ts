import EventEmitter from "../Classes/EventEmitter";
import Container from 'typedi';
import { DI_IPackageServiceFactory } from '../../consts';
import { IPackageServiceFactory } from '../Interfaces/IPackageServiceFactory';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import LoggerService from '../Services/LoggerService';
import { IOperation } from "../Interfaces/IOperation";

export default abstract class BaseOperation extends EventEmitter implements IOperation {
    public readonly PackageModel: PackageModel;
    protected readonly _logger = Container.get(LoggerService).ScopeByName(this.constructor.name);
    protected readonly _packageServiceFactory = Container.get<IPackageServiceFactory>(DI_IPackageServiceFactory);

    constructor(packageModel: PackageModel) {
        super();
        this.PackageModel = packageModel;
    }

    Prepare(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    Execute(): Promise<void> {
        throw new Error('Method not implemented.');
    }
}