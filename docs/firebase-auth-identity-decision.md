# Firebase Auth Migration — Identity Architecture Decision

Status: **Blocked pending an explicit architecture choice**
Scope: Documentation only. This note does not change application code, Supabase schema/data, or production deployment.

## Why a direct provider swap is unsafe

The current app uses Supabase Auth sessions. The database depends on the Supabase user UUID in several places:

- `public.profiles.id` references `auth.users.id`.
- Wallet, order, top-up, transaction, and exchange records reference the profile UUID.
- Database functions and RLS policies use `auth.uid()`.

Supabase's Firebase third-party-auth integration accepts a Firebase ID token when the Firebase project is configured and the token contains the expected `role: "authenticated"` claim. However, the token subject is the Firebase UID. The integration does not automatically create a matching Supabase `auth.users` row, and a UUID-shaped Firebase UID alone does not satisfy the existing foreign key.

Therefore, do not assume that creating Firebase users with UUID-shaped UIDs solves the identity problem. Do not send an unverified client-supplied UUID to the database, alter JWT claims in the browser, drop the foreign key, weaken RLS, or expose a service-role key.

Official reference: https://supabase.com/docs/guides/auth/third-party/firebase-auth

## Options to evaluate

### Option A — Keep Supabase Auth as the application identity (lowest database risk)

Keep existing Supabase Auth and its UUID as the authoritative identity. Firebase may be used for a separately scoped capability only if a supported integration fits the product requirements. This does **not** complete a full migration away from Supabase Auth.

### Option B — Firebase Auth as the identity provider, with a supported server-side bridge

Before implementation, prove a supported design that validates Firebase ID tokens server-side and securely resolves each Firebase UID to the existing database identity. The design must preserve profile/wallet/order ownership and must not depend on unsupported direct writes to Supabase's managed `auth` schema. Verify how Supabase sessions and `auth.uid()` will behave before selecting this option.

### Option C — Migrate the database identity model

A larger, separately reviewed migration could replace assumptions that all user IDs are Supabase Auth UUIDs. This would require a full inventory and coordinated redesign of foreign keys, RPCs, RLS policies, admin authorization, checkout, top-ups, and every user-owned table. It is not a safe quick fix and must be tested on a disposable database copy first.

## Required proof before auth code changes

1. Use a disposable Supabase branch/project or isolated database copy; do not create a paid resource without explicit cost approval.
2. Verify Firebase third-party JWT acceptance and the `authenticated` claim.
3. Demonstrate the exact identity used by `auth.uid()` and prove it matches valid ownership keys for profiles, wallets, orders, top-ups, transactions, and exchange records.
4. Test signup, verification, login, logout, password reset, session restoration, RLS isolation, admin authorization, and atomic checkout.
5. Only then prepare an implementation PR. Do not merge or deploy without review and explicit rollout approval.

## Current state

- Firebase project ID: `l1017n`.
- Supabase project ref: `aybsettkyxfugntizfqq`.
- Existing branch: `firebase-auth-migration`.
- Existing draft PR: https://github.com/hymozarog-jp/libyan_store/pull/21.
- Production application code, schema, data, and deployment must remain unchanged until the proof above passes.
