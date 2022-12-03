import Container, { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_ListCommand, DI_IConfiguration_Configuration, DI_IPackageService_AggregatedPackageService } from '../../consts';
import { IConfiguration } from '../Interfaces/IConfiguration';
import { IPackageService } from '../Interfaces/IPackageService';

@Service(DI_ICommandHandler_ListCommand)
export default class ListCommand implements ICommandHandler {
    private _configuration: IConfiguration;

    constructor() {
        this._configuration = Container.get<IConfiguration>(DI_IConfiguration_Configuration);
    }

    async Execute(): Promise<number> {
        console.log('getting installed packages');

        //const config = await this._configuration.GetConfiguration();

        const packageService = Container.get<IPackageService>(DI_IPackageService_AggregatedPackageService);

        const installedPackages = await packageService.GetInstalled();
        for (const i in installedPackages) {
            const packageEntry = installedPackages[i];
            console.log(`\t${i}: ${packageEntry.Name}`);
        }

        console.log('done');

        return 0;
    }
};