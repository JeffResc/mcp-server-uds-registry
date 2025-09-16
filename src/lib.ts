export async function fetchJson(path: string, env: Env): Promise<any> {
	const url = new URL(path, env.REGISTRY_URL);
	const response = await fetch(url.toString());

	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
	}

	return response.json();
}