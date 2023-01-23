import Container, { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_ApplyCommand } from '../../consts';
import BaseCommand from './BaseCommand';
import { join as joinPath } from 'path';
import { ApplyRootModel, ApplySectionModel, ApplyTargetModel, ApplyOperationModel } from '../Configuration/Models/ApplyModels';
import YamlSerializationService from '../Services/YamlSerializationService';
import { IOperation } from '../Interfaces/IOperation';
import UninstallOperation from '../Operations/UninstallOperation';
import UpgradeOperation from '../Operations/UpgradeOperation';
import { stat } from 'fs/promises';
import ProcessService from '../Services/ProcessService';
import { PackageServiceOptions } from '../PackageServices/Models/PackageServiceOptions';

const DEFAULT_CONFIG_PATHS: string[] = [
    'nv.yml'
];

@Service(DI_ICommandHandler_ApplyCommand)
export default class ApplyCommand extends BaseCommand implements ICommandHandler {
    private readonly _yamlSerializationService = Container.get(YamlSerializationService);
    private readonly _processService = Container.get(ProcessService);

    GetApplyTargetNames(): string[] {
        const targetNames: string[] = [];
        let currentTargetName;
        let index = 0;
        while ((currentTargetName = this._commandLineService.GetArgument(index++))) {
            this._logger.LogTrace(`passed target ${index} = ${currentTargetName}`);

            targetNames.push(currentTargetName);
        }

        return targetNames;
    }

    async FindDefaultApplyConfigPath(): Promise<string> {
        for (const i in DEFAULT_CONFIG_PATHS) {
            const configPath = DEFAULT_CONFIG_PATHS[i];
            const currentPath = joinPath(process.cwd(), configPath);

            try {
                this._logger.LogTrace(`checking if config exists at ${currentPath}`);

                await stat(currentPath);
                this._logger.LogTrace(`found file found at ${currentPath}`);

                return currentPath;
            }
            catch (ex) {
                this._logger.LogTrace(`no config file found at ${currentPath}`);
            }
        }

        return null;
    }

    async GetApplyConfigPaths(): Promise<string[]> {
        const applyConfigs = this._commandLineService.GetOptionList('f');
        if (applyConfigs.length !== 0) {
            this._logger.LogTrace(`passed apply configs ${this._logger.Serialize(applyConfigs)}`);
            return applyConfigs;
        }

        this._logger.LogTrace(`no apply config passed, attempting to find from list of defaults`);
        const configPath = await this.FindDefaultApplyConfigPath();

        if (!configPath) {
            this._logger.LogTrace(`no apply config could be found`);
            throw new Error('No apply configuration found or given');
        }

        return [configPath];
    }

    async LoadApplyConfigurations(): Promise<ApplyRootModel[]> {
        this._logger.LogTrace(`loading apply configs`);

        const applyConfigPaths = await this.GetApplyConfigPaths();
        const applyTargetNames = this.GetApplyTargetNames();

        const applyConfigs: ApplyRootModel[] = [];

        for (const i in applyConfigPaths) {
            const applyConfigPath = applyConfigPaths[i];
            this._logger.LogTrace(`loading apply config: ${applyConfigPath}`);

            const applyConfig = await this._yamlSerializationService.LoadStructuredYamlFromFile(ApplyRootModel, applyConfigPath);
            this._logger.LogTrace(`config file loaded as: ${this._logger.Serialize(applyConfig)}`);

            applyConfigs.push(applyConfig);
        }

        const validationErrors: string[] = [];
        for (const i in applyConfigs) {
            const applyConfig = applyConfigs[i];
            validationErrors.push(...applyConfig.Validate());
        }

        if (validationErrors.length > 0) {
            throw new Error(`The following validation errors were found: \n${validationErrors.join('\n')}`);
        }

        return applyConfigs;
    }

    ConvertOperations(applyOperations: ApplyOperationModel[], packageManagerOptions: PackageServiceOptions): IOperation[] {
        const operations: IOperation[] = [];

        for (const o in applyOperations) {
            const applyPackage = applyOperations[o];

            if (applyPackage.install) {
                this.AddRequiredPackageManager(applyPackage.install.Manager, packageManagerOptions);
                const installOperation = new UpgradeOperation(applyPackage.install, packageManagerOptions);
                operations.push(installOperation);
            }
            else if (applyPackage.uninstall) {
                this.AddRequiredPackageManager(applyPackage.uninstall.Manager, packageManagerOptions);
                const uninstallOperation = new UninstallOperation(applyPackage.uninstall, packageManagerOptions);
                operations.push(uninstallOperation);
            }
        }

        return operations;
    }

    GetOperationsFromApplyTarget(target: ApplyTargetModel, packageManagerOptions: PackageServiceOptions): IOperation[] {
        const operations: IOperation[] = [];

        if (target.CanTargetOS(this._processService.GetOS())
            && target.CanTargetDistro(this._processService.GetDistribution())) {

            if (target.HasContext()) {
                packageManagerOptions = new PackageServiceOptions();
                packageManagerOptions.Context = target.GetContext();
                packageManagerOptions.Directory = target.GetContextDirectory();
            }

            if (target.operations) {
                const targetOperations = this.ConvertOperations(target.operations, packageManagerOptions);
                operations.push(...targetOperations);
            }

            if (target.sections) {
                for (const i in target.sections) {
                    const section = target.sections[i];
                    const sectionOperations = this.GetOperationsFromApplySection(section, packageManagerOptions);
                    operations.push(...sectionOperations);
                }
            }
        }

        return operations;
    }

    GetOperationsFromApplySection(section: ApplySectionModel, packageManagerOptions: PackageServiceOptions): IOperation[] {
        const operations: IOperation[] = [];

        if (section.operations) {
            const sectionOperations = this.ConvertOperations(section.operations, packageManagerOptions);
            operations.push(...sectionOperations);
        }

        if (section.targets) {
            for (const i in section.targets) {
                const target = section.targets[i];
                const targetOperations = this.GetOperationsFromApplyTarget(target, packageManagerOptions);
                operations.push(...targetOperations);
            }
        }

        if (section.sections) {
            for (const i in section.sections) {
                const subsection = section.sections[i];
                const subsectionOperations = this.GetOperationsFromApplySection(subsection, packageManagerOptions);
                operations.push(...subsectionOperations);
            }
        }

        return operations;
    }

    GetOperationsFromApplyConfig(applyConfigurations: ApplyRootModel[]): IOperation[] {
        const operations: IOperation[] = [];

        for (const i in applyConfigurations) {
            const applyConfiguration = applyConfigurations[i];
            if (applyConfiguration) {
                const configurationOperations = this.GetOperationsFromApplySection(applyConfiguration, new PackageServiceOptions());
                operations.push(...configurationOperations);
            }
        }

        return operations;
    }

    async Execute(): Promise<number> {
        const applyConfigurations = await this.LoadApplyConfigurations();
        const operations = this.GetOperationsFromApplyConfig(applyConfigurations);

        if (!await this.PreparePackageManagers()) {
            return 1;
        }

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
            console.log('error, not all apply operation preperations are successful');
            return 1;
        }

        for (const i in continueOperations) {
            const operation = continueOperations[i];
            await operation.Execute();
        }

        return 0;
    }
};