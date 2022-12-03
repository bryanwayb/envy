import Container, { Service } from 'typedi';
import { IPackageService } from '../Interfaces/IPackageService';
import { DI_IPackageService_ChocolateyPackageService } from '../../consts';
import ProcessService, { OperatingSystem } from '../Services/ProcessService';
import { PackageModel } from './Models/PackageModel';

@Service(DI_IPackageService_ChocolateyPackageService)
export default class ChocolateyPackageService implements IPackageService {
    private _processService = Container.get(ProcessService);

    private CHOCO_LIST_COMMAND = 'choco list -l --no-progress --nocolor';
    private CHOCO_SEARCH_COMMAND = 'choco search --no-progress --nocolor';

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
        const response = await this._processService.Execute(this.CHOCO_LIST_COMMAND);

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

    async SearchPackages(query: string): Promise<PackageModel[]> {
        const response = await this._processService.Execute(`${this.CHOCO_SEARCH_COMMAND} ${query}`);

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

    async IsAvailable(): Promise<boolean> {
        return this._processService.GetOS() === OperatingSystem.Windows
            && await this._processService.FindInPath('choco') !== null;
    }
};