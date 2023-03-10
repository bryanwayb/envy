import Container, { Service } from 'typedi';
import { IPackageService } from '../Interfaces/IPackageService';
import { DI_IConfiguration_Configuration, DI_IPackageService_ChocolateyPackageService } from '../../consts';
import { EnumOperatingSystem, ProcessServiceEnvironment } from '../Services/ProcessService';
import { PackageModel } from './Models/PackageModel';
import ConfigurationService from '../Configuration/ConfigurationService';
import FormatterService from '../Services/FormatterService';
import { ChocolateyConfigurationModel } from '../Configuration/Models/ConfigurationModel';
import { PackageContextEnum, PackageServiceOptions } from './Models/PackageServiceOptions';
import { BasePackageService } from './BasePackageService';
import { dirname as dirnamePath, resolve as resolvePath } from 'path';

@Service(DI_IPackageService_ChocolateyPackageService)
export default class ChocolateyPackageService extends BasePackageService implements IPackageService {
    ServiceIdentifier = 'choco';

    private _formatterService = Container.get<FormatterService>(FormatterService);

    public async WithOptions(options: PackageServiceOptions): Promise<IPackageService> {
        if (options.Context !== this._options.Context) {
            const instance = new ChocolateyPackageService();
            instance.SetOptions(options);
            return instance;
        }

        return this;
    }

    public async GetProcessServiceEnvironment(): Promise<ProcessServiceEnvironment> {
        if (this._options.Context !== PackageContextEnum.System) {
            const processServiceEnvironment = new ProcessServiceEnvironment();

            let rootPath: string = null;

            if (this._options.Context === PackageContextEnum.User) {
                rootPath = `${processServiceEnvironment.UserHome}/.nv`;
            }
            else if (this._options.Context === PackageContextEnum.Directory) {
                rootPath = resolvePath(processServiceEnvironment.WorkingDirectory, this._options.Directory);
            }
            else {
                throw new Error(`Context ${this._options.Context} is not supported for choco`);
            }

            const config = await this.GetConfiguration();
            const allExecutableLocations = (await processServiceEnvironment.FindAllInPath(config.rootCommand)).map(m => dirnamePath(m));
            processServiceEnvironment.RemovePath(allExecutableLocations);
            processServiceEnvironment.AddPath([`${rootPath}/choco/bin`]);

            processServiceEnvironment.SetEnvironmentVariable('ChocolateyInstall', `${rootPath}/choco`);

            return processServiceEnvironment;
        }

        return null;
    }

    private async GetConfiguration(): Promise<ChocolateyConfigurationModel> {
        const configuraitonService = Container.get<ConfigurationService>(DI_IConfiguration_Configuration)
        const allConfig = await configuraitonService.GetConfiguration();
        return allConfig.packageManagers.chocolatey;
    }

    private ParseRawInstalledPackageString(input: string): PackageModel {
        const sections = input.split(' ');

        if (sections.length >= 2) {
            const packageEntry = new PackageModel();

            packageEntry.Manager = this.ServiceIdentifier;
            packageEntry.Name = sections[0].trim();
            packageEntry.Version = sections[1].trim();

            this._logger.LogTrace(`parsed ${packageEntry} from: ${input}`);

            return packageEntry;
        }

        return null;
    }

    private ParseRawChocolateyPackageList(input: string): PackageModel[] {
        const rawPackages = input.split('\n');

        let shouldParse = false;

        const packages = new Array<PackageModel>();
        for (const i in rawPackages) {
            if (rawPackages[i].indexOf('Chocolatey v') !== -1
                || rawPackages[i].trim() === '') {
                shouldParse = true;
                continue;
            }
            else if (rawPackages[i].indexOf('validations performed.') !== -1
                || rawPackages[i].indexOf('Validation Warnings:') !== -1) {
                shouldParse = false;
                continue;
            }
            else if (rawPackages[i].indexOf('packages found.') !== -1
                || rawPackages[i].indexOf('packages installed.') !== -1) {
                break;
            }

            if (shouldParse) {
                const parsed = this.ParseRawInstalledPackageString(rawPackages[i]);
                if (parsed) {
                    packages.push(parsed);
                }
            }
        }

        return packages;
    }

    private async ExecuteCommand<T>(commandTemplate: string, data: T = null): Promise<string> {
        const config = await this.GetConfiguration();

        const commandLine = this._formatterService.String(commandTemplate, {
            ...config,
            ...data
        });

        const processService = await this.GetProcessService();
        return await processService.Execute(commandLine, data => {
            if (data.indexOf('[A]ll') !== -1) {
                return 'A\n';
            }
            else if (data.indexOf('[Y]es') !== -1) {
                return 'Y\n';
            }
            return null;
        });
    }

    async FilterInstalled(packageModel?: PackageModel): Promise<Array<PackageModel>> {
        const config = await this.GetConfiguration();
        const response = await this.ExecuteCommand(config.filterInstalledCommand, {
            package: packageModel
        });

        return this.ParseRawChocolateyPackageList(response);
    }

    async IsInstalled(packageModel: PackageModel): Promise<boolean> {
        const config = await this.GetConfiguration();
        const response = await this.ExecuteCommand(config.isInstalledCommand, {
            package: packageModel
        });

        const foundResults = this.ParseRawChocolateyPackageList(response);

        return foundResults.filter(f => f.Equals(packageModel)).length === 1;
    }

    async GetInstalledPackage(packageModel: PackageModel): Promise<PackageModel> {
        const config = await this.GetConfiguration();
        const response = await this.ExecuteCommand(config.getInstalledPackageCommand, {
            package: packageModel
        });

        const foundResults = this.ParseRawChocolateyPackageList(response);
        const filteredResults = foundResults.filter(f => f.Name.toLowerCase() === packageModel.Name.toLowerCase());

        return filteredResults.length > 0 ? filteredResults[0] : null;
    }

    async GetPackageAvaiableForInstall(packageModel: PackageModel): Promise<PackageModel> {
        const config = await this.GetConfiguration();
        const response = await this.ExecuteCommand(config.isPackageAvaiableForInstallCommand, {
            package: packageModel
        });

        const foundResults = this.ParseRawChocolateyPackageList(response);

        const filteredResults = foundResults.filter(f => packageModel.Name.toLowerCase() === f.Name.toLowerCase());

        if (filteredResults.length === 1) {
            return filteredResults[0];
        }

        return null;
    }

    async GetExistingInstalledVersion(packageModel: PackageModel): Promise<PackageModel> {
        const config = await this.GetConfiguration();
        const response = await this.ExecuteCommand(config.getExistingInstalledVersionCommand, {
            package: packageModel
        });

        const foundResults = this.ParseRawChocolateyPackageList(response);
        const filteredResults = foundResults.filter(f => packageModel.Name === f.Name
            && packageModel.Manager === f.Manager);

        if (filteredResults.length === 1) {
            return filteredResults[0];
        }

        return null;
    }

    async SearchPackages(packageModel: PackageModel): Promise<PackageModel[]> {
        const config = await this.GetConfiguration();
        const response = await this.ExecuteCommand(config.searchCommand, {
            package: packageModel
        });

        return this.ParseRawChocolateyPackageList(response);
    }

    async InstallPackage(packageModel: PackageModel): Promise<void> {
        await this.VerifyIfAdminNeeded();
        const config = await this.GetConfiguration();

        // TODO: Handle response codes

        await this.ExecuteCommand(config.installCommand, {
            package: packageModel
        });
    }

    async UninstallPackage(packageModel: PackageModel): Promise<void> {
        await this.VerifyIfAdminNeeded();
        const config = await this.GetConfiguration();

        // TODO: Handle response codes

        await this.ExecuteCommand(config.uninstallCommand, {
            package: packageModel
        });
    }

    async UpgradePackage(packageModel: PackageModel): Promise<void> {
        await this.VerifyIfAdminNeeded();

        const config = await this.GetConfiguration();

        // TODO: Handle response codes

        await this.ExecuteCommand(config.upgradeCommand, {
            package: packageModel
        });
    }

    async IsServiceAvailable(): Promise<boolean> {
        const config = await this.GetConfiguration();
        const processService = await this.GetProcessService();
        return config.enabled
            && processService.GetOS() === EnumOperatingSystem.Windows
            && await processService.FindInPath(config.rootCommand) !== null;
    }

    async IsServiceInstallable(): Promise<boolean> {
        const config = await this.GetConfiguration();
        const processService = await this.GetProcessService();

        return config.enabled
            && processService.GetOS() === EnumOperatingSystem.Windows;
    }

    async InstallService(): Promise<boolean> {
        await this.VerifyIfAdminNeeded();

        const config = await this.GetConfiguration();
        this._logger.LogTrace(`installing choco`);
        if (!config.dryRun) {
            try {
                const processService = await this.GetProcessService();

                let installCommand = `Set-ExecutionPolicy Bypass -Scope Process -Force;
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072;
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'));`;

                if (this._options.Context === PackageContextEnum.Directory) {
                    installCommand = `function Replacement-Install-ChocolateyPath {param([parameter(Mandatory=$true, Position=0)][string] $pathToInstall,[parameter(Mandatory=$false, Position=1)][System.EnvironmentVariableTarget] $pathType = [System.EnvironmentVariableTarget]::User,[parameter(ValueFromRemainingArguments = $true)][Object[]] $ignoredArguments)}
Set-Alias -Name Install-ChocolateyPath -Value "Replacement-Install-ChocolateyPath";
${installCommand}`;
                }

                const result = await processService.ExecutePowerShell(installCommand);
                if (!result) {
                    return false;
                }

                // TODO: Check the output to see if installation was successful
            }
            catch (ex) {
                this._logger.LogError(ex);
                return false;
            }
        }
        else {
            this._logger.LogTrace(`dryrun is enabled, not actually installing`);
        }
        return true;
    }
};