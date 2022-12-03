import Container, { Service } from 'typedi';
import { IConfiguration } from '../Interfaces/IConfiguration';
import { DI_IConfiguration_Configuration } from '../../consts';
import { ConfigurationModel } from './Models/ConfigurationModel';
import YamlSerializationService from '../Services/YamlSerializationService';
import CommandLineService from '../Services/CommandLineService';
import { cwd as getCurrentWorkingDirectory } from 'process';
import { resolve } from 'path';

@Service(DI_IConfiguration_Configuration)
export default class Configuration implements IConfiguration {
    private _yamlSerializationService: YamlSerializationService;
    private _commandLineService: CommandLineService;

    constructor() {
        this._yamlSerializationService = Container.get(YamlSerializationService);
        this._commandLineService = Container.get(CommandLineService);
    }

    GetConfiguration(): Promise<ConfigurationModel> {
        const configurationFilePath = this._commandLineService.GetOption("config");
        const currentDirectory = getCurrentWorkingDirectory();
        const resolvedFilePath = resolve(currentDirectory, configurationFilePath);

        return this._yamlSerializationService.LoadYamlFromFile<ConfigurationModel>(resolvedFilePath);
    }
};