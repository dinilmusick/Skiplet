/** Fetch-first transport usable in browsers and serverless runtimes. */
export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return response.json() as Promise<T>;
}
