import Container, { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_SearchCommand, DI_IPackageServiceFactory } from '../../consts';
import { IPackageServiceFactory } from '../Interfaces/IPackageServiceFactory';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import BaseCommand from './BaseCommand';

@Service(DI_ICommandHandler_SearchCommand)
export default class SearchCommand extends BaseCommand implements ICommandHandler {
    private readonly _packageServiceFactory = Container.get<IPackageServiceFactory>(DI_IPackageServiceFactory);

    async Execute(): Promise<number> {
        this._logger.LogTrace(`searching for packages`);

        const passedPackages = this.GetPassedPackages();
        const packageServices = await this._packageServiceFactory.GetAllInstances();

        const foundPackages = new Array<PackageModel>();

        for (const i in passedPackages) {
            const passedPackage = passedPackages[i];

            if (!passedPackage.HasManager()) {
                this._logger.LogTrace(`package ${passedPackage} has no manager supplied, querying all managers`);
                for (const i in packageServices) {
                    const packageService = packageServices[i];
                    const packageServicePackages = await packageService.SearchPackages(passedPackage);
                    foundPackages.push(...packageServicePackages);
                }
            }
            else {
                const packageService = await this._packageServiceFactory.GetInstance(passedPackage.Manager);
                const packageServicePackages = await packageService.SearchPackages(passedPackage);
                foundPackages.push(...packageServicePackages);
            }
        }

        console.log(foundPackages.map(m => m.toString()).join('\n'));

        this._logger.LogTrace(`search finished`);

        return 0;
    }
};