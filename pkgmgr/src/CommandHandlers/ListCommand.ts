import Container, { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_ListCommand, DI_IPackageServiceFactory } from '../../consts';
import { IPackageServiceFactory } from '../Interfaces/IPackageServiceFactory';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import BaseCommand from './BaseCommand';

@Service(DI_ICommandHandler_ListCommand)
export default class ListCommand extends BaseCommand implements ICommandHandler {
    private readonly _packageServiceFactory = Container.get<IPackageServiceFactory>(DI_IPackageServiceFactory);

    async Execute(): Promise<number> {
        this._logger.LogTrace(`getting installed packages`);

        const packageServices = await this._packageServiceFactory.GetAllInstances();

        const foundPackages = new Array<PackageModel>();

        const passedPackages = this.GetPassedPackages();
        if (passedPackages.length > 0) {
            for (const i in passedPackages) {
                const passedPackage = passedPackages[i];

                if (!passedPackage.HasManager()) {
                    this._logger.LogTrace(`package ${passedPackage} has no manager supplied, querying all managers`);
                    for (const i in packageServices) {
                        const packageService = packageServices[i];
                        const packageServicePackages = await packageService.GetInstalled(passedPackage);
                        foundPackages.push(...packageServicePackages);
                    }
                }
                else {
                    this._logger.LogTrace(`package ${passedPackage} supplied manager ${passedPackage.Manager}`);
                    const packageService = await this._packageServiceFactory.GetInstance(passedPackage.Manager);
                    const packageServicePackages = await packageService.GetInstalled(passedPackage);
                    foundPackages.push(...packageServicePackages);
                }
            }
        }
        else {
            for (const i in packageServices) {
                const packageService = packageServices[i];
                const packageServicePackages = await packageService.GetInstalled();
                foundPackages.push(...packageServicePackages);
            }
        }

        console.log(foundPackages.map(m => m.toString()).join('\n'));

        this._logger.LogTrace(`list finished`);

        return 0;
    }
};