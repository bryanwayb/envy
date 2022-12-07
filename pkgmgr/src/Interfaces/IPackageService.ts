import { PackageModel } from "../PackageServices/Models/PackageModel";

export interface IPackageService {
    ServiceIdentifier: string;

    IsServiceAvailable(): Promise<boolean>;

    GetInstalled(packageModel?: PackageModel): Promise<Array<PackageModel>>;
    IsInstalled(packageModel: PackageModel): Promise<boolean>;

    GetPackageAvaiableForInstall(packageModel: PackageModel): Promise<PackageModel>;
    GetExistingInstalledVersion(packageModel: PackageModel): Promise<PackageModel>;
    SearchPackages(packageModel: PackageModel): Promise<Array<PackageModel>>;

    InstallPackage(packageModel: PackageModel): Promise<void>;
};