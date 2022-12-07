import 'reflect-metadata';

require('./preloader');

import Container from 'typedi';
import { DI_ICommandHandlerFactory } from './consts';
import { ICommandHandlerFactory } from './src/Interfaces/ICommandHandlerFactory';
import ProcessService from './src/Services/ProcessService';

(async () => {
    //const processService = Container.get<ProcessService>(ProcessService);
    //const isRunningAsAdmin = await processService.IsAdmin();
    //if (!isRunningAsAdmin) {
    //    console.log('Not running as admin');
    //    return 1;
    //}

    const commandHandlerFactory: ICommandHandlerFactory = Container.get<ICommandHandlerFactory>(DI_ICommandHandlerFactory);
    const commandHandlerInstance = commandHandlerFactory.GetInstance();
    return commandHandlerInstance.Execute();
})().then((resultCode: number) => {
    process.exit(resultCode);
});