import { Service } from 'typedi';
import * as stringFormat from 'string-format';

@Service()
export default class FormatterService {
    String<T>(input: string, data: T): string {
        return stringFormat(input, data) as string;
    }
};