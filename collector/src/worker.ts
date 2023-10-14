import puppeteer from "@cloudflare/puppeteer";
import robotsParser from "robots-parser"
import { Hono } from 'hono'

interface Product {
	id: number;
	title: string;
	handle: string;
	vendor: string;
	tags: string[];
}


type Bindings = {
	BROWSER: puppeteer.BrowserWorker;
}
type Variables = {
	url: string;
	browser: puppeteer.Browser
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>()

app.use("*", async (c, next) => {
	const { url } = await c.req.json()
	if (!url) {
		return new Response("Missing url", { status: 400 })
	}
	const isAllowed = await isAllowByRobots(url);
	if (!isAllowed) {
		console.log("robots.txt disallows crawling");
		return new Response("robots.txt disallows crawling", { status: 403 });
	}

	console.log("robots.txt allows crawling");

	const browser = await puppeteer.launch(c.env.BROWSER);

	c.set('browser', browser)
	c.set('url', url)

	await next()

	await browser.close();
})

app.post('/list', async (c) => {
	const url = c.get('url')

	const browser = c.get('browser')

	const page = await browser.newPage();
	await page.goto(url);

	const jsonData = await page.$eval('body', body => {
		return JSON.parse(body.innerText) as Product[];
	});

	return c.json(jsonData)
})

export default app

async function isAllowByRobots(url: string) {
	let isAllowed = true;
	try {
		const robotsTextPath = new URL(url).origin + "/robots.txt";
		const response = await fetch(robotsTextPath);

		const robots = robotsParser(robotsTextPath, await response.text());
		isAllowed = robots.isAllowed(url) ?? true; // respect robots.txt!
	} catch {
		// ignore
	}
	return isAllowed;
}
