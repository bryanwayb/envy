import Container, { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_ShellCommand } from '../../consts';
import ApplyCommand from './ApplyCommand';
import ProcessService, { ProcessServiceEnvironment } from '../Services/ProcessService';
import { parse as parsePath } from 'path';

@Service(DI_ICommandHandler_ShellCommand)
export default class ShellCommand extends ApplyCommand implements ICommandHandler {
    private GetShellEnvironment(environments: ProcessServiceEnvironment[]): ProcessServiceEnvironment {
        const shellEnv = new ProcessServiceEnvironment();

        this._logger.LogTrace(`merging environments into a single shell environment`);

        const shellPathEntries = shellEnv.GetPath();

        for (const i in environments) {
            const environment = environments[i];

            const environmentPathEntries = environment.GetPath().filter(f => shellPathEntries.indexOf(f) === -1);
            shellPathEntries.unshift(...environmentPathEntries);

            Object.assign(shellEnv.Environment, environment.Environment);
        }

        shellEnv.SetPath(shellPathEntries);

        this._logger.LogTrace(`new env path: ${shellPathEntries.join(';')}`);

        return shellEnv;
    }

    private async StartInteractiveShell(processService: ProcessService): Promise<void> {
        const shellPath = await processService.GetCurrentShellPath();

        let commandArguments: string[] = [];
        switch (parsePath(shellPath).name.toLowerCase().trim()) {
            case 'powershell':
            case 'pwsh':
                commandArguments = ['-NoExit', '-NoLogo', '-Command', 'function prompt{"$([char]27)[95m(envy)$([char]27)[0m PS $(pwd)> "}'];
                break;
        }

        await processService.ExecuteInteractive(shellPath, ...commandArguments);
    }

    async Execute(): Promise<number> {
        this._logger.LogTrace(`starting shell for apply config`);

        const applyConfigurations = await this.LoadApplyConfigurations();
        const operations = this.GetOperationsFromApplyConfig(applyConfigurations);

        if (!await this.PreparePackageManagers()) {
            return 1;
        }

        this._logger.LogTrace(`getting process service environments for all packages and managers`);

        operations.sort(ops => ops.PackageManagerOptions.Context);

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

        const shellEnvironment = this.GetShellEnvironment(environments);

        const processService = Container.get(ProcessService).WithEnvironment(shellEnvironment);
        await this.StartInteractiveShell(processService);
        
        this._logger.LogTrace(`shell finished`);

        return 0;
    }
};