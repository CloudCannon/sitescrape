import Parser from './parser.ts';

export default class JSParser extends Parser {
	prettierOptions(): Record<string, any> | null {
		return { parser: 'babel' };
	}
}
