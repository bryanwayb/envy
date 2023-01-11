import { IPackageService } from "./IPackageService";

export interface IPackageServiceFactory {
    GetInstance(name: string): IPackageService;
    GetAllInstances(): Promise<IPackageService[]>;
};