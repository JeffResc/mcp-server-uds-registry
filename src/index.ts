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
				console.log('[catalog] Request received with no input data');
				try {
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
				} catch (error) {
					console.error('[catalog] Error occurred:', error);
					throw error;
				}
			}
		);

		this.server.registerTool(
			"package",
			{
				title: "Package",
				description: "Description of a UDS package",
				inputSchema: {
					organizationName: z.string(),
					packageName: z.string()
				}
			},
			async (args) => {
				console.log('[package] Request received with input:', JSON.stringify(args));
				try {
					const schema = z.object({
						organizationName: z.string().min(1, "Organization name is required"),
						packageName: z.string().min(1, "Package name is required")
					});

					const { organizationName, packageName } = schema.parse(args);
					const packageData = await fetchJson(`/uds/metadata/${organizationName}/${packageName}`, this.env);

					return {
						content: [{
							type: "text",
							mimeType: "application/json",
							text: JSON.stringify(packageData),
						}]
					};
				} catch (error) {
					if (error instanceof z.ZodError) {
						console.error('[package] Input validation error:', error.errors);
						return {
							content: [{
								type: "text",
								text: `Invalid input: ${error.errors.map(e => e.message).join(', ')}`
							}],
							isError: true
						};
					}
					console.error('[package] Error occurred:', error);
					throw error;
				}
			}
		);

		this.server.registerTool(
			"sbom",
			{
				title: "SBOM",
				description: "SBOM information on a specific UDS package given an organization name, package name, version tag and architecture. Version tag should be of the form x.y.z-uds.a without the flavor or architecture.",
				inputSchema: {
					organizationName: z.string(),
					packageName: z.string(),
					versionTag: z.string(),
					flavor: z.string(),
					architecture: z.string()
				}
			},
			async (args) => {
				console.log('[sbom] Request received with input:', JSON.stringify(args));
				try {
					const schema = z.object({
						organizationName: z.string().min(1, "Organization name is required"),
						packageName: z.string().min(1, "Package name is required"),
						versionTag: z.string().min(1, "Version tag is required"),
						flavor: z.string().min(1, "Flavor is required"),
						architecture: z.string().min(1, "Architecture is required")
					});

					const { organizationName, packageName, versionTag, flavor, architecture } = schema.parse(args);
					const packageData = await fetchJson(`/uds/artifacts/${organizationName}/${packageName}/${versionTag}-${flavor}-${architecture}/sbom`, this.env);

					return {
						content: [{
							type: "text",
							mimeType: "application/json",
							text: JSON.stringify(packageData),
						}]
					};
				} catch (error) {
					if (error instanceof z.ZodError) {
						console.error('[sbom] Input validation error:', error.errors);
						return {
							content: [{
								type: "text",
								text: `Invalid input: ${error.errors.map(e => e.message).join(', ')}`
							}],
							isError: true
						};
					}
					console.error('[sbom] Error occurred:', error);
					throw error;
				}
			}
		);

		this.server.registerTool(
			"cves",
			{
				title: "CVES",
				description: "CVE information on a specific UDS package given an organization name, package name, version tag and architecture. Version tag should be of the form x.y.z-uds.a without the flavor or architecture.",
				inputSchema: {
					organizationName: z.string(),
					packageName: z.string(),
					versionTag: z.string(),
					flavor: z.string(),
					architecture: z.string()
				}
			},
			async (args) => {
				console.log('[cves] Request received with input:', JSON.stringify(args));
				try {
					const schema = z.object({
						organizationName: z.string().min(1, "Organization name is required"),
						packageName: z.string().min(1, "Package name is required"),
						versionTag: z.string().min(1, "Version tag is required"),
						flavor: z.string().min(1, "Flavor is required"),
						architecture: z.string().min(1, "Architecture is required")
					});

					const { organizationName, packageName, versionTag, flavor, architecture } = schema.parse(args);
					const packageData = await fetchJson(`/uds/artifacts/${organizationName}/${packageName}/${versionTag}-${flavor}-${architecture}/cves`, this.env);

					return {
						content: [{
							type: "text",
							mimeType: "application/json",
							text: JSON.stringify(packageData),
						}]
					};
				} catch (error) {
					if (error instanceof z.ZodError) {
						console.error('[cves] Input validation error:', error.errors);
						return {
							content: [{
								type: "text",
								text: `Invalid input: ${error.errors.map(e => e.message).join(', ')}`
							}],
							isError: true
						};
					}
					console.error('[cves] Error occurred:', error);
					throw error;
				}
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
