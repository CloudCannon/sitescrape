#!/usr/bin/env node --experimental-specifier-resolution=node
import { URL } from 'node:url';
import * as p from '@clack/prompts';
import * as path from 'path';
import * as fs from 'fs';
import Scraper from './scraper';

p.intro(`Welcome to the site scraper`);

const base = await p.text({
	message: `What site would you like to download?`,
	placeholder: 'https://example.com/',
	initialValue: '',
	validate(value) {
		if (value.length === 0) return `Value is required!`;
		const url = new URL(value);
		if (url.pathname !== '/') return `Do not specify pathname, not ${url.pathname}`;
		if (url.search) return `Do not specify a search query, not ${url.search}`;
		if (url.protocol !== 'https:') return `Must be https: not ${url.protocol}`;
	}
});

if (p.isCancel(base)) {
	p.cancel('Site scrape cancelled.');
	process.exit(0);
}

const url = new URL(base);
const relativePath = await p.text({
	message: 'Where would you like to download it to?',
	placeholder: './_site/',
	initialValue: `./${url.hostname}/`,
	validate(outputPath) {
		if (outputPath.length === 0) return `Output path is required!`;
		if (!outputPath.startsWith('./')) return `Output path must be relative`;
		if (path.normalize(outputPath).includes('..')) return `Output path must be relative`;

		const absoluteOutputPath = path.resolve(outputPath);

		try {
			const stat = fs.statSync(absoluteOutputPath);

			if (!stat.isDirectory()) {
				return `${outputPath} is not a directory`;
			}

			const files = fs.readdirSync(absoluteOutputPath);
			if (files.length > 0) {
				return `${absoluteOutputPath} is not an empty directory`;
			}
		} catch (error: any) {
			if (error.code !== 'ENOENT') {
				return error.message;
			}
		}
	}
});

if (p.isCancel(relativePath)) {
	p.cancel('Site scrape cancelled.');
	process.exit(0);
}

const absolutePath = path.resolve(relativePath);
p.log.success(`Output set to ${absolutePath}`);

const shouldContinue = await p.confirm({
	message: `I confirm that I am legally allowed to download the site at ${base} to ${relativePath}?`
});

if (p.isCancel(shouldContinue)) {
	p.cancel('Site scrape cancelled.');
	process.exit(0);
}

if (!shouldContinue) {
	p.cancel('Legal requirements not met.');
	process.exit(0);
}

process.setMaxListeners(0);
try {
	const scraper = new Scraper({
		absolutePath,
		base: new URL(base).origin
	});
	await scraper.start();
} catch (error: any) {
	p.cancel(error.message);
	process.exit(1);
}

p.outro(`All done`);
