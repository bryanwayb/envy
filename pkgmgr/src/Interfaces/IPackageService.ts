import { PackageModel } from "../PackageServices/Models/PackageModel";

export interface IPackageService {
    ServiceIdentifier: string;

    IsServiceAvailable(): Promise<boolean>;

    GetInstalled(): Promise<Array<PackageModel>>;
    IsInstalled(packageModel: PackageModel): Promise<boolean>;

    IsPackageAvaiable(packageModel: PackageModel): Promise<boolean>;
    IsUpdateAvailable(packageModel: PackageModel): Promise<boolean>;
    IsUpdateRequired(packageModel: PackageModel): Promise<boolean>;
    SearchPackages(query: string): Promise<Array<PackageModel>>;

    InstallPackage(packageModel: PackageModel): Promise<void>;
};