import Container, { Service } from 'typedi';
import { IPackageService } from '../Interfaces/IPackageService';
import { DI_IConfiguration_Configuration, DI_IPackageService_ChocolateyPackageService } from '../../consts';
import ProcessService, { OperatingSystem } from '../Services/ProcessService';
import { PackageModel } from './Models/PackageModel';
import ConfigurationService from '../Configuration/ConfigurationService';
import FormatterService from '../Services/FormatterService';
import { ChocolateyConfigurationModel } from '../Configuration/Models/ConfigurationModel';
import LoggerService from '../Services/LoggerService';

@Service(DI_IPackageService_ChocolateyPackageService)
export default class ChocolateyPackageService implements IPackageService {
    ServiceIdentifier = 'choco';

    private _processService = Container.get(ProcessService);
    private _formatterService = Container.get<FormatterService>(FormatterService);
    private _logger = Container.get(LoggerService).ScopeByType(ChocolateyPackageService);

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
            //packageEntry.Description = sections.splice(2).join(' ').trim();

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

        return await this._processService.Execute(commandLine, data => {
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
        const filteredResults = foundResults.filter(f => f.Name === packageModel.Name);

        return filteredResults.length > 0 ? filteredResults[0] : null;
    }

    async GetPackageAvaiableForInstall(packageModel: PackageModel): Promise<PackageModel> {
        const config = await this.GetConfiguration();
        const response = await this.ExecuteCommand(config.isPackageAvaiableForInstallCommand, {
            package: packageModel
        });

        const foundResults = this.ParseRawChocolateyPackageList(response);

        const filteredResults = foundResults.filter(f => packageModel.Name === f.Name);

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
        const config = await this.GetConfiguration();

        // TODO: Handle response codes

        await this.ExecuteCommand(config.installCommand, {
            package: packageModel
        });
    }

    async UninstallPackage(packageModel: PackageModel): Promise<void> {
        const config = await this.GetConfiguration();

        // TODO: Handle response codes

        await this.ExecuteCommand(config.uninstallCommand, {
            package: packageModel
        });
    }

    async UpgradePackage(packageModel: PackageModel): Promise<void> {
        const config = await this.GetConfiguration();

        // TODO: Handle response codes

        await this.ExecuteCommand(config.upgradeCommand, {
            package: packageModel
        });
    }

    async IsServiceAvailable(): Promise<boolean> {
        const config = await this.GetConfiguration();
        return config.enabled
            && this._processService.GetOS() === OperatingSystem.Windows
            && await this._processService.FindInPath(config.rootCommand) !== null;
    }
};