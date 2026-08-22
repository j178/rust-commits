# Rust Mainline

A first-parent view of the [`rust-lang/rust`](https://github.com/rust-lang/rust)
commit history.

The site turns each mainline `Auto merge` into one readable entry, keeps the
commits inside individual PRs folded away, and lets rollup merges expand into
their constituent pull requests.

## Run locally

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validate

```bash
npm test
npm run lint
```

The app uses GitHub's commits API through `/api/history`. Responses are stored
in Cloudflare D1, so immutable commit ranges are fetched only once. The moving
`main` ref and the CDN response each have a five-minute freshness window.
Refreshing is request-driven rather than scheduled: the first request that
reaches the Worker after the D1 entry expires fetches GitHub and updates the
cache. Stale data is used if GitHub is temporarily unavailable. A bundled
snapshot keeps the first render useful if both services are unavailable. Set
`GITHUB_TOKEN` in the hosted runtime only if higher GitHub API limits are
needed. Rollup PR descriptions are loaded lazily through `/api/pull` when a
visitor first hovers or focuses an entry, then persisted in D1 for later views.

## Deployment

The vinext build emits Cloudflare Worker-compatible output. The checked-in
`wrangler.toml` is the source of truth for direct deployments to a Cloudflare
account, while `.openai/hosting.json` keeps the existing Sites deployment
available during the migration.

Authenticate once, then create the production D1 database and let Wrangler
write its ID into `wrangler.toml`:

```bash
WRANGLER_LOG_PATH=.wrangler/wrangler.log npx wrangler login
npx wrangler d1 create rust-mainline --binding DB --location apac --update-config
npm run db:migrate
```

Deploy first to the generated `workers.dev` URL without changing the current
custom domain:

```bash
npm run deploy
```

After that deployment is verified, add `rust.j178.dev` as a Worker Custom
Domain and remove the old Sites CNAME during the final cutover.
