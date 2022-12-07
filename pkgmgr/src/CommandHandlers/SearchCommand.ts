import Container, { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_SearchCommand, DI_IPackageServiceFactory } from '../../consts';
import CommandLineService from '../Services/CommandLineService';
import { IPackageServiceFactory } from '../Interfaces/IPackageServiceFactory';
import { PackageModel } from '../PackageServices/Models/PackageModel';

@Service(DI_ICommandHandler_SearchCommand)
export default class SearchCommand implements ICommandHandler {
    private readonly _packageServiceFactory = Container.get<IPackageServiceFactory>(DI_IPackageServiceFactory);
    private readonly _commandLineService = Container.get<CommandLineService>(CommandLineService);

    async Execute(): Promise<number> {
        console.log('searching packages');

        const query = this._commandLineService.GetArgument(0);

        const packageServices = await this._packageServiceFactory.GetAllInstances();

        const foundPackages = new Array<PackageModel>();

        for (const i in packageServices) {
            const packageService = packageServices[i];
            const packageServicePackages = await packageService.SearchPackages(query);
            foundPackages.push(...packageServicePackages);
        }

        console.log(foundPackages.map(m => m.toString()).join('\n'));

        return 0;
    }
};