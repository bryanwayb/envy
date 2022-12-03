import { Service } from 'typedi';
import { load } from 'js-yaml';
import { readFile } from 'fs/promises';

@Service()
export default class YamlSerializationService {
    LoadYaml<T>(input: string): T {
        return load(input) as T;
    }

    async LoadYamlFromFile<T>(file: string): Promise<T> {
        const dataBuffer = await readFile(file, 'utf8');
        const data = dataBuffer.toString();
        return this.LoadYaml(data);
    }
};