import { PackageModel } from "../PackageServices/Models/PackageModel";

export interface IPackageService {
    PrepareForUsage(): Promise<void>;
    GetInstalled(): Promise<Array<PackageModel>>;
};