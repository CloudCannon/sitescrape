# SiteScrape

A CLI tool to download a live website into a local static site. Built by [CloudCannon](https://cloudcannon.com/) as a companion to [StaticShape](https://github.com/CloudCannon/staticshape), which converts the downloaded static HTML into an SSG site.

## Features

- Interactive CLI that walks you through the download process
- Crawls all internal pages starting from the root URL and sitemap
- Parses HTML, CSS, XML, and JavaScript to discover linked assets
- Formats downloaded files with [Prettier](https://prettier.io/)
- Follows redirects and records them in `.cloudcannon/routing.json` for [CloudCannon custom routing](https://cloudcannon.com/documentation/developer-articles/configure-custom-routing/)
- Handles folder-style URLs (e.g. `/wp-json/`, `/api/`) by saving them as `index.{ext}` with a proxy route

## Requirements

- Node.js >= 18.0.0
- npm >= 8.0.0

## Getting started

```bash
npm install
npm start
```

The CLI will prompt you for:

1. **Site URL** — the HTTPS root URL of the site to download
2. **Output directory** — a relative path to save the downloaded files (defaults to `./{hostname}/`)
3. **Legal confirmation** — you must confirm you have permission to download the site

## Development

```bash
npm install
npm run build
npm test
```

| Command | Description |
|---|---|
| `npm start` | Build and run the CLI |
| `npm run build` | Compile TypeScript to `lib/` |
| `npm test` | Run parser tests with coverage |
| `npm run prettier-format` | Format source and test files |

## How it works

SiteScrape starts by fetching the root page (`/`) and `/sitemap.xml`. For each downloaded page, it:

1. Identifies the content type and selects a parser (HTML, CSS, XML, or JS)
2. Extracts all internal links and assets from the page
3. Queues any new links for download
4. Formats the content with Prettier
5. Writes the file to disk

Redirects encountered during crawling are recorded as routing rules. Folder-style URLs that return non-HTML content (like `/wp-json/` returning JSON) are saved with an appropriate filename and a 200 proxy route so the original URL continues to work on CloudCannon.

## Output structure

```
output-dir/
├── .cloudcannon/
│   └── routing.json      # Redirect and proxy rules
├── index.html
├── about/
│   └── index.html
├── sitemap.xml
├── css/
│   └── style.css
├── js/
│   └── app.js
└── images/
    └── logo.png
```

## Legal notice

**You are responsible for ensuring you have the legal right to download and use any website content.** SiteScrape is a tool intended for migrating sites that you own or have explicit permission to copy. Before scraping any site, verify that:

- You own the site or have written permission from the owner
- Your use complies with the site's Terms of Service and `robots.txt`
- Your use complies with applicable copyright, data protection, and privacy laws
- You are not reproducing content in a way that infringes on intellectual property rights

The CLI requires you to confirm legal permission before each download. CloudCannon and the contributors to this project accept no liability for misuse.

## License

ISC
