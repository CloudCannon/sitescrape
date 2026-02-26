import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import HTMLParser from '../src/parsers/html-parser.ts';
import CSSParser from '../src/parsers/css-parser.ts';
import XMLParser from '../src/parsers/xml-parser.ts';
import JSParser from '../src/parsers/js-parser.ts';
import { contentTypeToParser, contentTypeToExtension } from '../src/parsers/all.ts';

describe('HTMLParser', () => {
	it('extracts href attributes', async () => {
		const parser = new HTMLParser({
			body: '<a href="/about">About</a><link rel="stylesheet" href="/style.css">',
			relativePath: '/index.html'
		});
		const links = await parser.parse();
		assert.ok(links.includes('/about'));
		assert.ok(links.includes('/style.css'));
	});

	it('extracts src attributes', async () => {
		const parser = new HTMLParser({
			body: '<img src="/logo.png"><script src="/app.js"></script>',
			relativePath: '/index.html'
		});
		const links = await parser.parse();
		assert.ok(links.includes('/logo.png'));
		assert.ok(links.includes('/app.js'));
	});

	it('extracts URLs from srcset attributes', async () => {
		const parser = new HTMLParser({
			body: '<img srcset="/small.jpg 480w, /large.jpg 1024w">',
			relativePath: '/index.html'
		});
		const links = await parser.parse();
		assert.ok(links.includes('/small.jpg'));
		assert.ok(links.includes('/large.jpg'));
	});

	it('extracts URLs from inline style attributes', async () => {
		const parser = new HTMLParser({
			body: '<div style="background: url(/bg.png)"></div>',
			relativePath: '/index.html'
		});
		const links = await parser.parse();
		assert.ok(links.includes('/bg.png'));
	});

	it('extracts URLs from style tags', async () => {
		const parser = new HTMLParser({
			body: '<style>body { background: url(/bg.png); }</style>',
			relativePath: '/index.html'
		});
		const links = await parser.parse();
		assert.ok(links.includes('/bg.png'));
	});

	it('appends index.html to paths without .html extension', () => {
		const parser = new HTMLParser({ body: '', relativePath: '/about' });
		assert.equal(parser.processedPath(), '/about/index.html');
	});

	it('leaves .html paths unchanged', () => {
		const parser = new HTMLParser({ body: '', relativePath: '/about.html' });
		assert.equal(parser.processedPath(), '/about.html');
	});
});

describe('CSSParser', () => {
	it('extracts a single url() reference', async () => {
		const parser = new CSSParser({
			body: 'body { background: url(/bg.png); }',
			relativePath: '/style.css'
		});
		const links = await parser.parse();
		assert.deepEqual(links, ['/bg.png']);
	});

	it('extracts multiple url() references', async () => {
		const parser = new CSSParser({
			body: '.a { background: url(/a.png); } .b { background: url(/b.png); }',
			relativePath: '/style.css'
		});
		const links = await parser.parse();
		assert.ok(links.includes('/a.png'));
		assert.ok(links.includes('/b.png'));
		assert.equal(links.length, 2);
	});

	it('handles quoted URLs', async () => {
		const parser = new CSSParser({
			body: 'body { background: url("/quoted.png"); }',
			relativePath: '/style.css'
		});
		const links = await parser.parse();
		assert.deepEqual(links, ['/quoted.png']);
	});

	it('handles single-quoted URLs', async () => {
		const parser = new CSSParser({
			body: "body { background: url('/single.png'); }",
			relativePath: '/style.css'
		});
		const links = await parser.parse();
		assert.deepEqual(links, ['/single.png']);
	});

	it('returns empty array for CSS with no URLs', async () => {
		const parser = new CSSParser({
			body: 'body { color: red; }',
			relativePath: '/style.css'
		});
		const links = await parser.parse();
		assert.deepEqual(links, []);
	});
});

describe('XMLParser', () => {
	it('extracts URLs from loc tags', async () => {
		const parser = new XMLParser({
			body: '<urlset><url><loc>https://example.com/page</loc></url></urlset>',
			relativePath: '/sitemap.xml'
		});
		const links = await parser.parse();
		assert.ok(links.includes('https://example.com/page'));
	});

	it('extracts multiple loc tags', async () => {
		const parser = new XMLParser({
			body: '<urlset><url><loc>https://example.com/a</loc></url><url><loc>https://example.com/b</loc></url></urlset>',
			relativePath: '/sitemap.xml'
		});
		const links = await parser.parse();
		assert.ok(links.includes('https://example.com/a'));
		assert.ok(links.includes('https://example.com/b'));
		assert.equal(links.length, 2);
	});

	it('appends index.xml to paths without .xml extension', () => {
		const parser = new XMLParser({ body: '', relativePath: '/sitemap' });
		assert.equal(parser.processedPath(), '/sitemap/index.xml');
	});

	it('leaves .xml paths unchanged', () => {
		const parser = new XMLParser({ body: '', relativePath: '/sitemap.xml' });
		assert.equal(parser.processedPath(), '/sitemap.xml');
	});
});

describe('JSParser', () => {
	it('returns no links', async () => {
		const parser = new JSParser({
			body: 'console.log("hello");',
			relativePath: '/app.js'
		});
		const links = await parser.parse();
		assert.deepEqual(links, []);
	});

	it('returns babel prettier options', () => {
		const parser = new JSParser({ body: '', relativePath: '/app.js' });
		assert.deepEqual(parser.prettierOptions(), { parser: 'babel' });
	});
});

describe('contentTypeToParser', () => {
	it('maps text/html to HTMLParser', () => {
		assert.equal(contentTypeToParser('text/html'), 'HTMLParser');
	});

	it('maps text/css to CSSParser', () => {
		assert.equal(contentTypeToParser('text/css'), 'CSSParser');
	});

	it('maps application/xml to XMLParser', () => {
		assert.equal(contentTypeToParser('application/xml'), 'XMLParser');
	});

	it('maps text/xml to XMLParser', () => {
		assert.equal(contentTypeToParser('text/xml'), 'XMLParser');
	});

	it('maps application/javascript to JSParser', () => {
		assert.equal(contentTypeToParser('application/javascript'), 'JSParser');
	});

	it('maps text/javascript to JSParser', () => {
		assert.equal(contentTypeToParser('text/javascript'), 'JSParser');
	});

	it('handles content-type with charset suffix', () => {
		assert.equal(contentTypeToParser('text/html; charset=utf-8'), 'HTMLParser');
	});

	it('returns null for unknown content types', () => {
		assert.equal(contentTypeToParser('application/octet-stream'), null);
	});

	it('returns null for null input', () => {
		assert.equal(contentTypeToParser(null), null);
	});
});

describe('contentTypeToExtension', () => {
	it('maps application/json to .json', () => {
		assert.equal(contentTypeToExtension('application/json'), '.json');
	});

	it('maps text/html to .html', () => {
		assert.equal(contentTypeToExtension('text/html'), '.html');
	});

	it('maps application/xml to .xml', () => {
		assert.equal(contentTypeToExtension('application/xml'), '.xml');
	});

	it('maps text/css to .css', () => {
		assert.equal(contentTypeToExtension('text/css'), '.css');
	});

	it('maps application/javascript to .js', () => {
		assert.equal(contentTypeToExtension('application/javascript'), '.js');
	});

	it('maps application/ld+json to .json', () => {
		assert.equal(contentTypeToExtension('application/ld+json'), '.json');
	});

	it('maps text/plain to .txt', () => {
		assert.equal(contentTypeToExtension('text/plain'), '.txt');
	});

	it('handles charset suffix', () => {
		assert.equal(contentTypeToExtension('application/json; charset=utf-8'), '.json');
	});

	it('returns null for unknown content types', () => {
		assert.equal(contentTypeToExtension('application/octet-stream'), null);
	});

	it('returns null for null input', () => {
		assert.equal(contentTypeToExtension(null), null);
	});
});
