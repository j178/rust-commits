import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Rust Mainline product", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Rust Mainline/);
  assert.match(html, /href="\/favicon\.ico"/);
  assert.match(html, /href="\/favicon-32x32\.png"/);
  assert.match(html, /href="\/apple-touch-icon\.png"/);
  assert.match(html, /Rust,/);
  assert.match(html, /on main\./);
  assert.match(html, /class="hero-title"/);
  assert.match(html, /Mainline history/);
  assert.match(html, /Syncing GitHub/);
  assert.match(html, /Checking edge cache/);
  assert.match(html, /class="sync-copy"/);
  assert.match(html, /class="external-arrow"/);
  assert.doesNotMatch(html, /↗/);
  assert.match(html, /Optimize new solver unification table ops/);
  assert.match(html, /<details class="rollup-details">/);
  assert.match(html, /9 pull requests included/);
  assert.match(html, /1 failed candidate was left out/);
  assert.match(html, /Failed candidates · not in this commit/);
  assert.doesNotMatch(html, /Included pull requests|9<!-- --> merged|excluded/);
  assert.doesNotMatch(html, /class="summary-copy"/);
  assert.doesNotMatch(html, />1 failed candidate was left out</);
  assert.doesNotMatch(html, />Combined into this mainline commit</);
  assert.match(html, /class="commit-message-trigger"/);
  assert.match(html, /class="detail-popover"[^>]*role="tooltip"/);
  assert.match(html, /Loading PR details…/);
  assert.match(html, /Auto merge of #160801/);
  assert.doesNotMatch(html, /history-stats/);
  assert.doesNotMatch(html, /<details class="commit-message">/);
  assert.doesNotMatch(html, /View PRs|Hide PRs|class="summary-action"/);
  assert.doesNotMatch(html, />Included pull request<|>Commit message</);
  assert.doesNotMatch(html, /class="view-rules"/);
  assert.doesNotMatch(html, /One tested batch on the mainline/);
  assert.doesNotMatch(html, /commit-card-topline/);
  assert.doesNotMatch(html, /<h2>Rollup of \d+ pull requests<\/h2>/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/);

  const rollupCards = html.match(/<article class="commit-card is-rollup">[\s\S]*?<\/article>/g) ?? [];
  assert.ok(rollupCards.length > 0);
  for (const card of rollupCards) assert.doesNotMatch(card, /commit-message/);
});

test("removes all starter-preview wiring", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});

test("configures the durable cache and lean toolchain", async () => {
  const [hostingJson, packageJson, migration, pullMigration, stylesheet, historyRoute, pullRoute, database, readme] = await Promise.all([
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0000_special_whiplash.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0001_sudden_paladin.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/api/history/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/pull/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
  ]);

  const hosting = JSON.parse(hostingJson);
  const packageConfig = JSON.parse(packageJson);
  assert.equal(hosting.d1, "DB");
  assert.match(packageConfig.scripts.lint, /^oxlint\b/);
  assert.doesNotMatch(packageJson, /eslint|tailwindcss/);
  assert.match(migration, /CREATE TABLE `github_commits`/);
  assert.match(migration, /CREATE TABLE `github_commit_pages`/);
  assert.match(pullMigration, /CREATE TABLE `github_pull_requests`/);
  assert.match(stylesheet, /h1,\s+h2,\s+h3,\s+h4,\s+h5,\s+h6\s*{[^}]*font-weight: inherit;/s);
  assert.match(stylesheet, /\.commit-heading-actions\s*{[^}]*align-items: flex-start;/s);
  assert.match(stylesheet, /\.live-status\s*{[^}]*align-items: center;/s);
  assert.doesNotMatch(stylesheet, /\.rollup-details\s*{[^}]*border-(?:top|bottom)/s);
  assert.doesNotMatch(stylesheet, /history-stats|commit-message-popover|view-rules|summary-action|commit-footer/);
  assert.match(historyRoute, /requestedRefFetchedAt \?\? Date\.now\(\)/);
  assert.doesNotMatch(historyRoute, /fetchedAt: new Date\(\)\.toISOString\(\)/);
  assert.match(pullRoute, /readCachedPullRequest\(number\)/);
  assert.match(pullRoute, /writeCachedPullRequest\(pullRequest, Date\.now\(\)\)/);
  assert.match(pullRoute, /Number\.isSafeInteger\(number\)/);
  assert.match(database, /writeCachedCommitBatch\([\s\S]*fetchedAt: number/);
  assert.match(database, /writeCachedPullRequest\([\s\S]*cachedAt: number/);
  assert.match(readme, /Refreshing is request-driven rather than scheduled/);

  await Promise.all([
    access(new URL("../public/favicon.ico", import.meta.url)),
    access(new URL("../public/favicon-32x32.png", import.meta.url)),
    access(new URL("../public/apple-touch-icon.png", import.meta.url)),
    assert.rejects(access(new URL("../app/chatgpt-auth.ts", import.meta.url))),
    assert.rejects(access(new URL("../eslint.config.mjs", import.meta.url))),
    assert.rejects(access(new URL("../examples/d1", import.meta.url))),
    assert.rejects(access(new URL("../next.config.ts", import.meta.url))),
    assert.rejects(access(new URL("../postcss.config.mjs", import.meta.url))),
  ]);
});
