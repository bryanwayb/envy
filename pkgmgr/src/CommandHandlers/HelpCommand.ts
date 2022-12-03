import { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_HelpCommand } from '../../consts';

@Service(DI_ICommandHandler_HelpCommand)
export default class HelpCommand implements ICommandHandler {
    Execute(): Promise<number> {
        console.log('help command');
        return Promise.resolve(0);
    }
};