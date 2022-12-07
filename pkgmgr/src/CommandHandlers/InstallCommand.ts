import Container, { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_InstallCommand, DI_IPackageServiceFactory } from '../../consts';
import { IPackageServiceFactory } from '../Interfaces/IPackageServiceFactory';
import CommandLineService from '../Services/CommandLineService';
import { PackageModel } from '../PackageServices/Models/PackageModel';

@Service(DI_ICommandHandler_InstallCommand)
export default class InstallCommand implements ICommandHandler {
    private _packageServiceFactory = Container.get<IPackageServiceFactory>(DI_IPackageServiceFactory);
    private _commandLineService = Container.get<CommandLineService>(CommandLineService);

    private GetPassedPackages(): PackageModel[] {
        const results = new Array<PackageModel>();

        let currentPackageString;
        let index = 0;
        while ((currentPackageString = this._commandLineService.GetArgument(index++))) {
            results.push(PackageModel.Parse(currentPackageString));
        }

        return results;
    }

    private async FindPossiblePackageManagers(packageModel: PackageModel): Promise<string[]> {
        const packageManagers = await this._packageServiceFactory.GetAllInstances();

        const results = new Array<string>();

        for (const i in packageManagers) {
            const currentPackageManager = packageManagers[i];

            if (await currentPackageManager.IsPackageAvaiable(packageModel)) {
                results.push(currentPackageManager.ServiceIdentifier);
            }
        }

        return results;
    }

    private async GetPackagesToInstall(): Promise<PackageModel[]> {
        const results = new Array<PackageModel>();

        const passedPackages = this.GetPassedPackages();
        for (const i in passedPackages) {
            const passedPackage = passedPackages[i];

            if (!passedPackage.HasManager()) {
                const managers = await this.FindPossiblePackageManagers(passedPackage);

                if (managers.length === 0) {
                    throw new Error(`Package ${passedPackage} was not found in any package manager`);
                }
                if (managers.length > 1) {
                    // TODO: Allow option CLI selection of manager to install from
                    throw new Error(`Package ${passedPackage} matches packages from multiple managers: ${managers.join(',')}`);
                }

                passedPackage.Manager = managers[0];
            }

            const packageService = this._packageServiceFactory.GetInstance(passedPackage.Manager);
            if (await packageService.IsInstalled(passedPackage)) {
                throw new Error(`Package ${passedPackage} is already installed`);
            }
            else if (await packageService.IsUpdateRequired(passedPackage)) {
                throw new Error(`Package ${passedPackage} is already installed, but an update is available`);
            }

            results.push(passedPackage);
        }

        return results;
    }

    async Execute(): Promise<number> {
        console.log('installing packages');

        const packagesToInstall = await this.GetPackagesToInstall();
        for (const i in packagesToInstall) {
            const packageToInstall = packagesToInstall[i];
            const packageService = this._packageServiceFactory.GetInstance(packageToInstall.Manager);
            await packageService.InstallPackage(packageToInstall);
        }

        console.log('done');

        return 0;
    }
};