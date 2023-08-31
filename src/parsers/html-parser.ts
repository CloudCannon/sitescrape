import Parser from "./parser";
import { JSDOM } from 'jsdom';
import CSSParser from "./css-parser";
import * as path from 'path';
import { parseSrcset } from 'srcset';

export default class HTMLParser extends Parser {
    async parse() : Promise<string[]> {
        const links = [];

        const dom = new JSDOM(this.options.body);

        const hrefs = dom.window.document.querySelectorAll("[href]");
        hrefs.forEach((node) => {
            const href = node.getAttribute('href').split('?')[0];
            if (href.startsWith('/')) {
                links.push(href);
            }
        });

        const srcs = dom.window.document.querySelectorAll("[src]");
        srcs.forEach((node) => {
            const src = node.getAttribute('src').split('?')[0];
            if (src.startsWith('/')) {
                links.push(src);
            }
        });

        const srcsets = dom.window.document.querySelectorAll("[srcset]");
        srcsets.forEach((node) => {
            const srcset = node.getAttribute('srcset');
            const parsed = parseSrcset(srcset);

            parsed.forEach((value) => {
                const src = value.url.split('?')[0];
                if (src.startsWith('/')) {
                    links.push(src);
                }
            })
        });

        const inlineStyles = dom.window.document.querySelectorAll("[style]");
        await Promise.all(Array.from(inlineStyles).map(async (node: any) => {
            const parser = new CSSParser({
                ...this.options,
                body: node.getAttribute('style')
            });

            const styleLinks = await parser.parse();

            links.push(...styleLinks);
        }));

        const styleTags = dom.window.document.querySelectorAll("style");
        await Promise.all(Array.from(styleTags).map(async (node : any) => {
            const parser = new CSSParser({
                ...this.options,
                body: node.textContent
            });

            const styleLinks = await parser.parse();

            links.push(...styleLinks);
        }));

        return links;
    }

    processedPath() : string {
        if (!this.options.relativePath.endsWith('.html')) {
            return path.join(this.options.relativePath, 'index.html');
        }
        return this.options.relativePath;
    }

    prettierOptions() : Record<string, any> {
        return { parser: "html" };
    }
}
