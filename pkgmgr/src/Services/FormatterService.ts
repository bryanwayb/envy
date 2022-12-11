import Container, { Service } from 'typedi';
import { compile } from 'handlebars';
import LoggerService from './LoggerService';

@Service()
export default class FormatterService {
    private readonly _logger = Container.get(LoggerService).ScopeByType(FormatterService);

    String<T>(input: string, data: T): string {
        //this._logger.LogTrace(`formatting string of template: ${input}, data = ${this._logger.Serialize(data)}`);
        const template = compile(input);

        const dataKeys = Object.keys(data);
        const partials: { [name: string]: HandlebarsTemplateDelegate } = {};
        for (const i in dataKeys) {
            const dataKeyName = dataKeys[i];
            partials[dataKeyName] = (): string => {
                const partialTemplate = compile(data[dataKeyName]);
                return partialTemplate(data, {
                    partials
                });
            };
        }

        const response = template(data, {
            partials
        });

        //this._logger.LogTrace(`formatted string as: ${response}`);

        return response;
    }
};