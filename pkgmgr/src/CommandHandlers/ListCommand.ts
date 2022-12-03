import Container, { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_ListCommand, DI_IPackageService_AggregatedPackageService } from '../../consts';
import { IPackageService } from '../Interfaces/IPackageService';
import ConsoleGUI from '../Services/ConsoleGUI';

@Service(DI_ICommandHandler_ListCommand)
export default class ListCommand implements ICommandHandler {
    async Execute(): Promise<number> {
        console.log('getting installed packages');

        const packageService = Container.get<IPackageService>(DI_IPackageService_AggregatedPackageService);
        const consoleGUI = Container.get<ConsoleGUI>(ConsoleGUI);

        const installedPackages = await packageService.GetInstalled();
        consoleGUI.PrintConsoleTable(installedPackages);

        console.log('done');

        return 0;
    }
};