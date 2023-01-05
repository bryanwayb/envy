import { Service } from 'typedi';
import { IOperation } from '../Interfaces/IOperation';
import BaseOperation from './BaseOperation';

@Service()
export default class InstallOperation extends BaseOperation implements IOperation {
    Execute(): Promise<void> {
        throw new Error('Method not implemented.');
    }
}