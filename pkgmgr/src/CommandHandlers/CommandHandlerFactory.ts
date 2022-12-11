import Container, { Service } from 'typedi';
import { DI_ICommandHandlerFactory, DI_ICommandHandler_InstallCommand, DI_ICommandHandler_HelpCommand, DI_ICommandHandler_ListCommand, DI_ICommandHandler_SearchCommand, DI_ICommandHandler_UninstallCommand } from '../../consts';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { ICommandHandlerFactory } from '../Interfaces/ICommandHandlerFactory';
import CommandLineService from '../Services/CommandLineService';

@Service(DI_ICommandHandlerFactory)
export class CommandHandlerFactory implements ICommandHandlerFactory {
    private _commandLineService: CommandLineService;

    private _commandDIMap: { [key: string]: string } = {
        'install': DI_ICommandHandler_InstallCommand,
        'list': DI_ICommandHandler_ListCommand,
        'search': DI_ICommandHandler_SearchCommand,
        'uninstall': DI_ICommandHandler_UninstallCommand
    };

    constructor() {
        this._commandLineService = Container.get(CommandLineService);
    }

    GetInstance(): ICommandHandler {
        let commandHandler: ICommandHandler = null;

        const commandString = this._commandLineService.GetCommand();
        if (this._commandDIMap[commandString]) {
            commandHandler = Container.get<ICommandHandler>(this._commandDIMap[commandString]);
        }

        if (!commandHandler) {
            commandHandler = Container.get<ICommandHandler>(DI_ICommandHandler_HelpCommand);
        }

        return commandHandler;
    }
};