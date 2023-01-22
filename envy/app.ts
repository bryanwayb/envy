import 'reflect-metadata';

require('./preloader');

require('./src/CommandHandlers/CommandHandlerFactory');

import Container from 'typedi';
import { DI_ICommandHandlerFactory } from './consts';
import { ICommandHandlerFactory } from './src/Interfaces/ICommandHandlerFactory';

(async () => {
    const commandHandlerFactory: ICommandHandlerFactory = Container.get<ICommandHandlerFactory>(DI_ICommandHandlerFactory);
    const commandHandlerInstance = commandHandlerFactory.GetInstance();
    return commandHandlerInstance.Execute();
})().then((resultCode: number) => {
    process.exit(resultCode);
});