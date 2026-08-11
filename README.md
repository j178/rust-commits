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
```

The app uses GitHub's public commits API through `/api/history`. A bundled
snapshot keeps the first render useful if GitHub is temporarily unavailable.
Set `GITHUB_TOKEN` in the hosted runtime only if higher GitHub API limits are
needed.

## Deployment

The vinext build emits Cloudflare Worker-compatible output. Hosting metadata is
kept in `.openai/hosting.json`.
