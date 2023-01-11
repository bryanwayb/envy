import Container, { Service } from 'typedi';
import { load, Type as YamlType, DEFAULT_SCHEMA, Schema } from 'js-yaml';
import { readFile } from 'fs/promises';
import { cwd as getCurrentWorkingDirectory } from 'process';
import { resolve } from 'path';
import LoggerService from './LoggerService';
import { readFileSync } from 'fs';

@Service()
export default class YamlSerializationService {
    protected readonly _logger = Container.get(LoggerService).ScopeByName(this.constructor.name);

    private _importYamlType: YamlType = new YamlType('!import', {
        kind: 'scalar',
        resolve: data => {
            return (data !== null || data !== undefined) && data.length > 0;
        },
        construct: path => {
            this._logger.LogTrace(`processing !import with: ${path}`);

            const currentDirectory = getCurrentWorkingDirectory();
            const resolvedFilePath = resolve(currentDirectory, path);

            this._logger.LogTrace(`attempting to load YAML file at ${resolvedFilePath}`);

            try {
                const dataBuffer = readFileSync(resolvedFilePath, 'utf8');
                const data = dataBuffer.toString();

                return load(data, {
                    schema: this._configurationSchema
                });
            }
            catch (ex) {
                throw new Error(`Error while attempting to !import YAML file ${path}.\n${ex}`);
            }
        }
    });

    private _configurationSchema: Schema = DEFAULT_SCHEMA.extend([
        this._importYamlType
    ]);

    LoadYaml<T>(type: { new(data: any): T; }, input: string): T {
        this._logger.LogTrace(`parsing YAML: ${input}`);
        const data = load(input, {
            schema: this._configurationSchema
        });
        return new type(data);
    }

    async LoadYamlFromFile<T>(type: { new(data: any): T; }, file: string): Promise<T> {
        const currentDirectory = getCurrentWorkingDirectory();
        const resolvedFilePath = resolve(currentDirectory, file);

        this._logger.LogTrace(`attempting to load YAML file at ${resolvedFilePath}`);

        const dataBuffer = await readFile(resolvedFilePath, 'utf8');
        const data = dataBuffer.toString();

        return this.LoadYaml<T>(type, data);
    }
};