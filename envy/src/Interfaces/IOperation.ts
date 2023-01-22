import EventEmitter from '../Classes/EventEmitter';
import { PackageModel } from "../PackageServices/Models/PackageModel";
import { PackageServiceOptions } from '../PackageServices/Models/PackageServiceOptions';

export interface IOperation extends EventEmitter {
    PackageModel: PackageModel;
    PackageManagerOptions: PackageServiceOptions;

    Execute(): Promise<void>;
    Prepare(): Promise<void>;
};