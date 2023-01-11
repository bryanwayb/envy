import { Service } from 'typedi';
import { IOperation } from '../Interfaces/IOperation';
import BaseOperation from './BaseOperation';

@Service()
export default class UninstallOperation extends BaseOperation implements IOperation {
    
}