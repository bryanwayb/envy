import Container, { Service } from 'typedi';
import { load, Type as YamlType, DEFAULT_SCHEMA, Schema } from 'js-yaml';
import { readFile } from 'fs/promises';
import { cwd as getCurrentWorkingDirectory } from 'process';
import { resolve, dirname } from 'path';
import LoggerService from './LoggerService';
import { readFileSync } from 'fs';

@Service()
export default class YamlSerializationService {
    protected readonly _logger = Container.get(LoggerService).ScopeByName(this.constructor.name);

    LoadYaml<T>(type: { new(data: any): T; }, input: string, referenceFilePath: string = null): T {
        this._logger.LogTrace(`parsing YAML: ${input}`);

        let configurationSchema: Schema = null;
        const importYamlType: YamlType = new YamlType('!import', {
            kind: 'scalar',
            resolve: data => {
                return (data !== null || data !== undefined) && data.length > 0;
            },
            construct: path => {
                this._logger.LogTrace(`processing !import with: ${path}`);

                let baseDirectory: string;
                if (referenceFilePath) {
                    baseDirectory = dirname(referenceFilePath);
                }
                else {
                    baseDirectory = getCurrentWorkingDirectory();
                }
                const resolvedFilePath = resolve(baseDirectory, path);

                this._logger.LogTrace(`attempting to sync load YAML file at ${resolvedFilePath}`);

                try {
                    const dataBuffer = readFileSync(resolvedFilePath, 'utf8');
                    const data = dataBuffer.toString();

                    this._logger.LogTrace(`parsing YAML: ${data}`);

                    return load(data, {
                        schema: configurationSchema
                    });
                }
                catch (ex) {
                    throw new Error(`Error while attempting to !import YAML file ${path}.\n${ex}`);
                }
            }
        });

        configurationSchema = DEFAULT_SCHEMA.extend([
            importYamlType
        ]);

        const data = load(input, {
            schema: configurationSchema
        });
        return new type(data);
    }

    async LoadYamlFromFile<T>(type: { new(data: any): T; }, file: string): Promise<T> {
        const currentDirectory = getCurrentWorkingDirectory();
        const resolvedFilePath = resolve(currentDirectory, file);

        this._logger.LogTrace(`attempting to load YAML file at ${resolvedFilePath}`);

        const dataBuffer = await readFile(resolvedFilePath, 'utf8');
        const data = dataBuffer.toString();

        return this.LoadYaml<T>(type, data, resolvedFilePath);
    }
};