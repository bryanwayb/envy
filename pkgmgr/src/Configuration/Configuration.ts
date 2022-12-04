import Container, { Service } from 'typedi';
import { IConfiguration } from '../Interfaces/IConfiguration';
import { DI_IConfiguration_Configuration } from '../../consts';
import { ConfigurationModel } from './Models/ConfigurationModel';
import YamlSerializationService from '../Services/YamlSerializationService';
import CommandLineService from '../Services/CommandLineService';
import { resolve } from 'path';

@Service(DI_IConfiguration_Configuration)
export default class Configuration implements IConfiguration {
    private _yamlSerializationService: YamlSerializationService;
    private _commandLineService: CommandLineService;
    private _configurationModel: ConfigurationModel;

    constructor() {
        this._yamlSerializationService = Container.get(YamlSerializationService);
        this._commandLineService = Container.get(CommandLineService);
    }

    // This is only a shallow merge, deep references will still point to their original values
    private MergeObjects<T>(...objects: T[]): T {
        const result: T = {} as T;

        for (const i in objects) {
            Object.assign(result, objects[i]);
        }

        return result;
    }

    async GetConfiguration(): Promise<ConfigurationModel> {
        if (!this._configurationModel) {
            const defaultConfiguration = await this._yamlSerializationService.LoadYamlFromFile<ConfigurationModel>(resolve(__dirname, '../../config.yml'));

            const configurationFilePath = this._commandLineService.GetOption("config");
            if (configurationFilePath
                && configurationFilePath.trim() !== '') {
                const suppliedConfiguration = await this._yamlSerializationService.LoadYamlFromFile<ConfigurationModel>(configurationFilePath);
                this._configurationModel = this.MergeObjects(defaultConfiguration, suppliedConfiguration);
            }
            else {
                this._configurationModel = defaultConfiguration;
            }
        }

        return this._configurationModel;
    }
};