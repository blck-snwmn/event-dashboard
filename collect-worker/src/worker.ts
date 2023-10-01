
import puppeteer from "@cloudflare/puppeteer";
import robotsParser from "robots-parser"

export interface Env {
	TARGET_URL: string;
	BROWSER: puppeteer.BrowserWorker;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		let isAllowed = true;
		try {
			const robotsTextPath = new URL(env.TARGET_URL).origin + "/robots.txt";
			const response = await fetch(robotsTextPath);

			const robots = robotsParser(robotsTextPath, await response.text());
			isAllowed = robots.isAllowed(env.TARGET_URL) ?? true; // respect robots.txt!
		} catch {
			// ignore
		}

		if (!isAllowed) {
			console.log("robots.txt disallows crawling");
			return new Response("robots.txt disallows crawling", { status: 403 });
		}

		console.log("robots.txt allows crawling");

		const browser = await puppeteer.launch(env.BROWSER);
		const page = await browser.newPage();
		await page.setViewport({ width: 800, height: 2000 });

		await page.goto(env.TARGET_URL);

		// 商品情報のURLを抽出
		const urls = await page.$$eval('div.ProductItem div.ProductItem__Wrapper > a', links => links.map(link => link.href));

		urls.forEach(async (url) => {
			console.log(url);
		})

		await browser.close();
		return new Response('Hello World!');
	},
};
