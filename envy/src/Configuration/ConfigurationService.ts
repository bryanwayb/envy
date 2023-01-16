import Container, { Service } from 'typedi';
import { IConfiguration } from '../Interfaces/IConfiguration';
import { DI_IConfiguration_Configuration } from '../../consts';
import { ConfigurationModel } from './Models/ConfigurationModel';
import YamlSerializationService from '../Services/YamlSerializationService';
import CommandLineService from '../Services/CommandLineService';
import { resolve } from 'path';
import LoggerService from '../Services/LoggerService';
import Lock from '../Classes/Lock';

@Service(DI_IConfiguration_Configuration)
export default class ConfigurationService implements IConfiguration {
    private readonly _yamlSerializationService = Container.get(YamlSerializationService);
    private readonly _commandLineService = Container.get(CommandLineService);
    private readonly _logger = Container.get(LoggerService).ScopeByType(ConfigurationService);

    private _configurationModel: ConfigurationModel;
    private _lock: Lock = new Lock();

    // This is only a shallow merge, deep references will still point to their original values
    private MergeObjects<T>(...objects: T[]): T {
        const result: T = {} as T;

        for (const i in objects) {
            Object.assign(result, objects[i]);
        }

        return result;
    }

    async GetConfiguration(): Promise<ConfigurationModel> {
        await this._lock.Wait();
        try {
            if (!this._configurationModel) {
                this._logger.LogTrace(`loading configuration`);

                const defaultConfigurationFilePath = resolve(__dirname, '../../config.yml');

                this._logger.LogTrace(`using config file path "${defaultConfigurationFilePath}"`);

                const defaultConfiguration = await this._yamlSerializationService.LoadYamlFromFile(ConfigurationModel, defaultConfigurationFilePath);

                const configurationFilePath = this._commandLineService.GetOption("config");
                if (configurationFilePath
                    && configurationFilePath.trim() !== '') {
                    this._logger.LogTrace(`loading additional config override file, "${configurationFilePath}"`);
                    const suppliedConfiguration = await this._yamlSerializationService.LoadYamlFromFile(ConfigurationModel, configurationFilePath);
                    this._configurationModel = this.MergeObjects(defaultConfiguration, suppliedConfiguration);
                }
                else {
                    this._configurationModel = defaultConfiguration;
                }

                this._logger.LogTrace(`active config: ${this._logger.Serialize(this._configurationModel)}`);
            }

            return this._configurationModel;
        }
        finally {
            this._lock.Release();
        }
    }
};