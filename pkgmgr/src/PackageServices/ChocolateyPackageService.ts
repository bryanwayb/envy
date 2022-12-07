import Container, { Service } from 'typedi';
import { IPackageService } from '../Interfaces/IPackageService';
import { DI_IConfiguration_Configuration, DI_IPackageService_ChocolateyPackageService } from '../../consts';
import ProcessService, { OperatingSystem } from '../Services/ProcessService';
import { PackageModel } from './Models/PackageModel';
import Configuration from '../Configuration/Configuration';
import FormatterService from '../Services/FormatterService';

@Service(DI_IPackageService_ChocolateyPackageService)
export default class ChocolateyPackageService implements IPackageService {
    ServiceIdentifier = 'chocolatey';

    private _processService = Container.get(ProcessService);
    private _configuration = Container.get<Configuration>(DI_IConfiguration_Configuration);
    private _formatterService = Container.get<FormatterService>(FormatterService);

    private ParseRawInstalledPackageString(input: string): PackageModel {
        const sections = input.split(' ');

        if (sections.length >= 2) {
            const packageEntry = new PackageModel();

            packageEntry.Manager = 'chocolatey';
            packageEntry.Name = sections[0].trim();
            packageEntry.Version = sections[1].trim();
            //packageEntry.Description = sections.splice(2).join(' ').trim();

            return packageEntry;
        }

        return null;
    }

    async GetInstalled(): Promise<Array<PackageModel>> {
        const config = await this._configuration.GetConfiguration();
        const response = await this._processService.Execute(`${config.packageManagers.chocolatey.rootCommand} ${config.packageManagers.chocolatey.getInstalledCommand}`);

        const rawPackages = response.split('\n');

        const packages = new Array<PackageModel>();
        for (const i in rawPackages) {
            if (rawPackages[i].indexOf('Chocolatey v') !== -1) {
                continue;
            }
            else if (rawPackages[i].indexOf('packages installed.') !== -1) {
                break;
            }

            const parsed = this.ParseRawInstalledPackageString(rawPackages[i]);
            if (parsed) {
                packages.push(parsed);
            }
        }

        return packages;
    }

    IsInstalled(packageModel: PackageModel): Promise<boolean> {
        return Promise.resolve(false);
    }

    IsPackageAvaiable(packageModel: PackageModel): Promise<boolean> {
        return Promise.resolve(true);
    }

    IsUpdateAvailable(packageModel: PackageModel): Promise<boolean> {
        return Promise.resolve(true);
    }

    IsUpdateRequired(packageModel: PackageModel): Promise<boolean> {
        return Promise.resolve(true);
    }

    async SearchPackages(query: string): Promise<PackageModel[]> {
        const config = await this._configuration.GetConfiguration();

        const commandLine = this._formatterService.String(config.packageManagers.chocolatey.searchCommand, {
            ...config.packageManagers.chocolatey,
            query
        });

        const response = await this._processService.Execute(commandLine);

        const rawPackages = response.split('\n');

        const packages = new Array<PackageModel>();
        for (const i in rawPackages) {
            if (rawPackages[i].indexOf('Chocolatey v') !== -1) {
                continue;
            }
            else if (rawPackages[i].indexOf('packages found.') !== -1) {
                break;
            }

            const parsed = this.ParseRawInstalledPackageString(rawPackages[i]);
            if (parsed) {
                packages.push(parsed);
            }
        }

        return packages;
    }

    async InstallPackage(packageModel: PackageModel): Promise<void> {
        //const config = await this._configuration.GetConfiguration();
        //const response = await this._processService.Execute(`${config.packageManagers.chocolatey.rootCommand} ${config.packageManagers.chocolatey.installCommand} ${query}`);

        //console.log(response);
    }

    async IsServiceAvailable(): Promise<boolean> {
        const config = await this._configuration.GetConfiguration();
        return config.packageManagers.chocolatey.enabled
            && this._processService.GetOS() === OperatingSystem.Windows
            && await this._processService.FindInPath('choco') !== null;
    }
};