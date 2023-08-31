import * as p from "@clack/prompts";
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import { Parsers, contentTypeToParser } from './parsers/all';

interface ScraperOptions {
    absolutePath: string;
    url: string;
}

export default class Scraper {
    options: ScraperOptions;
    completed: Record<string, boolean>;
    queue: string[];

    constructor(options: ScraperOptions) {
        this.options = options;
    }

    async start() : Promise<void> {
        this.completed = {};
        this.queue = [];
        this.queue.push('/');
        this.queue.push('/sitemap.xml');
        return this.scrapeNext();
    }

    async scrapeNext() : Promise<void> {
        const nextUrl = this.queue.shift();
        if (!nextUrl) {
            return;
        }

        const liveUrl = path.join(this.options.url, nextUrl);
        if (this.completed[liveUrl]) {
            return this.scrapeNext();
        }

        const s = p.spinner();
        s.start(`Downloading ${liveUrl}`);
        this.completed[liveUrl] = true;

        let response;
        let error;
        try {
            response = await fetch(liveUrl, {
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
            let relativePath = nextUrl;
            let body;
            if (response.status === 200) {
                const contentType = response.headers.get('content-type');
    
                const parserClass = contentTypeToParser(contentType);
                if (parserClass) {
                    body = await response.text();
                    const parser = new Parsers[parserClass]({
                        body,
                        relativePath,
                        url: this.options.url
                    });
    
                    relativePath = parser.processedPath();
    
                    const links = await parser.parse();
    
                    links.forEach((link) => {
                        this.queue.push(link);
                    });
                }
        
                const absolutePath = path.join(this.options.absolutePath, relativePath);
                const dirname = path.dirname(absolutePath);
                await fs.promises.mkdir(dirname, { recursive: true })
                if (!body) {
                    await response.body.pipe(fs.createWriteStream(absolutePath))
                } else {
                    await fs.promises.writeFile(absolutePath, body);
                }
            }
            // Do installation here
            s.stop(`Downloaded ${liveUrl}: ${response.status}`);
        } else {
            // Do installation here
            s.stop(`Downloaded ${liveUrl}: ${error}`);
        }
        
        return this.scrapeNext();
    }

}
