import 'reflect-metadata';

require('./preloader');

import Container from 'typedi';
import { DI_ICommandHandlerFactory } from './consts';
import { ICommandHandlerFactory } from './src/Interfaces/ICommandHandlerFactory';
import CommandLineService from './src/Services/CommandLineService';
import ConsoleGUI from './src/Services/ConsoleGUI';
import LoggerService from './src/Services/LoggerService';

(async () => {
    const commandHandlerFactory: ICommandHandlerFactory = Container.get<ICommandHandlerFactory>(DI_ICommandHandlerFactory);
    const commandHandlerInstance = commandHandlerFactory.GetInstance();
    return commandHandlerInstance.Execute();
})().then((resultCode: number) => {
    process.exit(resultCode);
}).catch(error => {
    try {
        const commandLineService = Container.get(CommandLineService);
        if (commandLineService.IsVerbose()) {
            const logger = Container.get(LoggerService).ScopeByName("entrypoint");
            logger.LogError(`${error.stack}`);
        }
        else {
            const consoleGUI = Container.get(ConsoleGUI);
            consoleGUI.DisplayError(`${error.toString()}\n`);
        }
    }
    catch (ex) {
        console.error(`Error while attempting to display error ${ex}\n\nOriginal error${error}\n`);
    }
});