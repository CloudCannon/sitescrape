import { URL } from 'node:url';
import * as p from "@clack/prompts";
import * as path from 'path';
import * as fs from 'fs';
import Scraper from "./scraper";

p.intro(`Welcome to the site scraper`);

const base = await p.text({
  message: `What site would you like to download?`,
  placeholder: "https://example.com/",
  initialValue: "",
  validate(value) {
    if (value.length === 0) return `Value is required!`;
    const url = new URL(value);
    if (url.pathname !== '/') return `Do not specify pathname, not ${url.pathname}`;
    if (url.search) return `Do not specify a search query, not ${url.search}`;
    if (url.protocol !== 'https:') return `Must be https: not ${url.protocol}`;
  },
});

if (p.isCancel(base)) {
  p.cancel("Site scrape cancelled.");
  process.exit(0);
}

const url = new URL(base);
const relativePath = await p.text({
  message: "Where would you like to download it to?",
  placeholder: "./_site/",
  initialValue: `./${url.hostname}/`,
  validate(value) {
    if (value.length === 0) return `Value is required!`;
    if (!value.startsWith('./')) return `Value must be relative`;
    if (path.normalize(value).includes('..')) return `Value must be relative`;
  },
});

if (p.isCancel(relativePath)) {
  p.cancel("Site scrape cancelled.");
  process.exit(0);
}

const absolutePath = path.resolve(relativePath);
p.log.success(`Output set to ${absolutePath}`);

try {
    const stat = await fs.promises.stat(absolutePath);

    if (!stat.isDirectory()) {
        p.cancel(`${relativePath} is not a directory`);
        process.exit(1);
    }

    const files = await fs.promises.readdir(absolutePath);
    if (files.length > 0) {
        p.cancel(`${relativePath} is not an empty directory`);
        process.exit(1);
    }
} catch (error) {
    if (error.code !== 'ENOENT') {
        p.cancel(error.message);
        process.exit(1);
    }
}

const shouldContinue = await p.confirm({
  message: `I confirm that I am legally allowed to download the site at ${base} to ${relativePath}?`,
});

if (p.isCancel(shouldContinue)) {
  p.cancel("Site scrape cancelled.");
  process.exit(0);
}

if (!shouldContinue) {
    p.cancel("Legal requirements not met.");
    process.exit(0);
}

try {
  const scraper = new Scraper({
    absolutePath,
    base: new URL(base).origin
  })
  await scraper.start();
} catch (error) {
  p.cancel(error.message);
  process.exit(1);
}

p.outro(`All done`);