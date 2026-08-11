import { fetchGitHubJson } from "@/app/lib/github-api";
import type { PullRequestDetails } from "@/app/lib/history";
import { readCachedPullRequest, writeCachedPullRequest } from "@/db";

const GITHUB_PULL_URL = "https://api.github.com/repos/rust-lang/rust/pulls";
const PULL_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=3600, s-maxage=604800, stale-while-revalidate=2592000",
};

type GitHubPullRequest = {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  user: {
    login: string;
  };
};

function cleanPullRequestBody(body: string | null) {
  if (!body) return "";

  const clean = body
    .replace(/<!--\s*homu-ignore:start\s*-->[\s\S]*?<!--\s*homu-ignore:end\s*-->/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\r/g, "")
    .trim();

  return clean.length > 1_200 ? `${clean.slice(0, 1_199).trimEnd()}…` : clean;
}

async function fetchGitHubPullRequest(number: number): Promise<PullRequestDetails> {
  const pullRequest = await fetchGitHubJson<GitHubPullRequest>(
    `${GITHUB_PULL_URL}/${number}`,
  );
  return {
    number: pullRequest.number,
    title: pullRequest.title,
    body: cleanPullRequestBody(pullRequest.body),
    author: pullRequest.user.login,
    url: pullRequest.html_url,
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const number = Number(requestUrl.searchParams.get("number"));

  if (!Number.isSafeInteger(number) || number <= 0) {
    return Response.json({ error: "Invalid pull request number." }, { status: 400 });
  }

  try {
    try {
      const cached = await readCachedPullRequest(number);
      if (cached) return Response.json(cached, { headers: PULL_CACHE_HEADERS });
    } catch (error) {
      console.warn("Unable to read the GitHub pull request cache.", error);
    }

    const pullRequest = await fetchGitHubPullRequest(number);
    try {
      await writeCachedPullRequest(pullRequest, Date.now());
    } catch (error) {
      console.warn("Unable to update the GitHub pull request cache.", error);
    }

    return Response.json(pullRequest, { headers: PULL_CACHE_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load pull request details.";
    return Response.json(
      { error: message },
      {
        status: 503,
        headers: { "Cache-Control": "public, max-age=30" },
      },
    );
  }
}
