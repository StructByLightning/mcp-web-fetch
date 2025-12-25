# mcp-web-fetch

MCP server that fetches web pages with full JavaScript rendering and stealth measures to avoid bot detection.

## Features

- Full JavaScript rendering via Playwright
- Stealth mode (puppeteer-extra-plugin-stealth) to avoid captchas
- Randomized user agents and viewports
- Bypasses robots.txt
- Returns raw HTML after JS execution

## Installation

```bash
npm install
npx playwright install chromium
npm run build
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "web-fetch": {
      "command": "node",
      "args": ["/path/to/mcp-web-fetch/dist/index.js"]
    }
  }
}
```

## Tool

### fetch

Fetches a URL and returns the fully rendered HTML.

**Parameters:**
- `url` (string, required): The URL to fetch
- `waitTime` (number, optional): Time in ms to wait after page load for JS to execute (default: 3000)

**Returns:** The fully rendered HTML content as text.
