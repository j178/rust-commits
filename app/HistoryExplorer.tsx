"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { fallbackItems } from "./lib/fallback-history";
import {
  RUST_REPO,
  type HistoryItem,
  type HistoryResponse,
  type PullRequestDetails,
  type RollupEntry,
} from "./lib/history";

const pullRequestDetailsCache = new Map<number, PullRequestDetails>();
const pullRequestDetailsRequests = new Map<number, Promise<PullRequestDetails>>();

const utcDayFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const localDayFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const utcTimeFormatter = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
  timeZoneName: "short",
});

const localTimeFormatter = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZoneName: "short",
});

const utcSyncFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
  timeZoneName: "short",
});

const localSyncFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZoneName: "short",
});

const subscribeToHydration = () => () => undefined;

function useBrowserTimeZone() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
}

function dayKey(date: string, browserTimeZone: boolean) {
  if (!browserTimeZone) return date.slice(0, 10);
  const value = new Date(date);
  return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;
}

function formatSyncTime(date: string, browserTimeZone: boolean) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return (browserTimeZone ? localSyncFormatter : utcSyncFormatter).format(value);
}

function matchesQuery(item: HistoryItem, query: string) {
  if (!query) return true;
  const searchable = [
    item.title,
    item.message,
    item.sha,
    item.author,
    item.pr?.toString() ?? "",
    ...item.reviewers,
    ...item.rollup.flatMap((entry) => [entry.title, entry.pr.toString()]),
  ]
    .join(" ")
    .toLowerCase();
  return searchable.includes(query);
}

function ExternalArrow() {
  return <span className="external-arrow" aria-hidden="true" />;
}

async function fetchHistoryPage(url: string, signal?: AbortSignal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("History request failed");
  return (await response.json()) as HistoryResponse;
}

async function requestPullRequestDetails(number: number) {
  const cached = pullRequestDetailsCache.get(number);
  if (cached) return cached;

  const pending = pullRequestDetailsRequests.get(number);
  if (pending) return pending;

  const request = fetch(`/api/pull?number=${number}`).then(async (response) => {
    if (!response.ok) throw new Error("Pull request details are unavailable.");
    const details = (await response.json()) as PullRequestDetails;
    pullRequestDetailsCache.set(number, details);
    return details;
  });
  pullRequestDetailsRequests.set(number, request);

  try {
    return await request;
  } finally {
    pullRequestDetailsRequests.delete(number);
  }
}

function DetailPopover({
  id,
  label,
  title,
  meta,
  body,
}: {
  id: string;
  label?: string;
  title?: string;
  meta?: string;
  body: string;
}) {
  return (
    <div className="detail-popover" id={id} role="tooltip">
      <div className="detail-panel">
        {label && <span className="detail-label">{label}</span>}
        {title && <strong className="detail-title">{title}</strong>}
        {meta && <span className="detail-meta">{meta}</span>}
        <pre>{body}</pre>
      </div>
    </div>
  );
}

function CommitTitle({ item }: { item: HistoryItem }) {
  const messageId = `commit-message-${item.sha}`;

  return (
    <div className="commit-title-preview">
      <h2>
        <button type="button" className="commit-message-trigger" aria-describedby={messageId}>
          {item.title}
        </button>
      </h2>
      <DetailPopover id={messageId} body={item.message} />
    </div>
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

function RollupEntryLink({
  entry,
  indexLabel,
  rollupPr,
}: {
  entry: RollupEntry;
  indexLabel: string;
  rollupPr: number | null;
}) {
  const cached = pullRequestDetailsCache.get(entry.pr) ?? null;
  const [details, setDetails] = useState<PullRequestDetails | null>(cached);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">("idle");
  const detailsId = `pull-details-${rollupPr ?? "rollup"}-${entry.pr}`;

  function loadDetails() {
    if (details || loadState === "loading") return;
    setLoadState("loading");
    void requestPullRequestDetails(entry.pr)
      .then((value) => {
        setDetails(value);
        setLoadState("idle");
      })
      .catch(() => setLoadState("error"));
  }

  const detailBody = details
    ? details.body || "No PR description was provided."
    : loadState === "error"
      ? "PR details are currently unavailable. Open the PR on GitHub for the full context."
      : "Loading PR details…";

  return (
    <a
      className={`rollup-entry ${entry.status === "failed" ? "failed" : ""}`}
      href={`${RUST_REPO}/pull/${entry.pr}`}
      target="_blank"
      rel="noreferrer"
      aria-describedby={detailsId}
      onMouseEnter={loadDetails}
      onFocus={loadDetails}
    >
      <span className="rollup-index">{indexLabel}</span>
      <span className="rollup-copy">
        <strong>{entry.title}</strong>
        <span>PR #{entry.pr}</span>
      </span>
      <DetailPopover
        id={detailsId}
        label={entry.status === "failed" ? "Failed candidate" : undefined}
        title={details?.title ?? entry.title}
        meta={details ? `PR #${entry.pr} · @${details.author}` : `PR #${entry.pr}`}
        body={detailBody}
      />
      <ExternalArrow />
    </a>
  );
}

function RollupList({ item }: { item: HistoryItem }) {
  const successful = item.rollup.filter((entry) => entry.status === "merged");
  const failed = item.rollup.filter((entry) => entry.status === "failed");
  const includedCount = successful.length || item.rollupCount;
  const includedLabel = `${includedCount} pull request${includedCount === 1 ? "" : "s"} included`;
  const failedLabel = `${failed.length} failed candidate${failed.length === 1 ? " was" : "s were"} left out`;

  return (
    <details className="rollup-details">
      <summary
        aria-label={`${includedLabel}. ${failed.length > 0 ? failedLabel : "Combined into this mainline commit"}`}
      >
        <span className="summary-label">
          <span className="expand-mark" aria-hidden="true" />
          <strong>{includedLabel}</strong>
        </span>
      </summary>
      <div className="rollup-list">
        {successful.map((entry, index) => (
          <RollupEntryLink
            key={entry.pr}
            entry={entry}
            indexLabel={String(index + 1).padStart(2, "0")}
            rollupPr={item.pr}
          />
        ))}
        {failed.length > 0 && (
          <div className="rollup-list-divider">Failed candidates · not in this commit</div>
        )}
        {failed.map((entry) => (
          <RollupEntryLink
            key={entry.pr}
            entry={entry}
            indexLabel="×"
            rollupPr={item.pr}
          />
        ))}
      </div>
    </details>
  );
}

function CommitCard({
  item,
  browserTimeZone,
}: {
  item: HistoryItem;
  browserTimeZone: boolean;
}) {
  const isRollup = item.kind === "rollup";
  const commitTime = (browserTimeZone ? localTimeFormatter : utcTimeFormatter).format(
    new Date(item.date),
  );

  return (
    <article className={`commit-card ${isRollup ? "is-rollup" : ""}`}>
      <span className="timeline-node" aria-hidden="true" />
      <div className="commit-heading">
        <div className="commit-heading-copy">
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
          {isRollup ? <RollupList item={item} /> : <CommitTitle item={item} />}
        </div>
        <div className="commit-heading-actions">
          <time className="commit-time" dateTime={item.date}>{commitTime}</time>
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
      </div>

      <CommitMeta item={item} />
    </article>
  );
}

export function HistoryExplorer() {
  const browserTimeZone = useBrowserTimeZone();
  const [items, setItems] = useState<HistoryItem[]>(fallbackItems);
  const [nextSha, setNextSha] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "live" | "snapshot" | "loading-more">("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadLatest() {
      try {
        const data = await fetchHistoryPage("/api/history?limit=9", controller.signal);
        if (data.items.length > 0) {
          setItems(data.items);
          setNextSha(data.nextSha);
          setLastSyncAt(data.fetchedAt);
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
  const lastSyncTime = lastSyncAt ? formatSyncTime(lastSyncAt, browserTimeZone) : null;
  const syncLabel = status === "loading"
    ? "Syncing GitHub"
    : status === "snapshot"
      ? "Cached snapshot"
      : "GitHub synced";

  async function loadOlder() {
    if (!nextSha || status === "loading-more") return;
    setStatus("loading-more");

    try {
      const data = await fetchHistoryPage(`/api/history?limit=9&sha=${nextSha}`);
      setItems((current) => {
        const known = new Set(current.map((item) => item.sha));
        return [...current, ...data.items.filter((item) => !known.has(item.sha))];
      });
      setNextSha(data.nextSha);
      setStatus("live");
    } catch {
      setStatus("snapshot");
    }
  }

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
          <p className="eyebrow"><span /> FIRST-PARENT HISTORY</p>
          <h1 className="hero-title">
            <span>Rust,</span>
            <em>on main.</em>
          </h1>
          <p className="hero-description">
            Merged PRs without the inner-commit noise. Rollups unfold on demand.
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
          <div className={`live-status ${status === "snapshot" ? "is-snapshot" : ""}`} aria-live="polite">
            <span className="sync-dot" aria-hidden="true" />
            <span className="sync-copy">
              <strong>{syncLabel}</strong>
              <span>
                {lastSyncAt && lastSyncTime ? (
                  <>Last sync · <time dateTime={lastSyncAt}>{lastSyncTime}</time></>
                ) : status === "loading" ? (
                  "Checking edge cache"
                ) : (
                  "Live sync unavailable"
                )}
              </span>
            </span>
          </div>
        </div>

        <div className="timeline">
          {filteredItems.map((item, index) => {
            const currentDay = dayKey(item.date, browserTimeZone);
            const previousItem = filteredItems[index - 1];
            const previousDay = previousItem ? dayKey(previousItem.date, browserTimeZone) : null;
            const showDay = currentDay !== previousDay;
            return (
              <div className="timeline-entry" key={item.sha}>
                {showDay && (
                  <div className="day-label">
                    <span className="day-text">
                      {(browserTimeZone ? localDayFormatter : utcDayFormatter).format(
                        new Date(item.date),
                      )}
                    </span>
                    <span className="day-marker" aria-hidden="true" />
                  </div>
                )}
                <CommitCard item={item} browserTimeZone={browserTimeZone} />
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
              <span className="load-more-icon" aria-hidden="true">↓</span>
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
