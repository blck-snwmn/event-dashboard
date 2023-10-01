
import puppeteer from "@cloudflare/puppeteer";
import robotsParser from "robots-parser"

export interface Env {
	TARGET_URL: string;
	BROWSER: puppeteer.BrowserWorker;

	CRAWLER_QUEUE: Queue<Message>;
}

type Message = {
	url: string;
};

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

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const isAllowed = await isAllowByRobots(env.TARGET_URL);
		if (!isAllowed) {
			console.log("robots.txt disallows crawling");
			return new Response("robots.txt disallows crawling", { status: 403 });
		}

		console.log("robots.txt allows crawling");

		const browser = await puppeteer.launch(env.BROWSER);
		const page = await browser.newPage();

		await page.goto(env.TARGET_URL);

		// 商品情報のURLを抽出
		const urls = await page.$$eval('div.ProductItem div.ProductItem__Wrapper > a', links => links.map(link => link.href));

		urls.forEach(async (url) => {
			await env.CRAWLER_QUEUE.send({ url: url });
		})

		await browser.close();
		return new Response('Hello World!');
	},

	async scheduled(
		_controller: ScheduledController,
		env: Env,
	): Promise<void> {
		const isAllowed = await isAllowByRobots(env.TARGET_URL);
		if (!isAllowed) {
			console.log("robots.txt disallows crawling");
			return
		}

		console.log("robots.txt allows crawling");

		const browser = await puppeteer.launch(env.BROWSER);
		const page = await browser.newPage();

		await page.goto(env.TARGET_URL);

		// 商品情報のURLを抽出
		const urls = await page.$$eval('div.ProductItem div.ProductItem__Wrapper > a', links => links.map(link => link.href));

		urls.forEach(async (url) => {
			await env.CRAWLER_QUEUE.send({ url: url });
		})

		await browser.close();
	},

	async queue(batch: MessageBatch<Message>, env: Env): Promise<void> {
		let browser: puppeteer.Browser | null = null;
		try {
			browser = await puppeteer.launch(env.BROWSER);
		} catch {
			batch.retryAll();
			return;
		}

		for (const message of batch.messages) {
			const { url } = message.body;
			console.log(`Crawling ${url}`);
			const isAllowed = await isAllowByRobots(url);

			if (!isAllowed) {
				message.ack();
				continue;
			}
			const page = await browser.newPage();

			await page.goto(url);

			// Extract the sale period using the specified selector
			const salePeriodText = await page.$eval('.Product__salesPeriodHeading + *', element => element.textContent);

			// Extract the start and (if available) end dates from the sale period text
			const periodMatch = salePeriodText.match(/(\d{4})年(\d{2})月(\d{2})日 (\d{2})時(\d{2})分(?: ～ (\d{4})年(\d{2})月(\d{2})日 (\d{2})時(\d{2})分)?/);

			// Convert the matched date parts to Date objects
			const startDate = periodMatch ? new Date(periodMatch[1], periodMatch[2] - 1, periodMatch[3], periodMatch[4], periodMatch[5]) : null;
			const endDate = periodMatch && periodMatch[6] ? new Date(periodMatch[6], periodMatch[7] - 1, periodMatch[8], periodMatch[9], periodMatch[10]) : null;

			console.log(`Sale period: ${startDate} - ${endDate}`);

			message.ack();
		}
		await browser.close();

	}
};
