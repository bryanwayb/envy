import Container, { Service } from 'typedi';
import { ICommandHandler } from '../Interfaces/ICommandHandler';
import { DI_ICommandHandler_ApplyCommand } from '../../consts';
import BaseCommand from './BaseCommand';
import { resolve as resolvePath } from 'path';
import { ApplyConfigurationModel } from '../Configuration/Models/ApplyConfigurationModel';
import YamlSerializationService from '../Services/YamlSerializationService';
import { IOperation } from '../Interfaces/IOperation';
import InstallOperation from '../Operations/InstallOperation';
import { PackageModel } from '../PackageServices/Models/PackageModel';
import UninstallOperation from '../Operations/UninstallOperation';

@Service(DI_ICommandHandler_ApplyCommand)
export default class ApplyCommand extends BaseCommand implements ICommandHandler {
    private readonly _yamlSerializationService = Container.get(YamlSerializationService);

    GetApplyConfigPaths(): string[] {
        const configPaths: string[] = [];

        let currentApplyPath;
        let index = 0;
        while ((currentApplyPath = this._commandLineService.GetArgument(index++))) {
            currentApplyPath = resolvePath(process.cwd(), currentApplyPath);
            this._logger.LogTrace(`passed apply config ${index} = ${currentApplyPath}`);

            configPaths.push(currentApplyPath);
        }

        return configPaths;
    }

    async LoadApplyConfigurations(): Promise<ApplyConfigurationModel[]> {
        this._logger.LogTrace(`loading apply configs`);

        const applyConfigPaths = this.GetApplyConfigPaths();
        const applyConfigs: ApplyConfigurationModel[] = [];

        for (const i in applyConfigPaths) {
            const applyConfigPath = applyConfigPaths[i];
            this._logger.LogTrace(`loading apply config: ${applyConfigPath}`);

            const applyConfig = await this._yamlSerializationService.LoadYamlFromFile<ApplyConfigurationModel>(applyConfigPath);
            this._logger.LogTrace(`config file loaded as: ${this._logger.Serialize(applyConfig)}`);

            applyConfigs.push(applyConfig);
        }

        // TODO: Perform configuration validations

        return applyConfigs;
    }

    GetOperationsFromApplyConfig(applyConfigurations: ApplyConfigurationModel[]): IOperation[] {
        const operations: IOperation[] = [];

        for (const i in applyConfigurations) {
            const applyConfiguration = applyConfigurations[i];

            for (const o in applyConfiguration.packages) {
                const applyPackage = applyConfiguration.packages[o];

                if (applyPackage.install) {
                    const installPackageModel = PackageModel.Parse(applyPackage.install);
                    const installOperation = new InstallOperation(installPackageModel);
                    operations.push(installOperation);
                }
                else if (applyPackage.uninstall) {
                    const uninstallPackageModel = PackageModel.Parse(applyPackage.uninstall);
                    const uninstallOperation = new UninstallOperation(uninstallPackageModel);
                    operations.push(uninstallOperation);
                }
            }
        }

        return operations;
    }

    async Execute(): Promise<number> {
        const applyConfigurations = await this.LoadApplyConfigurations();
        const operations = this.GetOperationsFromApplyConfig(applyConfigurations);

        return 0;
    }
};