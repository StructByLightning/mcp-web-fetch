#!/usr/bin/env node
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {chromium} from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {z} from "zod";

//Apply stealth plugin to playwright
chromium.use(StealthPlugin());

const server = new McpServer({
	name: "web-fetch",
	version: "1.0.0",
});

//Realistic user agents for rotation
const USER_AGENTS = [
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

//Common viewport sizes
const VIEWPORTS = [
	{width: 1920, height: 1080},
	{width: 1366, height: 768},
	{width: 1536, height: 864},
	{width: 1440, height: 900},
];

function getRandomElement<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchPage(url: string, waitTime: number = 3000): Promise<string> {
	const userAgent = getRandomElement(USER_AGENTS);
	const viewport = getRandomElement(VIEWPORTS);

	const browser = await chromium.launch({
		headless: true,
		args: [
			"--disable-blink-features=AutomationControlled",
			"--disable-features=IsolateOrigins,site-per-process",
			"--disable-site-isolation-trials",
			"--disable-web-security",
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-dev-shm-usage",
			"--disable-accelerated-2d-canvas",
			"--no-first-run",
			"--no-zygote",
			"--disable-gpu",
			"--ignore-certificate-errors",
		],
	});

	try {
		const context = await browser.newContext({
			userAgent,
			viewport,
			locale: "en-US",
			timezoneId: "America/New_York",
			geolocation: {latitude: 40.7128, longitude: -74.006},
			permissions: ["geolocation"],
			//Bypass robots.txt by not respecting it (Playwright doesn't check it anyway)
			bypassCSP: true,
			ignoreHTTPSErrors: true,
			javaScriptEnabled: true,
		});

		//Add extra headers to appear more human
		await context.setExtraHTTPHeaders({
			"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
			"Accept-Language": "en-US,en;q=0.9",
			"Accept-Encoding": "gzip, deflate, br",
			"Cache-Control": "no-cache",
			"Pragma": "no-cache",
			"Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
			"Sec-Ch-Ua-Mobile": "?0",
			"Sec-Ch-Ua-Platform": '"Windows"',
			"Sec-Fetch-Dest": "document",
			"Sec-Fetch-Mode": "navigate",
			"Sec-Fetch-Site": "none",
			"Sec-Fetch-User": "?1",
			"Upgrade-Insecure-Requests": "1",
		});

		const page = await context.newPage();

		//Remove webdriver property
		await page.addInitScript(() => {
			Object.defineProperty(navigator, "webdriver", {
				get: () => undefined,
			});

			//Override the plugins array
			Object.defineProperty(navigator, "plugins", {
				get: () => [1, 2, 3, 4, 5],
			});

			//Override languages
			Object.defineProperty(navigator, "languages", {
				get: () => ["en-US", "en"],
			});

			//Make chrome object exist
			(window as unknown as Record<string, unknown>).chrome = {
				runtime: {},
			};
		});

		//Navigate with realistic behavior
		await page.goto(url, {
			waitUntil: "networkidle",
			timeout: 30000,
		});

		//Wait for additional time to let JS execute
		await page.waitForTimeout(waitTime);

		//Get the fully rendered HTML
		const html = await page.content();

		await context.close();
		return html;
	} finally {
		await browser.close();
	}
}

server.tool(
	"fetch",
	"Fetches a URL and returns the fully rendered HTML content after JavaScript execution",
	{
		url: z.string().url().describe("The URL to fetch"),
		waitTime: z.number().optional().default(3000).describe("Time in ms to wait after page load for JS to execute (default: 3000)"),
	},
	async ({url, waitTime}) => {
		try {
			const html = await fetchPage(url, waitTime);
			return {
				content: [{type: "text", text: html}],
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return {
				content: [{type: "text", text: `Error fetching page: ${message}`}],
				isError: true,
			};
		}
	}
);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch(console.error);
