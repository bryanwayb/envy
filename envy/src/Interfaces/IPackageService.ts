import { PackageModel } from "../PackageServices/Models/PackageModel";
import { PackageServiceOptions } from "../PackageServices/Models/PackageServiceOptions";
import { ProcessServiceEnvironment } from "../Services/ProcessService";

export interface IPackageService {
    ServiceIdentifier: string;

    WithOptions(options: PackageServiceOptions): Promise<IPackageService>;

    GetProcessServiceEnvironment(): Promise<ProcessServiceEnvironment>;

    IsServiceAvailable(): Promise<boolean>;
    IsServiceInstallable(): Promise<boolean>;
    InstallService(): Promise<boolean>;

    IsInstalled(packageModel: PackageModel): Promise<boolean>;
    GetInstalledPackage(packageModel: PackageModel): Promise<PackageModel>;

    FilterInstalled(packageModel?: PackageModel): Promise<Array<PackageModel>>;
    GetPackageAvaiableForInstall(packageModel: PackageModel): Promise<PackageModel>;
    GetExistingInstalledVersion(packageModel: PackageModel): Promise<PackageModel>;
    SearchPackages(packageModel: PackageModel): Promise<Array<PackageModel>>;

    InstallPackage(packageModel: PackageModel): Promise<void>;
    UninstallPackage(packageModel: PackageModel): Promise<void>;
    UpgradePackage(packageModel: PackageModel): Promise<void>;
};