import { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_ShellCommand } from '../../consts';
import ApplyCommand from './ApplyCommand';
import { option } from 'yargs';
import { ProcessServiceEnvironment } from '../Services/ProcessService';

@Service(DI_ICommandHandler_ShellCommand)
export default class ShellCommand extends ApplyCommand implements ICommandHandler {
    async Execute(): Promise<number> {
        this._logger.LogTrace(`starting shell for apply config`);

        const applyConfigurations = await this.LoadApplyConfigurations();
        const operations = this.GetOperationsFromApplyConfig(applyConfigurations);

        if (!await this.PreparePackageManagers()) {
            return 1;
        }

        this._logger.LogTrace(`getting process service environments for all packages and managers`);

        const environments: ProcessServiceEnvironment[] = [];
        for (const i in operations) {
            const operation = operations[i];

            const instance = await this._packageServiceFactory.GetInstance(operation.PackageModel.Manager, operation.PackageManagerOptions);
            const processServiceEnvironment = await instance.GetProcessServiceEnvironment();

            this._logger.LogTrace(`[${operation.PackageManagerOptions.GetContextAsString()}] ${operation.PackageModel} = ${this._logger.Serialize(processServiceEnvironment)}`);

            if (processServiceEnvironment) {
                environments.push(processServiceEnvironment);
            }
        }

        // TODO: Handle process environments here
        // Need to build a comparison against the current environment and only change values that have actual changes

        // Can likely create a new ProcessServiceEnvironment object and apply the changes to that since a new process will need to be spawned for a terminal anyway
        // Will also need to detect the current running terminal process (this can be checked with parent IDs), then spawn a matching shell (Windows can default to CMD if the parent isn't a supported shell, example powershell, pwsh, or cmd)

        this._logger.LogTrace(`shell finished`);

        return 0;
    }
};