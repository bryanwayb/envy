import EventEmitter from '../Classes/EventEmitter';
import { PackageModel } from "../PackageServices/Models/PackageModel";

export interface IOperation extends EventEmitter {
    PackageModel: PackageModel;

    Execute(): Promise<void>;
    Prepare(): Promise<void>;
};