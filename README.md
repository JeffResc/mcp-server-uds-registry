# UDS Registry MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with access to the [UDS (Unicorn Delivery Service) Registry](https://registry.defenseunicorns.com). This server runs on Cloudflare Workers and offers tools for browsing UDS packages, retrieving metadata, SBOM information, and CVE data.

## Features

The server provides four main tools:

- **catalog**: Browse the complete catalog of UDS organizations and packages
- **package**: Get detailed information about specific UDS packages
- **sbom**: Retrieve Software Bill of Materials (SBOM) for specific package versions
- **cves**: Access CVE (Common Vulnerabilities and Exposures) information for package versions

## Deployment

This server is deployed at: `https://mcp-server-uds-registry.jeffrescignano.io`

To deploy your own instance:

```bash
npm install
npm run deploy
```

## Usage

Visit the root URL for detailed installation instructions for various AI tools: [https://mcp-server-uds-registry.jeffrescignano.io](https://mcp-server-uds-registry.jeffrescignano.io)

### Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "uds-registry": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-fetch",
        "https://mcp-server-uds-registry.jeffrescignano.io/mcp"
      ]
    }
  }
}
```

### Claude Code

```bash
claude config mcp add uds-registry \
  --command "npx" \
  --args "@modelcontextprotocol/server-fetch" "https://mcp-server-uds-registry.jeffrescignano.io/mcp"
```

## Available Endpoints

- `/` - Documentation and installation instructions
- `/mcp` - Standard MCP protocol endpoint
- `/sse` - Server-Sent Events endpoint for MCP

## Example Queries

Once configured, you can ask your AI assistant:

- "Show me the UDS catalog"
- "Get information about the gitlab package from defenseunicorns"
- "Check the SBOM for pepr version 0.32.6-uds.0"
- "What CVEs affect istio-controlplane version 1.22.3-uds.0?"

## Development

```bash
pnpm install
pnpm run dev
```

This will start a local development server at `http://localhost:8787`. 

## Employment Disclosure
Although I am currently employed by [Defense Unicorns](https://defenseunicorns.com/), this project is not affiliated with the company or an officially supported product.
