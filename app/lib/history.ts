export type RollupEntry = {
  pr: number;
  title: string;
  status: "merged" | "failed";
};

export type HistoryItem = {
  sha: string;
  date: string;
  headline: string;
  title: string;
  message: string;
  pr: number | null;
  source: string | null;
  author: string;
  reviewers: string[];
  url: string;
  kind: "merge" | "rollup" | "direct";
  rollupCount: number;
  rollup: RollupEntry[];
};

export type HistoryResponse = {
  items: HistoryItem[];
  nextSha: string | null;
  foldedCount: number;
  fetchedAt: string;
};

export type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  parents: Array<{ sha: string }>;
};

const AUTO_MERGE_RE = /^Auto merge of #(\d+) - (.+?), r=(.+)$/;
const ROLLUP_RE = /^Rollup of (\d+) pull requests$/m;
const ROLLUP_ENTRY_RE = /^\s*-\s+rust-lang\/rust#(\d+)\s+\((.*)\)\s*$/;

function firstBodyLine(lines: string[]) {
  return lines.slice(1).find((line) => line.trim())?.trim() ?? lines[0];
}

function parseRollup(lines: string[]): RollupEntry[] {
  const entries: RollupEntry[] = [];
  let status: RollupEntry["status"] | null = null;

  for (const line of lines) {
    if (line.trim() === "Successful merges:") {
      status = "merged";
      continue;
    }

    if (line.trim() === "Failed merges:") {
      status = "failed";
      continue;
    }

    const match = line.match(ROLLUP_ENTRY_RE);
    if (status && match) {
      entries.push({
        pr: Number(match[1]),
        title: match[2].trim(),
        status,
      });
    }
  }

  return entries;
}

export function parseCommit(commit: GitHubCommit): HistoryItem {
  const message = commit.commit.message.replace(/\r/g, "").trim();
  const lines = message.split("\n");
  const headline = lines[0].trim();
  const merge = headline.match(AUTO_MERGE_RE);
  const rollup = parseRollup(lines);
  const rollupCount = Number(commit.commit.message.match(ROLLUP_RE)?.[1] ?? 0);

  if (!merge) {
    return {
      sha: commit.sha,
      date: commit.commit.author.date,
      headline,
      title: firstBodyLine(lines),
      message,
      pr: null,
      source: null,
      author: commit.commit.author.name,
      reviewers: [],
      url: commit.html_url,
      kind: "direct",
      rollupCount: 0,
      rollup: [],
    };
  }

  const source = merge[2].trim();
  const author = source.split(":", 1)[0];

  return {
    sha: commit.sha,
    date: commit.commit.author.date,
    headline,
    title: firstBodyLine(lines),
    message,
    pr: Number(merge[1]),
    source,
    author,
    reviewers: merge[3]
      .split(",")
      .map((reviewer) => reviewer.trim())
      .filter(Boolean),
    url: commit.html_url,
    kind: rollupCount > 0 ? "rollup" : "merge",
    rollupCount,
    rollup,
  };
}
