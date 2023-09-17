import XMLParser from './xml-parser';
import HTMLParser from './html-parser';
import CSSParser from './css-parser';
import JSParser from './js-parser';

export const Parsers: Record<string, any> = {
	XMLParser,
	HTMLParser,
	CSSParser,
	JSParser
};

const contentTypeLookup: Record<string, string> = {
	'text/html': 'HTMLParser',
	'application/xml': 'XMLParser',
	'text/xml': 'XMLParser',
	'text/css': 'CSSParser',
	'application/javascript': 'JSParser',
	'text/javascript': 'JSParser'
};

export function contentTypeToParser(contentType: string | null): string | null {
	if (contentType) {
		const types = contentType.split(';');

		for (let i = 0; i < types.length; i++) {
			const type = types[i];

			if (contentTypeLookup[type]) {
				return contentTypeLookup[type];
			}
		}
	}
	return null;
}
