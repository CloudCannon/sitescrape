import XMLParser from './xml-parser.ts';
import HTMLParser from './html-parser.ts';
import CSSParser from './css-parser.ts';
import JSParser from './js-parser.ts';

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

const extensionLookup: Record<string, string> = {
	'text/html': '.html',
	'application/xml': '.xml',
	'text/xml': '.xml',
	'application/rss+xml': '.xml',
	'application/atom+xml': '.xml',
	'text/css': '.css',
	'application/javascript': '.js',
	'text/javascript': '.js',
	'application/json': '.json',
	'application/ld+json': '.json',
	'text/plain': '.txt'
};

export function contentTypeToExtension(contentType: string | null): string | null {
	if (contentType) {
		const type = contentType.split(';')[0].trim();
		return extensionLookup[type] ?? null;
	}
	return null;
}
