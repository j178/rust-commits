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
  assert.match(html, /Rust,/);
  assert.match(html, /on main\./);
  assert.match(html, /Mainline history/);
  assert.match(html, /Optimize new solver unification table ops/);
  assert.match(html, /Included pull requests/);
  assert.match(html, /<details class="rollup-details">/);
  assert.match(html, /9<!-- --> merged/);
  assert.match(html, /Commit message/);
  assert.match(html, /role="tooltip"/);
  assert.match(html, /Auto merge of #160801/);
  assert.doesNotMatch(html, /One tested batch on the mainline/);
  assert.doesNotMatch(html, /commit-card-topline/);
  assert.doesNotMatch(html, /<h2>Rollup of \d+ pull requests<\/h2>/);
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
  const [hostingJson, packageJson, migration] = await Promise.all([
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0000_special_whiplash.sql", import.meta.url), "utf8"),
  ]);

  const hosting = JSON.parse(hostingJson);
  const packageConfig = JSON.parse(packageJson);
  assert.equal(hosting.d1, "DB");
  assert.match(packageConfig.scripts.lint, /^oxlint\b/);
  assert.doesNotMatch(packageJson, /eslint|tailwindcss/);
  assert.match(migration, /CREATE TABLE `github_commits`/);
  assert.match(migration, /CREATE TABLE `github_commit_pages`/);

  await Promise.all([
    assert.rejects(access(new URL("../app/chatgpt-auth.ts", import.meta.url))),
    assert.rejects(access(new URL("../eslint.config.mjs", import.meta.url))),
    assert.rejects(access(new URL("../examples/d1", import.meta.url))),
    assert.rejects(access(new URL("../next.config.ts", import.meta.url))),
    assert.rejects(access(new URL("../postcss.config.mjs", import.meta.url))),
  ]);
});
