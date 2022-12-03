import Container, { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_SearchCommand, DI_IPackageService_AggregatedPackageService } from '../../consts';
import { IPackageService } from '../Interfaces/IPackageService';
import CommandLineService from '../Services/CommandLineService';
import ConsoleGUI from '../Services/ConsoleGUI';

@Service(DI_ICommandHandler_SearchCommand)
export default class SearchCommand implements ICommandHandler {
    async Execute(): Promise<number> {
        console.log('searching packages');

        const packageService = Container.get<IPackageService>(DI_IPackageService_AggregatedPackageService);
        const commandLineService = Container.get<CommandLineService>(CommandLineService);
        const consoleGUI = Container.get<ConsoleGUI>(ConsoleGUI);

        const query = commandLineService.GetArgument(0);

        const foundPackages = await packageService.SearchPackages(query);

        consoleGUI.PrintConsoleTable(foundPackages);

        return 0;
    }
};