import { URL } from 'node:url';
import * as p from "@clack/prompts";
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import { Parsers, contentTypeToParser } from './parsers/all';
import * as prettier from "prettier";

interface ScraperOptions {
    absolutePath: string;
    base: string;
}

interface Redirect {
    from: string;
    to: string;
    status: number;
}

export default class Scraper {
    options: ScraperOptions;
    completed: Record<string, boolean>;
    redirects: Redirect[];
    queue: string[];

    constructor(options: ScraperOptions) {
        this.options = options;
    }

    async start() : Promise<void> {
        this.completed = {};
        this.queue = [];
        this.redirects = [];
        this.queue.push('/');
        this.queue.push('/sitemap.xml');
        while (this.queue.length > 0) {
            await this.scrapeNext();
        }

        if (this.redirects.length > 0) {
            const s = p.spinner();
            s.start('Saving routing.json');
            const absolutePath = path.join(this.options.absolutePath, '.cloudcannon/routing.json');
            const dirname = path.dirname(absolutePath);
            await fs.promises.mkdir(dirname, { recursive: true })
            await fs.promises.writeFile(absolutePath, JSON.stringify({
                routes: this.redirects
            }, null, '\t'));
            s.stop('Saved routing.json');
        }
    }

    async scrapeNext() : Promise<void> {
        const urlPath = this.queue.shift();
        if (!urlPath) {
            return;
        }

        const url = new URL(urlPath, this.options.base);
        if (url.origin !== this.options.base) {
            return
        }

        const liveUrl = url.href;
        if (this.completed[liveUrl]) {
            return
        }

        const s = p.spinner();
        s.start(`Downloading ${liveUrl}`);
        this.completed[liveUrl] = true;

        let response;
        let error;
        try {
            response = await fetch(liveUrl, {
                redirect: 'manual',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/109.0',
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Alt-Used': `${liveUrl}`,
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    Pragma: 'no-cache',
                    'Cache-Control': 'no-cache'
                },
                method: 'GET'
            });
        } catch (fetchError) {
            error = fetchError;
        }

        if (!error) {
            let relativePath = urlPath;
            let body;

            const contentType = response.headers.get('content-type');
            if (response.status === 200) {
                const parserClass = contentTypeToParser(contentType);
                if (parserClass) {
                    body = await response.text();
                    const parser = new Parsers[parserClass]({
                        body,
                        relativePath
                    });
    
                    relativePath = parser.processedPath();
    
                    const links = await parser.parse();
    
                    links.forEach((link) => this.processNewLink(link));

                    try {
                        const prettierOptions = parser.prettierOptions();
                        if (prettierOptions) {
                            body = await prettier.format(body, prettierOptions);
                        }
                    } catch (prettierError) {
                        p.log.error(prettierError.message);
                    }
                }
        
                const absolutePath = path.join(this.options.absolutePath, relativePath);
                if (!absolutePath.endsWith('/')) {
                    const dirname = path.dirname(absolutePath);
                    await fs.promises.mkdir(dirname, { recursive: true })
                    if (!body) {
                        await response.body.pipe(fs.createWriteStream(absolutePath))
                    } else {
                        await fs.promises.writeFile(absolutePath, body);
                    }
                    s.stop(`Downloaded ${liveUrl}: ${contentType} ${response.status}`);
                } else {
                    s.stop(`Prevented folder file ${liveUrl}: ${contentType} ${response.status}`);
                }
            } else {
                const redirect = response.headers.get('location');
                if (redirect) {
                    this.processNewLink(redirect);
                    const redirectUrl = new URL(redirect, this.options.base);
                    this.redirects.push({
                        from: url.pathname,
                        to: redirectUrl.origin === this.options.base
                            ? redirectUrl.pathname
                            : redirect,
                        status: response.status
                    });
                    s.stop(`Redirect ${liveUrl} to ${redirect} ${response.status}`);
                } else {
                    s.stop(`Unhandled status ${liveUrl}: ${contentType} ${response.status}`);
                }
            }
        } else {
            s.stop(`Downloaded ${liveUrl}: ${error}`);
        }
    }

    processNewLink(link : string) : void {
        const url = new URL(link, this.options.base);
        if (url.origin === this.options.base) {
            this.queue.push(url.pathname);
        }
    }
}
