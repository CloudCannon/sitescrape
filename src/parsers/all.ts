import XMLParser from "./xml-parser";
import HTMLParser from "./html-parser";
import CSSParser from "./css-parser";
import JSParser from "./js-parser";

export const Parsers = {
    XMLParser,
    HTMLParser,
    CSSParser,
    JSParser
};

const contentTypeLookup = {
    'text/html': 'HTMLParser',
    'text/xml': 'XMLParser',
    'text/css': 'CSSParser',
    'application/javascript': 'JSParser',
	'text/javascript': 'JSParser',
}

export function contentTypeToParser(contentType: string) : string | null {
    const types = contentType.split(';');

    for (let i = 0; i < types.length; i++) {
        const type = types[i];
        
        if (contentTypeLookup[type]) {
            return contentTypeLookup[type];
        }
    }
    return null;
}
