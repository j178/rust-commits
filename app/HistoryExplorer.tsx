"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  HistoryItem,
  HistoryResponse,
  RollupEntry,
} from "./lib/history";

const RUST_REPO = "https://github.com/rust-lang/rust";

const firstRollup: RollupEntry[] = [
  { pr: 158404, title: "trait_solver: normalize next-gen region constraints", status: "merged" },
  { pr: 160631, title: "Do not eagerly download rustfmt in bootstrap", status: "merged" },
  { pr: 160642, title: "mir: prohibit projection into scalable vec", status: "merged" },
  { pr: 160749, title: "MaybeDangling: ensure references fit inside the address space", status: "merged" },
  { pr: 160791, title: "Use recognizer functions for enums and tuple structs", status: "merged" },
  { pr: 160500, title: "Fix inaccurate description for crate and pathroot", status: "merged" },
  { pr: 160590, title: "Docs & bors: Replace mentions of libs-api with libs", status: "merged" },
  { pr: 160825, title: "Fix references to unsupported on sys::paths::unix", status: "merged" },
  { pr: 160852, title: "Use remove_dir_all for ./x clean", status: "merged" },
  { pr: 160829, title: "bootstrap: Make main.rs a stub that calls into the library crate", status: "failed" },
];

const fallbackItems: HistoryItem[] = [
  {
    sha: "fdda4c6a308e5ae5514757601fd41b2268665ce7",
    date: "2026-08-10T22:02:56Z",
    headline: "Auto merge of #160801 - nnethercote:new-solver-probes, r=jdonszelmann",
    title: "Optimize new solver unification table ops",
    message: "Auto merge of #160801 - nnethercote:new-solver-probes, r=jdonszelmann\n\nOptimize new solver unification table ops",
    pr: 160801,
    source: "nnethercote:new-solver-probes",
    author: "nnethercote",
    reviewers: ["jdonszelmann"],
    url: `${RUST_REPO}/commit/fdda4c6a308e5ae5514757601fd41b2268665ce7`,
    kind: "merge",
    rollupCount: 0,
    rollup: [],
  },
  {
    sha: "12c36e2539c54397c51d6ea4401defd8768a4f5b",
    date: "2026-08-10T18:52:47Z",
    headline: "Auto merge of #160867 - JonathanBrouwer:rollup-bas1App, r=JonathanBrouwer",
    title: "Rollup of 9 pull requests",
    message: "Auto merge of #160867 - JonathanBrouwer:rollup-bas1App, r=JonathanBrouwer\n\nRollup of 9 pull requests",
    pr: 160867,
    source: "JonathanBrouwer:rollup-bas1App",
    author: "JonathanBrouwer",
    reviewers: ["JonathanBrouwer"],
    url: `${RUST_REPO}/commit/12c36e2539c54397c51d6ea4401defd8768a4f5b`,
    kind: "rollup",
    rollupCount: 9,
    rollup: firstRollup,
  },
  {
    sha: "ef20314466010b8b9259ec5f86230c530ca08661",
    date: "2026-08-10T15:41:56Z",
    headline: "Auto merge of #160645 - Kobzol:bootstrap-llvm, r=jieyouxu",
    title: "Assorted bootstrap LLVM refactors (part 1/N)",
    message: "Auto merge of #160645 - Kobzol:bootstrap-llvm, r=jieyouxu\n\nAssorted bootstrap LLVM refactors (part 1/N)",
    pr: 160645,
    source: "Kobzol:bootstrap-llvm",
    author: "Kobzol",
    reviewers: ["jieyouxu"],
    url: `${RUST_REPO}/commit/ef20314466010b8b9259ec5f86230c530ca08661`,
    kind: "merge",
    rollupCount: 0,
    rollup: [],
  },
  {
    sha: "ea060423749bf6e561c3398f403425c502beb9ba",
    date: "2026-08-10T12:35:33Z",
    headline: "Auto merge of #160849 - JonathanBrouwer:rollup-qb2wimf, r=JonathanBrouwer",
    title: "Rollup of 10 pull requests",
    message: "Auto merge of #160849 - JonathanBrouwer:rollup-qb2wimf, r=JonathanBrouwer\n\nRollup of 10 pull requests",
    pr: 160849,
    source: "JonathanBrouwer:rollup-qb2wimf",
    author: "JonathanBrouwer",
    reviewers: ["JonathanBrouwer"],
    url: `${RUST_REPO}/commit/ea060423749bf6e561c3398f403425c502beb9ba`,
    kind: "rollup",
    rollupCount: 10,
    rollup: [
      { pr: 160841, title: "rust-analyzer subtree update", status: "merged" },
      { pr: 160253, title: "Add CI job for checking stdlib semver compatibility", status: "merged" },
      { pr: 160216, title: "clean up handling of paths in mgca", status: "merged" },
      { pr: 160832, title: "Fix funding link", status: "merged" },
      { pr: 160833, title: "Remove analysis arg from ResultsVisitor methods", status: "merged" },
      { pr: 160834, title: "Update Enzyme submodule", status: "merged" },
      { pr: 160836, title: "Fix swapped documentation lines on io::Read", status: "merged" },
      { pr: 160839, title: "Stop updating npm lockfile by Renovatebot", status: "merged" },
      { pr: 160840, title: "Rename SmallCopyList to SmallCopySet", status: "merged" },
      { pr: 160846, title: "use rustc_attr_ir imports more", status: "merged" },
    ],
  },
  {
    sha: "7088e4b",
    date: "2026-08-10T09:29:58Z",
    headline: "Auto merge of #158447 - jdonszelmann:shallow-resolve-to-root-var, r=lcnr",
    title: "Shallow resolve ty and const vars to their root vars, attempt 2",
    message: "Auto merge of #158447 - jdonszelmann:shallow-resolve-to-root-var, r=lcnr\n\nShallow resolve ty and const vars to their root vars, attempt 2",
    pr: 158447,
    source: "jdonszelmann:shallow-resolve-to-root-var",
    author: "jdonszelmann",
    reviewers: ["lcnr"],
    url: `${RUST_REPO}/commit/7088e4b`,
    kind: "merge",
    rollupCount: 0,
    rollup: [],
  },
];

const dayFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const timeFormatter = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

function dayKey(date: string) {
  return date.slice(0, 10);
}

function matchesQuery(item: HistoryItem, query: string) {
  if (!query) return true;
  const searchable = [
    item.title,
    item.headline,
    item.message,
    item.sha,
    item.author,
    item.source ?? "",
    item.pr?.toString() ?? "",
    ...item.reviewers,
    ...item.rollup.flatMap((entry) => [entry.title, entry.pr.toString()]),
  ]
    .join(" ")
    .toLowerCase();
  return searchable.includes(query);
}

function ExternalArrow() {
  return <span aria-hidden="true">↗</span>;
}

function displayCommitMessage(item: HistoryItem) {
  if (item.kind !== "rollup") return item.message;

  const structuredList = item.message.search(/^(?:Successful|Failed) merges:\s*$/m);
  return structuredList >= 0 ? item.message.slice(0, structuredList).trimEnd() : item.message;
}

function CommitMessage({ item }: { item: HistoryItem }) {
  return (
    <details className="commit-message">
      <summary>
        <span className="message-chevron" aria-hidden="true" />
        Commit message
      </summary>
      <pre>{displayCommitMessage(item)}</pre>
    </details>
  );
}

function CommitMeta({ item }: { item: HistoryItem }) {
  return (
    <div className="commit-meta">
      <span className="identity">
        <span className="avatar" aria-hidden="true">
          {item.author.slice(0, 1).toUpperCase()}
        </span>
        <strong>{item.author}</strong>
      </span>
      <span className="meta-separator">→</span>
      <span>main</span>
      {item.reviewers.length > 0 && (
        <>
          <span className="meta-separator">·</span>
          <span>
            reviewed by <strong>{item.reviewers.join(", ")}</strong>
          </span>
        </>
      )}
    </div>
  );
}

function RollupList({ item }: { item: HistoryItem }) {
  const successful = item.rollup.filter((entry) => entry.status === "merged");
  const failed = item.rollup.filter((entry) => entry.status === "failed");

  return (
    <details className="rollup-details">
      <summary>
        <span className="summary-label">
          <span className="expand-mark" aria-hidden="true" />
          Included pull requests
        </span>
        <span className="summary-hint">
          {successful.length || item.rollupCount} merged
          {failed.length > 0 ? ` · ${failed.length} excluded` : ""}
        </span>
      </summary>
      <div className="rollup-list">
        {successful.map((entry, index) => (
          <a
            className="rollup-entry"
            href={`${RUST_REPO}/pull/${entry.pr}`}
            target="_blank"
            rel="noreferrer"
            key={entry.pr}
          >
            <span className="rollup-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="rollup-copy">
              <strong>{entry.title}</strong>
              <span>PR #{entry.pr}</span>
            </span>
            <ExternalArrow />
          </a>
        ))}
        {failed.map((entry) => (
          <a
            className="rollup-entry failed"
            href={`${RUST_REPO}/pull/${entry.pr}`}
            target="_blank"
            rel="noreferrer"
            key={entry.pr}
          >
            <span className="rollup-index">×</span>
            <span className="rollup-copy">
              <strong>{entry.title}</strong>
              <span>PR #{entry.pr} · not included</span>
            </span>
            <ExternalArrow />
          </a>
        ))}
      </div>
    </details>
  );
}

function CommitCard({ item }: { item: HistoryItem }) {
  const isRollup = item.kind === "rollup";

  return (
    <article className={`commit-card ${isRollup ? "is-rollup" : ""}`}>
      <span className="timeline-node" aria-hidden="true" />
      <div className="commit-card-topline">
        <div className="badges">
          <span className={`badge ${isRollup ? "rollup-badge" : ""}`}>
            {isRollup ? "rollup" : item.kind === "direct" ? "direct" : "merge"}
          </span>
        </div>
        <span className="commit-time">{timeFormatter.format(new Date(item.date))} UTC</span>
      </div>

      <div className="commit-heading">
        <div>
          <p className="pr-label">
            <span>{item.pr ? `${isRollup ? "ROLLUP PR" : "PR"} #${item.pr}` : "MAINLINE COMMIT"}</span>
            <a
              className="commit-ref"
              href={item.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open commit ${item.sha.slice(0, 7)} on GitHub`}
            >
              {item.sha.slice(0, 7)}
            </a>
          </p>
          <h2>{item.title}</h2>
        </div>
        <a
          className="open-commit"
          href={item.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open commit ${item.sha.slice(0, 7)} on GitHub`}
        >
          <ExternalArrow />
        </a>
      </div>

      <CommitMeta item={item} />

      {isRollup && <RollupList item={item} />}

      <div className="commit-footer">
        <CommitMessage item={item} />
      </div>
    </article>
  );
}

export function HistoryExplorer() {
  const [items, setItems] = useState<HistoryItem[]>(fallbackItems);
  const [nextSha, setNextSha] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [foldedCount, setFoldedCount] = useState(95);
  const [status, setStatus] = useState<"loading" | "live" | "snapshot" | "loading-more">("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadLatest() {
      try {
        const response = await fetch("/api/history?limit=9", { signal: controller.signal });
        if (!response.ok) throw new Error("History request failed");
        const data = (await response.json()) as HistoryResponse;
        if (data.items.length > 0) {
          setItems(data.items);
          setNextSha(data.nextSha);
          setFoldedCount(data.foldedCount);
          setStatus("live");
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setStatus("snapshot");
        }
      }
    }

    loadLatest();
    return () => controller.abort();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = useMemo(
    () => items.filter((item) => matchesQuery(item, normalizedQuery)),
    [items, normalizedQuery],
  );

  const rollupPrs = items.reduce((count, item) => count + item.rollupCount, 0);

  async function loadOlder() {
    if (!nextSha || status === "loading-more") return;
    setStatus("loading-more");

    try {
      const response = await fetch(`/api/history?limit=9&sha=${nextSha}`);
      if (!response.ok) throw new Error("History request failed");
      const data = (await response.json()) as HistoryResponse;
      setItems((current) => {
        const known = new Set(current.map((item) => item.sha));
        return [...current, ...data.items.filter((item) => !known.has(item.sha))];
      });
      setNextSha(data.nextSha);
      setFoldedCount((current) => current + data.foldedCount);
      setStatus("live");
    } catch {
      setStatus("snapshot");
    }
  }

  let previousDay = "";

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Rust Mainline home">
          <span className="wordmark-mark" aria-hidden="true">R</span>
          <span>RUST / MAINLINE</span>
        </a>
        <a className="repo-link" href={RUST_REPO} target="_blank" rel="noreferrer">
          rust-lang/rust <ExternalArrow />
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> FIRST-PARENT VIEW</p>
          <h1>
            The history Rust
            <br />
            <em>actually shipped.</em>
          </h1>
          <p className="hero-description">
            One clean line per merged PR. Rollups unfold on demand; every noisy inner commit stays folded away.
          </p>
        </div>
        <div className="hero-diagram" aria-label="A diagram showing noisy commits folded into a clean mainline">
          <div className="diagram-label top">HEAD <span>main</span></div>
          <div className="diagram-line" />
          <span className="diagram-node node-one" />
          <span className="diagram-node node-two" />
          <span className="diagram-node node-three" />
          <div className="folded-branch">
            <span /><span /><span /><span />
          </div>
          <div className="diagram-label bottom">FIRST PARENT</div>
        </div>
      </section>

      <section className="history-shell" aria-labelledby="history-title">
        <div className="history-intro">
          <div>
            <p className="section-kicker">THE LOG, MINUS THE NOISE</p>
            <h2 id="history-title">Mainline history</h2>
          </div>
          <div className="history-stats" aria-label="Loaded history statistics">
            <div><strong>{items.length}</strong><span>mainline merges</span></div>
            <div><strong>{rollupPrs}</strong><span>PRs in rollups</span></div>
            <div><strong>{foldedCount}</strong><span>inner commits folded</span></div>
          </div>
        </div>

        <div className="toolbar">
          <label className="search-field">
            <span className="visually-hidden">Search loaded commits</span>
            <span aria-hidden="true" className="search-icon">⌕</span>
            <input
              type="search"
              placeholder="Search PR, author, title, SHA…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>
            )}
          </label>
          <div className="view-rules" aria-label="Active history rules">
            <span><b>✓</b> first parent</span>
            <span><b>✓</b> inner commits folded</span>
          </div>
          <div className={`live-status ${status === "snapshot" ? "is-snapshot" : ""}`} aria-live="polite">
            <span />
            {status === "loading" ? "syncing" : status === "snapshot" ? "cached snapshot" : "live from GitHub"}
          </div>
        </div>

        <div className="timeline">
          {filteredItems.map((item) => {
            const currentDay = dayKey(item.date);
            const showDay = currentDay !== previousDay;
            previousDay = currentDay;
            return (
              <div className="timeline-entry" key={item.sha}>
                {showDay && (
                  <div className="day-label">
                    <span>{dayFormatter.format(new Date(item.date))}</span>
                    <i />
                  </div>
                )}
                <CommitCard item={item} />
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="empty-state">
              <span aria-hidden="true">∅</span>
              <h3>No loaded merge matches “{query}”</h3>
              <p>Try a PR number, contributor, reviewer, title, or commit SHA.</p>
              <button type="button" onClick={() => setQuery("")}>Clear search</button>
            </div>
          )}
        </div>

        {!normalizedQuery && nextSha && (
          <div className="load-more-wrap">
            <button
              className="load-more"
              type="button"
              onClick={loadOlder}
              disabled={status === "loading-more"}
            >
              <span>{status === "loading-more" ? "Loading…" : "Load older mainline commits"}</span>
              <b aria-hidden="true">↓</b>
            </button>
          </div>
        )}
      </section>

      <footer>
        <p>Derived from rust-lang/rust’s first-parent chain. Not affiliated with the Rust project.</p>
        <p>GitHub data · refreshed at the edge</p>
      </footer>
    </main>
  );
}
