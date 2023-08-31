import Parser from "./parser";

const urlRegex = /url\(.*?\)/ig;

export default class CSSParser extends Parser {
    async parse() : Promise<string[]> {
        const links = [];
        const urlMatches = this.options.body.match(urlRegex);
        urlMatches?.forEach((match) => {
            const href = match.substring(4, match.length - 1)
                .replace(/^['"]/, '')
                .replace(/['"]$/, '');
            if (href.startsWith('/')) {
                links.push(href);
            }
        });

        return links;
    }
}
