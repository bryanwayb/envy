import { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_InstallCommand } from '../../consts';

@Service(DI_ICommandHandler_InstallCommand)
export default class InstallCommand implements ICommandHandler {
    Execute(): Promise<number> {
        console.log('hello');
        return Promise.resolve(0);
    }
};