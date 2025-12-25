# mcp-web-fetch

MCP server that fetches web pages with full JavaScript rendering and stealth measures to avoid bot detection.

## Features

- Full JavaScript rendering via Playwright
- Stealth mode (puppeteer-extra-plugin-stealth) to avoid captchas
- Randomized user agents and viewports
- Bypasses robots.txt
- Returns raw HTML after JS execution
- HTTP/SSE transport for remote deployment

## Installation

```bash
npm install
npx playwright install chromium
npm run build
```

## Running

```bash
npm start
# or with custom port
PORT=8080 npm start
```

Default port is 3000.

## Usage with claude.ai

In claude.ai's MCP settings, add your server URL:

```
https://your-server.example.com/sse
```

## Endpoints

- `GET /sse` - SSE endpoint for MCP connection
- `POST /messages` - Message handler for MCP
- `GET /health` - Health check

## Tool

### fetch

Fetches a URL and returns the fully rendered HTML.

**Parameters:**
- `url` (string, required): The URL to fetch
- `waitTime` (number, optional): Time in ms to wait after page load for JS to execute (default: 3000)

**Returns:** The fully rendered HTML content as text.
