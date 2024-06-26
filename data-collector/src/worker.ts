import puppeteer from "@cloudflare/puppeteer";
import type { Limit, Product } from "dash-message/message";
import { Hono } from "hono";
import robotsParser from "robots-parser";

type Bindings = {
	SELECTOR: string;
	BROWSER: puppeteer.BrowserWorker;
};
type Variables = {
	url: string;
	browser: puppeteer.Browser;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", async (c, next) => {
	const { url } = await c.req.json();
	if (!url) {
		return new Response("Missing url", { status: 400 });
	}
	const isAllowed = await isAllowByRobots(url);
	if (!isAllowed) {
		console.log("robots.txt disallows crawling");
		return new Response("robots.txt disallows crawling", { status: 403 });
	}

	console.info("robots.txt allows crawling");

	console.info("waiting for browser to launch");

	// await new Promise(resolve => setTimeout(resolve, 25 * 1000));

	console.info("launching browser");

	const sessionId = await getRandomSession(c.env.BROWSER);

	let browser: puppeteer.Browser | null = null;
	try {
		if (sessionId) {
			console.info("connecting to existing session");
			browser = await puppeteer.connect(c.env.BROWSER, sessionId);
			console.info("browser connected");
		}
		if (!browser) {
			console.info("launching new browser");
			browser = await puppeteer.launch(c.env.BROWSER);
			console.info("browser launched");
		}
		c.set("browser", browser);
	} catch (e) {
		console.error(e);
		await new Promise((resolve) => setTimeout(resolve, 30 * 1000));
		return new Response("Failed to launch browser", { status: 500 });
	}

	c.set("url", url);

	await next();

	// use disconnect instead of close to keep the session alive
	await browser?.disconnect();
});

app.post("/list", async (c) => {
	const url = c.get("url");

	const browser = c.get("browser");

	const page = await browser.newPage();
	await page.goto(url);

	const jsonData = await page.$eval("body", (body) => {
		return JSON.parse(body.innerText) as Product[];
	});

	// remove unnecessary fields
	return c.json(
		jsonData.map(
			(p) =>
				({
					id: p.id,
					title: p.title,
					handle: p.handle,
					vendor: p.vendor,
					tags: p.tags,
				}) as Product,
		),
	);
});

app.post("/item", async (c) => {
	const url = c.get("url");

	const browser = c.get("browser");

	const page = await browser.newPage();
	await page.goto(url);

	// Extract the sale period using the specified selector
	const salePeriodText: string = await page.$eval(
		c.env.SELECTOR,
		(element) => element.textContent,
	);

	const { startDate, endDate } = extractDates(salePeriodText);

	return c.json({
		startDate: startDate?.toISOString() ?? null,
		endDate: endDate?.toISOString() ?? null,
	} as Limit);
});

export default app;

async function isAllowByRobots(url: string) {
	let isAllowed = true;
	try {
		const robotsTextPath = `${new URL(url).origin}/robots.txt`;
		const response = await fetch(robotsTextPath);

		const robots = robotsParser(robotsTextPath, await response.text());
		isAllowed = robots.isAllowed(url) ?? true; // respect robots.txt!
	} catch {
		// ignore
	}
	return isAllowed;
}

// Helper function to convert matched date parts to ISO 8601 date string with JST timezone
export function toISOString(match: string[]) {
	const [year, month, day, hour, minute] = match;
	return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(
		2,
		"0",
	)}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00+09:00`;
}

export function extractDates(salePeriodText: string) {
	// Extract the start and (if available) end dates from the sale period text
	const periodMatch = salePeriodText.match(
		/(\d{4})年(\d{1,2})月(\d{1,2})日 (\d{1,2})(?:時|:)(\d{1,2})分? *(?:～|~)(?: ?(\d{4})年(\d{1,2})月(\d{1,2})日 (\d{1,2})(?:時|:)(\d{1,2})分?)?/,
	);

	// Convert the matched date parts to Date objects
	const startDate = periodMatch
		? new Date(toISOString(periodMatch.slice(1, 6)))
		: null;
	const endDate = periodMatch?.[6]
		? new Date(toISOString(periodMatch.slice(6, 11)))
		: null;
	return { startDate, endDate };
}

// Pick random free session
// Other custom logic could be used instead
async function getRandomSession(
	endpoint: puppeteer.BrowserWorker,
): Promise<string> {
	const sessions: puppeteer.ActiveSession[] =
		await puppeteer.sessions(endpoint);
	console.info(`Sessions: ${JSON.stringify(sessions)}`);
	const sessionsIds = sessions
		.filter((v) => {
			return !v.connectionId; // remove sessions with workers connected to them
		})
		.map((v) => {
			return v.sessionId;
		});
	if (sessionsIds.length === 0) {
		console.error("No free sessions");
		return "";
	}

	const sessionId = sessionsIds[Math.floor(Math.random() * sessionsIds.length)];
	console.info(`Selected session: ${sessionId}`);

	return sessionId;
}
