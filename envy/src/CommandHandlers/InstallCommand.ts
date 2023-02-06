import { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_InstallCommand } from '../../consts';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import BaseCommand from './BaseCommand';
import { IOperation } from '../Interfaces/IOperation';
import InstallOperation from '../Operations/InstallOperation';

@Service(DI_ICommandHandler_InstallCommand)
export default class InstallCommand extends BaseCommand implements ICommandHandler {
    private async GetPackagesToInstall(): Promise<PackageModel[]> {
        const results = new Array<PackageModel>();

        const passedPackages = this.GetPassedPackages();

        this._logger.LogTrace(`validating packages to install`);

        for (const i in passedPackages) {
            const passedPackage = passedPackages[i];
            await this.EnsurePackageHasManager(passedPackage);
            results.push(passedPackage);
        }

        return results;
    }

    async Execute(): Promise<number> {
        const packageManagerOptions = this.GetPackageOptionsFromCommandLine();
        const packagesToInstall = await this.GetPackagesToInstall();
        const operations: IOperation[] = [];

        for (const i in packagesToInstall) {
            const packageToInstall = packagesToInstall[i];
            operations.push(new InstallOperation(packageToInstall, packageManagerOptions));
            this.AddRequiredPackageManager(packageToInstall.Manager, packageManagerOptions);
        }

        if (!await this.PreparePackageManagers()) {
            return 1;
        }

        ////
        // TODO: this is copied and pasted from ApplyCommand.ts, need to abstract this to either a helper or interface
        const continueOperations: IOperation[] = [];

        const awaitPrepareOperations: Promise<void>[] = [];
        const spinners = this._consoleGUI.CreateSpinners();

        for (const i in operations) {
            const operation = operations[i];
            const continueIndex = continueOperations.push(operation) - 1;
            this._logger.LogTrace(`apply ${operation.PackageModel}`);

            const spinnerInstance = spinners.Add(`[${operation.PackageManagerOptions.GetContextAsString()}] ${operation.PackageModel}`);

            operation.OnEvent('update', data => {
                this._logger.LogTrace(`update ${operation.PackageModel}: ${data}`);
                spinnerInstance.Update(`[${operation.PackageManagerOptions.GetContextAsString()}] ${operation.PackageModel}: ${data}`);
            });

            operation.OnEvent('success', data => {
                this._logger.LogTrace(`success ${operation.PackageModel}: ${data}`);
                spinnerInstance.Success(`[${operation.PackageManagerOptions.GetContextAsString()}] ${operation.PackageModel}: ${data}`);
            });

            operation.OnEvent('fail', data => {
                this._logger.LogError(`fail ${operation.PackageModel}: ${data}`);
                spinnerInstance.Fail(`[${operation.PackageManagerOptions.GetContextAsString()}] ${operation.PackageModel}: ${data}`);
            });

            awaitPrepareOperations.push((async (): Promise<void> => {
                try {
                    await operation.Prepare();
                }
                catch (ex) {
                    this._logger.LogTrace(`exception ${operation.PackageModel}: ${ex}`);
                    spinnerInstance.Fail(`[${operation.PackageManagerOptions.GetContextAsString()}] ${operation.PackageModel}: failed to install`);
                    continueOperations.splice(continueIndex, 1);
                }
            })());
        }

        await Promise.all(awaitPrepareOperations);

        if (continueOperations.length != operations.length) {
            // TODO: Not all opeartions are successful
            // Allow switch to continue
            spinners.Stop();
            this._consoleGUI.DisplayError('\nNot all install operation preperations are successful\n');
            return 1;
        }

        for (const i in continueOperations) {
            const operation = continueOperations[i];
            await operation.Execute();
        }

        this._logger.LogTrace(`installation finished`);

        return 0;
    }
};