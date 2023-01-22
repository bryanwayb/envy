import { PackageServiceOptions } from "../PackageServices/Models/PackageServiceOptions";
import { IPackageService } from "./IPackageService";

export interface IPackageServiceFactory {
    GetInstance(name: string, options: PackageServiceOptions): IPackageService;
    GetAllInstances(options: PackageServiceOptions): Promise<IPackageService[]>;
};