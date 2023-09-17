import Parser from './parser';

const urlRegex = /url\(.*?\)/gi;

export default class CSSParser extends Parser {
	async parse(): Promise<string[]> {
		const links: string[] = [];
		const urlMatches = this.options.body.match(urlRegex);
		urlMatches?.forEach((match) => {
			const href = match
				.substring(4, match.length - 1)
				.replace(/^['"]/, '')
				.replace(/['"]$/, '');
			links.push(href);
		});

		return links;
	}

	prettierOptions(): Record<string, any> {
		return { parser: 'css' };
	}
}
