import Container, { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_InstallCommand, DI_IPackageServiceFactory } from '../../consts';
import { IPackageServiceFactory } from '../Interfaces/IPackageServiceFactory';
import CommandLineService from '../Services/CommandLineService';

@Service(DI_ICommandHandler_InstallCommand)
export default class InstallCommand implements ICommandHandler {
    private _packageServiceFactory = Container.get<IPackageServiceFactory>(DI_IPackageServiceFactory);
    private _commandLineService = Container.get<CommandLineService>(CommandLineService);

    async Execute(): Promise<number> {
        console.log('installing packages');

        // TODO: Allow optional passing of manager, find best matching package based on input
        // Present user CLI GUI to select correct package on conflicts
        const packageManager = this._commandLineService.GetOption("manager");
        if (!packageManager
            || packageManager.trim() === '') {
            console.log('A --manager value is required');
            return 1;
        }

        const query = this._commandLineService.GetArgument(0);

        const packageService = this._packageServiceFactory.GetInstance(packageManager);

        // TODO: Find exact match for package details, return a PackageModel object
        // Pass PackageModel to InstallPackage instead of query
        await packageService.InstallPackage(query);

        console.log('done');

        return 0;
    }
};