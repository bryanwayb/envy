import { PackageModel } from "../PackageServices/Models/PackageModel";

export interface IPackageService {
    ServiceIdentifier: string;

    IsServiceAvailable(): Promise<boolean>;

    GetInstalled(): Promise<Array<PackageModel>>;
    IsInstalled(packageModel: PackageModel): Promise<boolean>;

    GetPackageAvaiableForInstall(packageModel: PackageModel): Promise<PackageModel>;
    GetExistingInstalledVersion(packageModel: PackageModel): Promise<PackageModel>;
    SearchPackages(query: string): Promise<Array<PackageModel>>;

    InstallPackage(packageModel: PackageModel): Promise<void>;
};