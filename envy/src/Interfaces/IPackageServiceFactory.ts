import { PackageServiceOptions } from "../PackageServices/Models/PackageServiceOptions";
import { IPackageService } from "./IPackageService";

export interface IPackageServiceFactory {
    GetInstance(name: string, options: PackageServiceOptions): Promise<IPackageService>;
    GetAllInstances(options: PackageServiceOptions): Promise<IPackageService[]>;
};