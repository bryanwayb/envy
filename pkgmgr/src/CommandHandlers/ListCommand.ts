import Container, { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_ListCommand, DI_IPackageServiceFactory } from '../../consts';
import { IPackageServiceFactory } from '../Interfaces/IPackageServiceFactory';
import { PackageModel } from '../PackageServices/Models/PackageModel';

@Service(DI_ICommandHandler_ListCommand)
export default class ListCommand implements ICommandHandler {
    private readonly _packageServiceFactory = Container.get<IPackageServiceFactory>(DI_IPackageServiceFactory);

    async Execute(): Promise<number> {
        console.log('getting installed packages');

        const packageServices = await this._packageServiceFactory.GetAllInstances();

        const foundPackages = new Array<PackageModel>();

        for (const i in packageServices) {
            const packageService = packageServices[i];
            const packageServicePackages = await packageService.GetInstalled();
            foundPackages.push(...packageServicePackages);
        }

        console.log(foundPackages.map(m => m.toString()).join('\n'));

        return 0;
    }
};