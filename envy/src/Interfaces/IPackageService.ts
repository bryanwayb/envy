import { PackageModel } from "../PackageServices/Models/PackageModel";
import ResultModel from "../PackageServices/Models/ResultModel";

export interface IPackageService {
    ServiceIdentifier: string;

    IsServiceAvailable(): Promise<boolean>;

    IsInstalled(packageModel: PackageModel): Promise<boolean>;
    GetInstalledPackage(packageModel: PackageModel): Promise<PackageModel>;

    FilterInstalled(packageModel?: PackageModel): Promise<Array<PackageModel>>;
    GetPackageAvaiableForInstall(packageModel: PackageModel): Promise<PackageModel>;
    GetExistingInstalledVersion(packageModel: PackageModel): Promise<PackageModel>;
    SearchPackages(packageModel: PackageModel): Promise<Array<PackageModel>>;

    InstallPackage(packageModel: PackageModel): Promise<ResultModel>;
    UninstallPackage(packageModel: PackageModel): Promise<void>;
    UpgradePackage(packageModel: PackageModel): Promise<void>;
};