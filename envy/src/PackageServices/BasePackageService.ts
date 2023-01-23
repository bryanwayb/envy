import Container from "typedi";
import { IPackageService } from "../Interfaces/IPackageService";
import LoggerService from "../Services/LoggerService";
import { PackageModel } from "./Models/PackageModel";
import { PackageServiceOptions } from "./Models/PackageServiceOptions";
import { resolve as resolvePath } from 'path';
import ProcessService from "../Services/ProcessService";
import YamlSerializationService from "../Services/YamlSerializationService";
import ConsoleGUI from "../Services/ConsoleGUI";

export abstract class BasePackageService implements IPackageService {
    protected readonly _logger = Container.get(LoggerService).ScopeByName(this.constructor.name);
    protected readonly _processService = Container.get(ProcessService);
    protected readonly _yamlSerializationService = Container.get(YamlSerializationService);
    protected readonly _consoleGUI = Container.get(ConsoleGUI);

    protected _options = new PackageServiceOptions();
    protected SetOptions(options: PackageServiceOptions = new PackageServiceOptions()) {
        this._options = options;
    }

    abstract get OverrideInstallPath(): string;

    protected GetEnvironmentFilePath(): string {
        if (this.OverrideInstallPath) {
            const userDirectory = this._processService.GetUserHomeDirectory();
            const envFilePath = resolvePath(userDirectory, this.OverrideInstallPath, '.env.yml');
            return envFilePath;
        }

        return null;
    }

    protected async GetEnvironment(): Promise<{ [key: string]: string }> {
        this._logger.LogTrace(`setting environment variables for ${this.ServiceIdentifier} with context: ${this._options.GetContextAsString()}`);

        const ret: { [key: string]: string } = {};
        const processEnv = this._processService.GetEnvironment();
        //Object.assign(ret, processEnv);

        const envFilePath = this.GetEnvironmentFilePath();
        if (envFilePath) {
            this._logger.LogTrace(`loading environment file: ${envFilePath}`);
            ret.PATH = ''; // TODO: Will likely need to modify this to allow some of the existing system path to stay
            try {
                const loadedEnv = await this._yamlSerializationService.LoadYamlFromFile<{ [key: string]: string }>(envFilePath);
                Object.assign(ret, loadedEnv);
            }
            catch (ex) {
                this._consoleGUI.DisplayWarning(`Unable to load env file "${envFilePath}"`);
                this._logger.LogError(`Error while attempting to load env file: ${ex}`);
            }
        }
        else {
            this._logger.LogTrace(`using system environment`);
        }

        return ret;
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