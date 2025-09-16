import { McpAgent } from "agents/mcp";
import { AgentContext } from "agents";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchJson } from "./lib.js";
import z from "zod";
import template from "./template.html";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "UDS Registry",
		version: "1.0.0",
	});

	env: Env;
	private initialized = false;

	constructor(ctx: AgentContext, env: Env) {
		super(ctx, env);
		this.env = env;
	}

	async init() {
		if (this.initialized) return;
		this.initialized = true;
		this.server.registerTool(
			"catalog",
			{
				title: "Catalog",
				description: "Catalog of UDS organizations and packages",
			},
			async ({}) => {
				const catalogData = await fetchJson("/uds/catalog", this.env);

				// Remove icon field from nested catalog data
				const filteredData = { ...catalogData };
				if (filteredData.catalog) {
					Object.keys(filteredData.catalog).forEach(orgKey => {
						if (filteredData.catalog[orgKey].repos && Array.isArray(filteredData.catalog[orgKey].repos)) {
							filteredData.catalog[orgKey].repos = filteredData.catalog[orgKey].repos.map((repo: any) => {
								const { icon, ...repoWithoutIcon } = repo;
								return repoWithoutIcon;
							});
						}
					});
				}

				return {
					content: [{
						type: "text",
						mimeType: "application/json",
						text: JSON.stringify(filteredData),
					}]
				};
			}
		);

		this.server.registerTool(
			"package",
			{
				title: "Package",
				description: "Description of a UDS package",
				inputSchema: z.object({
					organizationName: z.string(),
					packageName: z.string()
				}).shape
			},
			async ({ organizationName, packageName }) => {
				const packageData = await fetchJson(`/uds/metadata/${organizationName}/${packageName}`, this.env);

				return {
					content: [{
						type: "text",
						mimeType: "application/json",
						text: JSON.stringify(packageData),
					}]
				};
			}
		);

		this.server.registerTool(
			"sbom",
			{
				title: "SBOM",
				description: "SBOM information on a specific UDS package given an organization name, package name, version tag and architecture. Version tag should be of the form x.y.z-uds.a without the flavor or architecture.",
				inputSchema: z.object({
					organizationName: z.string(),
					packageName: z.string(),
					versionTag: z.string(),
					flavor: z.string(),
					architecture: z.string()
				}).shape
			},
			async ({ organizationName, packageName, versionTag, flavor, architecture }) => {
				const packageData = await fetchJson(`/uds/artifacts/${organizationName}/${packageName}/${versionTag}-${flavor}-${architecture}/sbom`, this.env);

				return {
					content: [{
						type: "text",
						mimeType: "application/json",
						text: JSON.stringify(packageData),
					}]
				};
			}
		);

		this.server.registerTool(
			"cves",
			{
				title: "CVES",
				description: "CVE information on a specific UDS package given an organization name, package name, version tag and architecture. Version tag should be of the form x.y.z-uds.a without the flavor or architecture.",
				inputSchema: z.object({
					organizationName: z.string(),
					packageName: z.string(),
					versionTag: z.string(),
					flavor: z.string(),
					architecture: z.string()
				}).shape
			},
			async ({ organizationName, packageName, versionTag, flavor, architecture }) => {
				const packageData = await fetchJson(`/uds/artifacts/${organizationName}/${packageName}/${versionTag}-${flavor}-${architecture}/cves`, this.env);

				return {
					content: [{
						type: "text",
						mimeType: "application/json",
						text: JSON.stringify(packageData),
					}]
				};
			}
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/") {
			const baseUrl = `${url.protocol}//${url.host}`;
			const html = template.replace(/{{BASE_URL}}/g, baseUrl);
			return new Response(html, {
				headers: { "Content-Type": "text/html" }
			});
		}

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
