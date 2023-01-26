import Container from "typedi";
import { IPackageService } from "../Interfaces/IPackageService";
import LoggerService from "../Services/LoggerService";
import { PackageModel } from "./Models/PackageModel";
import { PackageServiceOptions } from "./Models/PackageServiceOptions";
import ProcessService, { ProcessServiceEnvironment } from "../Services/ProcessService";
import YamlSerializationService from "../Services/YamlSerializationService";
import ConsoleGUI from "../Services/ConsoleGUI";

export abstract class BasePackageService implements IPackageService {
    protected readonly _logger = Container.get(LoggerService).ScopeByName(this.constructor.name);
    protected readonly _yamlSerializationService = Container.get(YamlSerializationService);
    protected readonly _consoleGUI = Container.get(ConsoleGUI);

    protected _options = new PackageServiceOptions();
    protected SetOptions(options: PackageServiceOptions = new PackageServiceOptions()) {
        this._options = options;
    }

    protected abstract GetProcessServiceEnvironment(): Promise<ProcessServiceEnvironment>;

    private _processService: ProcessService = null;
    async GetProcessService(): Promise<ProcessService> {
        if (this._processService === null) {
            this._processService = Container.get(ProcessService);

            const processServiceEnvironment = await this.GetProcessServiceEnvironment();
            if (processServiceEnvironment) {
                this._processService = this._processService.WithEnvironment(processServiceEnvironment);
            }
        }
        return this._processService;
    }

    ServiceIdentifier: string = 'not implemented';
    WithOptions(options: PackageServiceOptions): Promise<IPackageService> {
        throw new Error("Method not implemented.");
    }
    IsServiceAvailable(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    IsServiceInstallable(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    InstallService(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    IsInstalled(packageModel: PackageModel): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    GetInstalledPackage(packageModel: PackageModel): Promise<PackageModel> {
        throw new Error("Method not implemented.");
    }
    FilterInstalled(packageModel?: PackageModel): Promise<PackageModel[]> {
        throw new Error("Method not implemented.");
    }
    GetPackageAvaiableForInstall(packageModel: PackageModel): Promise<PackageModel> {
        throw new Error("Method not implemented.");
    }
    GetExistingInstalledVersion(packageModel: PackageModel): Promise<PackageModel> {
        throw new Error("Method not implemented.");
    }
    SearchPackages(packageModel: PackageModel): Promise<PackageModel[]> {
        throw new Error("Method not implemented.");
    }
    InstallPackage(packageModel: PackageModel): Promise<void> {
        throw new Error("Method not implemented.");
    }
    UninstallPackage(packageModel: PackageModel): Promise<void> {
        throw new Error("Method not implemented.");
    }
    UpgradePackage(packageModel: PackageModel): Promise<void> {
        throw new Error("Method not implemented.");
    }
}