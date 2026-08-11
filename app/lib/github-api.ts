const GITHUB_API_HEADERS: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "User-Agent": "rust-mainline-history",
  "X-GitHub-Api-Version": "2022-11-28",
};

export async function fetchGitHubJson<T>(url: string | URL): Promise<T> {
  const headers = { ...GITHUB_API_HEADERS };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    if (response.status === 403 && remaining === "0") {
      throw new Error("GitHub rate limit reached. Please try again shortly.");
    }
    throw new Error(`GitHub returned ${response.status}.`);
  }

  return (await response.json()) as T;
}
