import { PackageModel } from "../PackageServices/Models/PackageModel";

export interface IPackageService {
    IsAvailable(): Promise<boolean>;
    GetInstalled(): Promise<Array<PackageModel>>;
    SearchPackages(query: string): Promise<Array<PackageModel>>;
    InstallPackage(query: string): Promise<void>;
};