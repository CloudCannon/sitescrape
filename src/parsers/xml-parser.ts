import Parser from "./parser";
import { JSDOM } from 'jsdom';

export default class XMLParser extends Parser {
    async parse() : Promise<string[]> {
        const links = [];
        const dom = new JSDOM(this.options.body);

        const locTags = dom.window.document.querySelectorAll("loc");
        await Promise.all(Array.from(locTags).map(async (node : any) => {
            const text = node.textContent.trim();
            if (text.startsWith(this.options.url)) {
                links.push(text.substring(this.options.url.length))
            }
        }));


        return links;
    }

    processedPath() : string {
        if (this.options.relativePath.endsWith('/')) {
            return `${this.options.relativePath}index.xml`;
        }
        return this.options.relativePath;
    }
}
