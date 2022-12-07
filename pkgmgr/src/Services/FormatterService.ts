import { Service } from 'typedi';
import { compile } from 'handlebars';

@Service()
export default class FormatterService {
    String<T>(input: string, data: T): string {
        const template = compile(input);
        return template(data);
    }
};