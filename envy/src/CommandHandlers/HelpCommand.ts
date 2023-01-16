import Container, { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_HelpCommand } from '../../consts';
import CommandLineService from '../Services/CommandLineService';
import ConsoleGUI from '../Services/ConsoleGUI';

@Service(DI_ICommandHandler_HelpCommand)
export default class HelpCommand implements ICommandHandler {
    protected readonly _commandLineService = Container.get(CommandLineService);
    protected readonly _consoleGUI = Container.get(ConsoleGUI);

    async Execute(): Promise<number> {
        this._consoleGUI.Output(await this._commandLineService.HelpText());
        return 0;
    }
};