import { Service } from 'typedi';
import { printTable } from 'console-table-printer';

@Service()
export default class ConsoleGUI {
    PrintConsoleTable(records: Array<any>): void {
        printTable(records);
    }
};