interface ParserOptions {
    body: string;
    relativePath: string;
}

export default class Parser {
    options: ParserOptions;
    links: string[];

    constructor(options: ParserOptions) {
        this.options = options;
        this.links = [];
    }

    async parse() : Promise<string[]> {
        const links = [];
        return links;
    }

    processedPath() : string {
        return this.options.relativePath;
    }

    prettierOptions() : void {
        return null;
    }
}
