import { Service } from 'typedi';
import { load } from 'js-yaml';
import { readFile } from 'fs/promises';
import { cwd as getCurrentWorkingDirectory } from 'process';
import { resolve } from 'path';

@Service()
export default class YamlSerializationService {
    LoadYaml<T>(input: string): T {
        return load(input) as T;
    }

    async LoadYamlFromFile<T>(file: string): Promise<T> {
        const currentDirectory = getCurrentWorkingDirectory();
        const resolvedFilePath = resolve(currentDirectory, file);

        const dataBuffer = await readFile(resolvedFilePath, 'utf8');
        const data = dataBuffer.toString();
        return this.LoadYaml(data);
    }
};