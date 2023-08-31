import XMLParser from "./xml-parser";
import HTMLParser from "./html-parser";
import CSSParser from "./css-parser";

export const Parsers = {
    XMLParser,
    HTMLParser,
    CSSParser
};

const contentTypeLookup = {
    'text/html': 'HTMLParser',
    'text/xml': 'XMLParser',
    'text/css': 'CSSParser',
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
