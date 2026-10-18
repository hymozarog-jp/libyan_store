# Firebase Auth Migration — Live Authorization Inventory

Read-only inspection date: 2026-10-18  
Project: `aybsettkyxfugntizfqq`  
Branch: `firebase-auth-migration`

This is an engineering inventory only. It makes no database or deployment changes.

## Identity-sensitive routines found in production

The following public routines use the current Supabase identity and/or act on wallet/order state. Several are `SECURITY DEFINER`, so their caller identity checks must be preserved and explicitly retested during any identity migration.

| Routine | Current identity / authorization dependency | Migration test required |
|---|---|---|
| `create_wallet_order(jsonb,text,text)` | `auth.uid()` becomes the order and wallet owner; locks product/stock and wallet rows; checks balance | Valid owner UUID, no overspend, stock atomicity, failed transaction rolls back |
| `create_wallet_topup(numeric,payment_method,text)` | Requires `auth.uid()`; records the caller as top-up owner | Cannot submit for another user; invalid amount/method rejected |
| `get_my_order_codes(uuid)` | Returns codes only when the order owner equals `auth.uid()` | Cross-account order IDs reveal no codes |
| `is_admin()` | Resolves admin role by matching `profiles.id` to `auth.uid()` | Customer cannot elevate role or inherit another account's admin access |
| `review_wallet_topup(uuid,boolean,text)` | Calls `is_admin()`; writes wallet and transaction rows | Non-admin rejected; balance and ledger remain atomic |
| `admin_set_setting(text,text)` | Privileged settings mutation; must be verified against admin checks and execute grants | Customer token cannot modify settings |
| `review_wallet_topup_discord(...)`, `review_wallet_topup_from_discord(...)` | Privileged Discord/admin paths; must remain separate from browser trust | Firebase user cannot impersonate Discord/admin actor |
| `discord_add_wallet_balance(...)`, `discord_deduct_wallet(...)`, `discord_list_wallet_balances(...)` | Privileged Discord wallet operations | Existing server-side authorization remains intact |

## RLS policy inventory observations

The live `pg_policies` view includes duplicate/overlapping permissive policies on several exchange tables, including `exchange_requests`, `exchange_matches`, `exchange_messages`, `exchange_ratings`, and `exchange_reports`. This inventory does not change them. During migration, every effective policy must be reviewed as a combined OR of permissive policies, rather than validating each policy in isolation.

The profile policy requires the inserted profile ID to equal `auth.uid()` and restricts new profile role to `customer`. The admin helper resolves privileges through `profiles.role`. Both are part of the identity boundary and cannot be replaced with a client-provided mapping.

## Release gate

Do not merge a Firebase auth implementation until an isolated environment proves all of the following:

- The token is accepted only from the configured Firebase project.
- The database's effective user ID resolves consistently to the correct existing owner UUID.
- The design does not depend on a browser-provided identity mapping.
- All routines above and all effective RLS policies pass positive and negative tests.
- Wallet, ledger, order, top-up, exchange, order-code, and admin authorization regressions pass.
- Production remains unchanged until a reviewed rollout and rollback plan is approved.

## Safety note

No Firebase token was used to access customer data in this audit. No rows, functions, policies, secrets, schema, or deployment were modified.
