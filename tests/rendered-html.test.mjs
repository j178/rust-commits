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
  assert.doesNotMatch(html, /GitHub synced|Syncing GitHub|Checking edge cache|class="sync-/);
  assert.match(html, /class="external-arrow"/);
  assert.doesNotMatch(html, /↗/);
  assert.match(html, /class="timeline-loading"[^>]*aria-busy="true"/);
  assert.match(html, /Loading latest mainline history…/);
  assert.match(html, /class="timeline-placeholder"/);
  assert.doesNotMatch(html, /Optimize new solver unification table ops/);
  assert.doesNotMatch(html, /class="commit-card/);
  assert.doesNotMatch(html, /history-stats/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/);
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
  const [hostingJson, wranglerToml, viteConfig, packageJson, migration, pullMigration, stylesheet, historyExplorer, historyRoute, pullRoute, database, readme] = await Promise.all([
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../wrangler.toml", import.meta.url), "utf8"),
    readFile(new URL("../vite.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0000_special_whiplash.sql", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0001_sudden_paladin.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/HistoryExplorer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/history/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/pull/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
  ]);

  const hosting = JSON.parse(hostingJson);
  const packageConfig = JSON.parse(packageJson);
  assert.equal(hosting.d1, "DB");
  assert.match(wranglerToml, /^name = "rust-mainline"$/m);
  assert.match(wranglerToml, /^main = "\.\/worker\/index\.ts"$/m);
  assert.match(wranglerToml, /^binding = "DB"$/m);
  assert.match(wranglerToml, /^database_name = "rust-mainline"$/m);
  assert.match(wranglerToml, /^migrations_dir = "drizzle"$/m);
  assert.doesNotMatch(wranglerToml, /00000000-0000-4000-8000-000000000000/);
  assert.doesNotMatch(viteConfig, /hostingConfig|PLACEHOLDER_DATABASE_ID|localBindingConfig/);
  assert.match(viteConfig, /cloudflare\(\{\s*viteEnvironment:/s);
  assert.match(packageConfig.scripts.lint, /^oxlint\b/);
  assert.equal(
    packageConfig.scripts.deploy,
    "npm run build && WRANGLER_LOG_PATH=.wrangler/wrangler.log wrangler deploy",
  );
  assert.equal(
    packageConfig.scripts["db:migrate"],
    "WRANGLER_LOG_PATH=.wrangler/wrangler.log wrangler d1 migrations apply rust-mainline --remote",
  );
  assert.doesNotMatch(packageJson, /eslint|tailwindcss/);
  assert.match(migration, /CREATE TABLE `github_commits`/);
  assert.match(migration, /CREATE TABLE `github_commit_pages`/);
  assert.match(pullMigration, /CREATE TABLE `github_pull_requests`/);
  assert.match(stylesheet, /h1,\s+h2,\s+h3,\s+h4,\s+h5,\s+h6\s*{[^}]*font-weight: inherit;/s);
  assert.match(stylesheet, /\.commit-heading-actions\s*{[^}]*align-items: flex-start;/s);
  assert.doesNotMatch(stylesheet, /live-status|sync-dot|sync-copy/);
  assert.match(stylesheet, /\.rollup-copy\s*{[^}]*flex: 1;/s);
  assert.match(stylesheet, /\.commit-heading-copy\s*{[^}]*display: contents;/s);
  assert.doesNotMatch(stylesheet, /max-width:\s*59vw/);
  assert.doesNotMatch(stylesheet, /\.rollup-details\s*{[^}]*border-(?:top|bottom)/s);
  assert.doesNotMatch(stylesheet, /history-stats|commit-message-popover|view-rules|summary-action|commit-footer/);
  assert.match(stylesheet, /\.timeline-placeholder\s*{/);
  assert.match(historyExplorer, /new Intl\.RelativeTimeFormat\("en", \{ numeric: "auto" \}\)/);
  assert.match(historyExplorer, /window\.setInterval\(\(\) => setNow\(Date\.now\(\)\), 60 \* 1000\)/);
  assert.match(historyExplorer, /title=\{exactCommitTime\}/);
  assert.match(historyExplorer, /className="rollup-details"/);
  assert.match(historyExplorer, /className="commit-message-trigger"/);
  assert.match(historyExplorer, /className="detail-popover"/);
  assert.doesNotMatch(historyExplorer, /fallbackItems|fallback-history/);
  assert.doesNotMatch(historyExplorer, /View PRs|Hide PRs|className="summary-action"/);
  assert.doesNotMatch(historyRoute, /requestedRefFetchedAt/);
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
    assert.rejects(access(new URL("../app/lib/fallback-history.ts", import.meta.url))),
    assert.rejects(access(new URL("../app/chatgpt-auth.ts", import.meta.url))),
    assert.rejects(access(new URL("../eslint.config.mjs", import.meta.url))),
    assert.rejects(access(new URL("../examples/d1", import.meta.url))),
    assert.rejects(access(new URL("../next.config.ts", import.meta.url))),
    assert.rejects(access(new URL("../postcss.config.mjs", import.meta.url))),
  ]);
});
