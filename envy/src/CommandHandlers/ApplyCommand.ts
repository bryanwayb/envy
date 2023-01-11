import Container, { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_ApplyCommand } from '../../consts';
import BaseCommand from './BaseCommand';
import { join as joinPath, resolve as resolvePath } from 'path';
import { ApplySectionModel } from '../Configuration/Models/ApplyModels';
import YamlSerializationService from '../Services/YamlSerializationService';
import { IOperation } from '../Interfaces/IOperation';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import UninstallOperation from '../Operations/UninstallOperation';
import UpgradeOperation from '../Operations/UpgradeOperation';
import { stat } from 'fs/promises';

const DEFAULT_CONFIG_PATHS: string[] = [
    'nv.yml'
];

@Service(DI_ICommandHandler_ApplyCommand)
export default class ApplyCommand extends BaseCommand implements ICommandHandler {
    private readonly _yamlSerializationService = Container.get(YamlSerializationService);

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

    async LoadApplyConfigurations(): Promise<ApplySectionModel[]> {
        this._logger.LogTrace(`loading apply configs`);

        const applyConfigPaths = await this.GetApplyConfigPaths();
        const applyTargetNames = this.GetApplyTargetNames();

        const applyConfigs: ApplySectionModel[] = [];

        for (const i in applyConfigPaths) {
            const applyConfigPath = applyConfigPaths[i];
            this._logger.LogTrace(`loading apply config: ${applyConfigPath}`);

            const applyConfig = await this._yamlSerializationService.LoadYamlFromFile(ApplySectionModel, applyConfigPath);
            this._logger.LogTrace(`config file loaded as: ${this._logger.Serialize(applyConfig)}`);

            applyConfigs.push(applyConfig);
        }

        // TODO: Perform configuration validations
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

    GetOperationsFromApplyConfig(applyConfigurations: ApplySectionModel[]): IOperation[] {
        const operations: IOperation[] = [];

        //for (const i in applyConfigurations) {
        //    const applyConfiguration = applyConfigurations[i];

        //    for (const o in applyConfiguration.packages) {
        //        const applyPackage = applyConfiguration.packages[o];

        //        if (applyPackage.install) {
        //            const installPackageModel = PackageModel.Parse(applyPackage.install);
        //            const installOperation = new UpgradeOperation(installPackageModel);
        //            operations.push(installOperation);
        //        }
        //        else if (applyPackage.uninstall) {
        //            const uninstallPackageModel = PackageModel.Parse(applyPackage.uninstall);
        //            const uninstallOperation = new UninstallOperation(uninstallPackageModel);
        //            operations.push(uninstallOperation);
        //        }
        //    }
        //}

        return operations;
    }

    async Execute(): Promise<number> {
        const applyConfigurations = await this.LoadApplyConfigurations();
        const operations = this.GetOperationsFromApplyConfig(applyConfigurations);

        for (const i in operations) {
            const operation = operations[i];
            this._logger.LogTrace(`apply ${operation.PackageModel}`);

            operation.OnEvent('update', data => {
                console.log(`${operation.PackageModel}: ${data}`);
            });

            operation.OnEvent('success', data => {
                console.log(`${operation.PackageModel}: ${data}`);
            });

            await operation.Execute();
        }

        return 0;
    }
};