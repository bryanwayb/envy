import Container from "typedi";
import { PackageModel } from "../PackageServices/Models/PackageModel";
import CommandLineService from "../Services/CommandLineService";
import LoggerService from "../Services/LoggerService";

export default abstract class BaseCommand {
    protected _commandLineService = Container.get(CommandLineService);
    protected _logger = Container.get(LoggerService).ScopeByName(this.constructor.name);

    protected GetPassedPackages(): PackageModel[] {
        const results = new Array<PackageModel>();

        this._logger.LogTrace('getting passed arguments of packages to install');

        let currentPackageString;
        let index = 0;
        while ((currentPackageString = this._commandLineService.GetArgument(index++))) {
            this._logger.LogTrace(`passed package ${index} = ${currentPackageString}`);

            results.push(PackageModel.Parse(currentPackageString));
        }

        this._logger.LogTrace(`found requested packages to install: ${results.map(m => m.toString()).join(', ')}`);

        return results;
    }
}