import Parser from "./parser";
import { JSDOM } from 'jsdom';
import * as path from 'path';

export default class XMLParser extends Parser {
    async parse() : Promise<string[]> {
        const links = [];
        const dom = new JSDOM(this.options.body);

        const locTags = dom.window.document.querySelectorAll("loc, link");
        await Promise.all(Array.from(locTags).map(async (node : any) => {
            const text = node.textContent.trim().split('?')[0];
            if (text.startsWith(this.options.url)) {
                links.push(text.substring(this.options.url.length))
            }
        }));


        return links;
    }

    processedPath() : string {
        if (!this.options.relativePath.endsWith('.xml')) {
            return path.join(this.options.relativePath, 'index.xml');
        }
        return this.options.relativePath;
    }

    prettierOptions() : Record<string, any> {
        return {
            parser: "xml",
            xmlWhitespaceSensitivity: 'ignore',
            plugins: ["@prettier/plugin-xml"],
        };
    }
}
