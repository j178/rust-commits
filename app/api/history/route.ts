import {
  parseCommit,
  type GitHubCommit,
  type HistoryItem,
  type HistoryResponse,
} from "@/app/lib/history";

const GITHUB_COMMITS_URL = "https://api.github.com/repos/rust-lang/rust/commits";
const MAX_BATCHES = 3;

async function fetchCommitBatch(ref: string): Promise<GitHubCommit[]> {
  const url = new URL(GITHUB_COMMITS_URL);
  url.searchParams.set("sha", ref);
  url.searchParams.set("per_page", "100");

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "rust-mainline-history",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    if (response.status === 403 && remaining === "0") {
      throw new Error("GitHub rate limit reached. Please try again shortly.");
    }
    throw new Error(`GitHub returned ${response.status}.`);
  }

  return (await response.json()) as GitHubCommit[];
}

function isValidRef(ref: string) {
  return ref === "main" || /^[0-9a-f]{7,40}$/i.test(ref);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestedRef = requestUrl.searchParams.get("sha") ?? "main";
  const requestedLimit = Number(requestUrl.searchParams.get("limit") ?? 9);

  if (!isValidRef(requestedRef)) {
    return Response.json({ error: "Invalid commit reference." }, { status: 400 });
  }

  const limit = Math.max(1, Math.min(15, requestedLimit || 9));
  const items: HistoryItem[] = [];
  const traversed = new Set<string>();
  const fetched = new Set<string>();
  let cursor = requestedRef;
  let nextSha: string | null = null;

  try {
    batchLoop: for (let batchIndex = 0; batchIndex < MAX_BATCHES; batchIndex += 1) {
      const batch = await fetchCommitBatch(cursor);
      if (batch.length === 0) break;

      const bySha = new Map(batch.map((commit) => [commit.sha, commit]));
      batch.forEach((commit) => fetched.add(commit.sha));

      let current = bySha.get(cursor) ?? batch[0];

      while (current && !traversed.has(current.sha)) {
        traversed.add(current.sha);
        items.push(parseCommit(current));

        const parentSha = current.parents[0]?.sha ?? null;
        nextSha = parentSha;

        if (items.length >= limit || !parentSha) {
          break batchLoop;
        }

        const parent = bySha.get(parentSha);
        if (!parent) {
          cursor = parentSha;
          continue batchLoop;
        }

        current = parent;
      }

      break;
    }

    const payload: HistoryResponse = {
      items,
      nextSha,
      foldedCount: Math.max(0, fetched.size - traversed.size),
      fetchedAt: new Date().toISOString(),
    };

    return Response.json(payload, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load history.";
    return Response.json(
      { error: message },
      {
        status: 503,
        headers: { "Cache-Control": "public, max-age=30" },
      },
    );
  }
}
