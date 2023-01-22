import { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_SearchCommand } from '../../consts';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import BaseCommand from './BaseCommand';
import { IPackageService } from '../Interfaces/IPackageService';

@Service(DI_ICommandHandler_SearchCommand)
export default class SearchCommand extends BaseCommand implements ICommandHandler {
    async Execute(): Promise<number> {
        const packageManagerOptions = this.GetPackageOptionsFromCommandLine();

        this._logger.LogTrace(`searching for packages`);

        const passedPackages = this.GetPassedPackages();

        const packageServices = await this._packageServiceFactory.GetAllInstances(packageManagerOptions);

        const spinners = this._consoleGUI.CreateSpinners();
        const resultsPromises = new Array<Promise<Array<PackageModel>>>();

        for (const i in passedPackages) {
            const passedPackage = passedPackages[i];

            const spinnerInstance = spinners.Add(`${passedPackage}`);

            resultsPromises.push((async () => {
                const searchResults = new Array<PackageModel>();

                let servicesToSearch: IPackageService[] = packageServices;
                if (passedPackage.HasManager()) {
                    servicesToSearch = [await this._packageServiceFactory.GetInstance(passedPackage.Manager, packageManagerOptions)];
                }

                for (const i in servicesToSearch) {
                    const packageService = packageServices[i];

                    spinnerInstance.Update(`${passedPackage}: searching ${packageService.ServiceIdentifier}`);
                    const packageServiceSearchResults = await packageService.SearchPackages(passedPackage);

                    searchResults.push(...packageServiceSearchResults);
                }

                const resultText = `${passedPackage}: found ${searchResults.length} results`;
                if (searchResults.length) {
                    spinnerInstance.Success(resultText);
                }
                else {
                    spinnerInstance.Fail(resultText);
                }

                return searchResults;
            })());
        }

        let results = (await Promise.all(resultsPromises)).flat();

        results = results.filter((filterPackage, index) => results.findIndex(findIndexPackages => findIndexPackages.toString() === filterPackage.toString()) === index);

        this._consoleGUI.PrintConsoleTable(results);

        this._logger.LogTrace(`search finished`);

        return 0;
    }
};