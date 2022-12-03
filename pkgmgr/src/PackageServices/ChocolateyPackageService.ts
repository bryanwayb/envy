import Container, { Service } from 'typedi';
import { IPackageService } from '../Interfaces/IPackageService';
import { DI_IPackageService_ChocolateyPackageService } from '../../consts';
import ProcessService from '../Services/ProcessService';
import { PackageModel } from './Models/PackageModel';

@Service(DI_IPackageService_ChocolateyPackageService)
export default class ChocolateyPackageService implements IPackageService {
    private _processService = Container.get(ProcessService);

    private ParseRawInstalledPackageString(input: string): PackageModel {
        const sections = input.split(' ');

        if (sections.length === 2) {
            const packageEntry = new PackageModel();

            packageEntry.Name = sections[0];
            packageEntry.Version = sections[1];

            return packageEntry;
        }

        return null;
    }

    async GetInstalled(): Promise<Array<PackageModel>> {
        const response = await this._processService.Execute('choco list -l --no-progress');

        const rawPackages = response.split('\n');

        const packages = new Array<PackageModel>();
        for (const i in rawPackages) {
            const parsed = this.ParseRawInstalledPackageString(rawPackages[i]);
            if (parsed) {
                packages.push(parsed);
            }
        }

        return packages;
    }

    PrepareForUsage(): Promise<void> {
        return Promise.resolve();
    }
};