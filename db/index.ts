import { env } from "cloudflare:workers";
import type { GitHubCommit, PullRequestDetails } from "@/app/lib/history";

export type CachedCommitBatch = {
  commits: GitHubCommit[];
  fetchedAt: number;
};

type CommitRow = {
  sha: string;
  html_url: string;
  message: string;
  author_name: string;
  authored_at: string;
  parents_json: string;
};

type PageRow = {
  commit_shas_json: string;
  fetched_at: number;
};

type PullRequestRow = {
  number: number;
  html_url: string;
  title: string;
  body: string;
  author_login: string;
};

function database() {
  return env.DB as D1Database | undefined;
}

function rowToCommit(row: CommitRow): GitHubCommit | null {
  let parentShas: unknown;
  try {
    parentShas = JSON.parse(row.parents_json);
  } catch {
    return null;
  }

  if (!Array.isArray(parentShas) || !parentShas.every((sha) => typeof sha === "string")) {
    return null;
  }

  return {
    sha: row.sha,
    html_url: row.html_url,
    commit: {
      message: row.message,
      author: {
        name: row.author_name,
        date: row.authored_at,
      },
    },
    parents: parentShas.map((sha) => ({ sha })),
  };
}

export async function readCachedCommitBatch(ref: string): Promise<CachedCommitBatch | null> {
  const db = database();
  if (!db) return null;

  const page = await db
    .prepare("SELECT commit_shas_json, fetched_at FROM github_commit_pages WHERE ref = ?")
    .bind(ref)
    .first<PageRow>();
  if (!page) return null;

  let commitShas: unknown;
  try {
    commitShas = JSON.parse(page.commit_shas_json);
  } catch {
    return null;
  }

  if (!Array.isArray(commitShas) || commitShas.length === 0) return null;
  if (!commitShas.every((sha) => typeof sha === "string")) return null;

  const placeholders = commitShas.map(() => "?").join(", ");
  const result = await db
    .prepare(
      `SELECT sha, html_url, message, author_name, authored_at, parents_json
       FROM github_commits
       WHERE sha IN (${placeholders})`,
    )
    .bind(...commitShas)
    .all<CommitRow>();

  const commitsBySha = new Map<string, GitHubCommit>();
  for (const row of result.results) {
    const commit = rowToCommit(row);
    if (commit) commitsBySha.set(commit.sha, commit);
  }

  const commits = commitShas.flatMap((sha) => {
    const commit = commitsBySha.get(sha);
    return commit ? [commit] : [];
  });

  return commits.length === commitShas.length
    ? { commits, fetchedAt: page.fetched_at }
    : null;
}

export async function writeCachedCommitBatch(
  ref: string,
  commits: GitHubCommit[],
  fetchedAt: number,
): Promise<void> {
  const db = database();
  if (!db || commits.length === 0) return;

  const statements = commits.map((commit) =>
    db
      .prepare(
        `INSERT INTO github_commits
           (sha, html_url, message, author_name, authored_at, parents_json, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(sha) DO NOTHING`,
      )
      .bind(
        commit.sha,
        commit.html_url,
        commit.commit.message,
        commit.commit.author.name,
        commit.commit.author.date,
        JSON.stringify(commit.parents.map((parent) => parent.sha)),
        fetchedAt,
      ),
  );

  for (let offset = 0; offset < statements.length; offset += 50) {
    await db.batch(statements.slice(offset, offset + 50));
  }

  await db
    .prepare(
      `INSERT INTO github_commit_pages (ref, commit_shas_json, fetched_at)
       VALUES (?, ?, ?)
       ON CONFLICT(ref) DO UPDATE SET
         commit_shas_json = excluded.commit_shas_json,
         fetched_at = excluded.fetched_at`,
    )
    .bind(ref, JSON.stringify(commits.map((commit) => commit.sha)), fetchedAt)
    .run();
}

export async function readCachedPullRequest(number: number): Promise<PullRequestDetails | null> {
  const db = database();
  if (!db) return null;

  const row = await db
    .prepare(
      `SELECT number, html_url, title, body, author_login
       FROM github_pull_requests
       WHERE number = ?`,
    )
    .bind(number)
    .first<PullRequestRow>();

  return row
    ? {
        number: row.number,
        title: row.title,
        body: row.body,
        author: row.author_login,
        url: row.html_url,
      }
    : null;
}

export async function writeCachedPullRequest(
  pullRequest: PullRequestDetails,
  cachedAt: number,
): Promise<void> {
  const db = database();
  if (!db) return;

  await db
    .prepare(
      `INSERT INTO github_pull_requests
         (number, html_url, title, body, author_login, cached_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(number) DO NOTHING`,
    )
    .bind(
      pullRequest.number,
      pullRequest.url,
      pullRequest.title,
      pullRequest.body,
      pullRequest.author,
      cachedAt,
    )
    .run();
}
