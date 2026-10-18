# Copilot instructions for Libyan Store

## Project and deployment
- This is an Arabic RTL Libyan Store website for Robux. Keep the interface Arabic-first, RTL, mobile responsive, and consistent with the existing HTML/CSS/JavaScript architecture.
- Production is a Cloudflare Worker configured by `wrangler.jsonc` and `worker.js`; the public site is `https://libyan-store2.hymozarog.workers.dev`.
- `.github/workflows/deploy.yml` deploys on pushes to `main` and requires the repository Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
- Prefer a feature branch and pull request for changes. Do not claim production has changed just because a commit or PR exists. Verify the GitHub Actions deployment result and run the live-site smoke checks before reporting success.

## Safe change rules
- Inspect the existing implementation before editing; make the smallest complete change and avoid duplicate/competing CSS overrides.
- Preserve existing Supabase authentication, database queries, order flow, payment behavior, and admin verification. Never fabricate payment success or mark an order paid without trusted server-side confirmation.
- Never commit API keys, access tokens, credentials, private customer data, or secret values. Treat `supabase-config.js` as sensitive and do not expose or rewrite its values.
- Do not remove existing features or change database schemas without an explicit request and migration plan.
- For cache-sensitive frontend changes, update the relevant asset cache-busting query strings in `index.html` when appropriate.

## Required validation
- Run `node --check app.js`, `node --check supabase.js`, `node --check worker.js`, and `node --check theme.js` for JavaScript changes.
- Inspect HTML references and ensure all referenced local assets exist.
- After deployment, verify that `https://libyan-store2.hymozarog.workers.dev/` returns HTTP 200 and that the expected HTML and key assets (including `rebuild.css` and the application JavaScript) are reachable. If checks fail, report the exact failure and do not say deployment succeeded.
- State clearly which checks were actually run. Do not imply that a visual/browser test was performed unless it was.
