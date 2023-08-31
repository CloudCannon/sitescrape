import * as p from "@clack/prompts";
import * as path from 'path';
import * as fs from 'fs';
import Scraper from "./scraper";

p.intro(`Welcome to the site scraper`);

const url = await p.text({
  message: `What site would you like to download?`,
  placeholder: "https://example.com/",
  initialValue: "",
  validate(value) {
    if (value.length === 0) return `Value is required!`;
  },
});

if (p.isCancel(url)) {
  p.cancel("Site scrape cancelled.");
  process.exit(0);
}

const relativePath = await p.text({
  message: "Where would you like to download it to?",
  placeholder: "./_site/",
  initialValue: "./_site/",
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
  message: `I confirm that I am legally allowed to download the site at ${url} to ${relativePath}?`,
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
    url
  })
  await scraper.start();
} catch (error) {
  p.cancel(error.message);
  process.exit(1);
}
