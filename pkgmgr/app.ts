import 'reflect-metadata';

require('./preloader');

import Container from 'typedi';
import { DI_ICommandHandlerFactory } from './consts';
import { ICommandHandlerFactory } from './src/Interfaces/ICommandHandlerFactory';

(async () => {
    const commandHandlerFactory: ICommandHandlerFactory = Container.get<ICommandHandlerFactory>(DI_ICommandHandlerFactory);
    const commandHandlerInstance = commandHandlerFactory.GetInstance();
    const resultCode = await commandHandlerInstance.Execute();
    process.exit(resultCode);
})();