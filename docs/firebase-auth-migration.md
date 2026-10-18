# Firebase Authentication Migration (staged)

## Current status

- The storefront currently uses Supabase Auth directly in `app.js`.
- The Supabase client is created in `supabase.js`.
- Profiles, wallets, orders, top-ups, exchange records, RLS policies, and transactional RPCs use UUID user IDs and `auth.uid()`.
- Firebase project: `l1017n`; Supabase project ref: `aybsettkyxfugntizfqq`.
- Work is confined to this migration branch and is not deployed.

## Verified compatibility blocker

Firebase Auth can provide a signed ID token for Supabase third-party authentication, but the token subject is the Firebase UID. The current schema requires `profiles.id` to reference an existing `auth.users.id`, and the rest of the data model and security layer consistently use that UUID.

Making a Firebase UID look like a UUID does not create the corresponding Supabase Auth user row. A client-side UID-to-UUID mapping is not trusted and cannot change the signed JWT subject. Simply passing the Firebase token to the current app therefore is not a complete or safe migration.

## Decision

Do not switch the browser authentication flow yet. Do not drop the `profiles -> auth.users` foreign key, weaken RLS, expose service-role credentials, or modify production records to force compatibility.

The next implementation milestone must prove one of these supported architectures in an isolated environment:

1. **Supported identity bridge:** a trusted backend verifies Firebase tokens and securely resolves them to the existing database UUID identity, while preserving Supabase authorization semantics and all existing foreign keys. This is only acceptable if the design does not rely on unsupported writes to Supabase-managed `auth` tables.
2. **Deliberate identity/data-model redesign:** migrate the full ownership model, foreign keys, RLS policies, and all security-sensitive RPCs to a verified Firebase identity mapping. This is a larger staged project and requires comprehensive tests and an approved rollback plan.

Neither option is considered implemented or proven. Do not create paid development resources without explicit approval. No production schema or data changes are authorized by this document.

## Security-sensitive surfaces inventoried

- `create_wallet_order`: owner identity, stock locking, wallet balance, order and ledger writes.
- `create_wallet_topup`: owner identity and top-up ownership.
- `get_my_order_codes`: order ownership check before returning purchased codes.
- `is_admin`, `review_wallet_topup`, `admin_set_setting`: admin authorization and privileged writes.
- Discord wallet/top-up functions: separate trusted automation paths.
- RLS ownership policies for profiles, wallets, orders, top-ups, transactions, exchange requests, matches, messages, ratings, and reports.

A separate inventory is maintained in `docs/firebase-auth-authorization-inventory.md`. Existing duplicate permissive RLS policies must be evaluated together because permissive policies combine with OR semantics.

## Required verification before any production rollout

- Firebase tokens are accepted only from the configured Firebase project.
- The trusted database identity maps to exactly the correct existing owner UUID.
- Profile creation and wallet bootstrap work for new users.
- Existing users retain access to their own records, with no cross-account reads or writes.
- Purchased product codes cannot be retrieved by another user.
- Admin privileges cannot be self-assigned or inherited by an unrelated Firebase account.
- Checkout and top-up operations remain atomic; failed transactions roll back correctly.
- Email verification, login, logout, password recovery, and session restoration all work.
- All identity-sensitive RLS policies and RPCs pass positive and negative tests.
- A reviewed PR, rollback plan, and explicit production rollout approval exist.

## Required secret handling

Any Firebase Admin credential or signing capability must remain server-side in a managed secret store. Never commit private keys, expose privileged keys in browser code, or ask the user to paste service-account JSON into chat.

## Official reference

https://supabase.com/docs/guides/auth/third-party/firebase-auth

## Audit history (2026-10-18)

Read-only review confirmed the current auth flow and live schema constraints. No auth code, production rows, database schema, RLS policies, secrets, or live deployment were changed by the audit.

## Next action

The Firebase Web SDK configuration has been received. Client configuration alone does not authorize changing production authentication. Validate the Supabase third-party provider configuration and identity ownership model before enabling Firebase sign-in.
