# Firebase Authentication Migration (staged)

## Current status

- The storefront currently uses Supabase Auth directly in `app.js` (`signUp`, `signInWithPassword`, `verifyOtp`, `signOut`, password reset, OAuth).
- The Supabase client is created in `supabase.js`.
- Profile and wallet rows use UUID keys, and order/top-up RPCs and RLS policies use `auth.uid()`.
- Firebase project: `l1017n`; Supabase project ref: `aybsettkyxfugntizfqq`.

## Important compatibility constraint

Firebase's client-created UIDs are not guaranteed to be UUIDs. Existing database tables/functions rely on UUID user IDs and `auth.uid()`; switching only the client sign-in provider can break profile/wallet lookups and transactional RPCs.

Do not deploy a client-only auth swap. Do not loosen RLS or expose a Supabase service-role key in browser code.

## Staged plan

1. Keep production auth and existing data unchanged while preparing the migration.
2. Choose and implement a trusted identity bridge:
   - Either provision Firebase users with UUID UIDs using a trusted backend and Firebase Admin credentials, or
   - Implement a complete server-verified Firebase UID-to-database UUID mapping and update all affected policies/functions consistently.
3. Set the Firebase custom claim `role: "authenticated"` using a trusted server-side process, as required by Supabase's Firebase third-party auth integration.
4. Configure the Supabase JS client to pass the current Firebase ID token using its `accessToken` option; remove the old Supabase Auth flows only when the identity bridge is ready.
5. Update sign-up, email verification, sign-in, sign-out, password reset, OAuth/avatar handling, and session restoration.
6. Test with a new account: profile creation, wallet initialization, product stock reads, order creation, top-up creation, RLS isolation, and admin authorization.
7. Deploy only after all checks pass. Keep existing profiles, wallets, and orders as a rollback backup until the new path is verified.

## Required secret handling

A trusted Firebase Admin backend credential is needed for server-managed UID/custom-claim provisioning. Store credentials only as Cloudflare Worker secrets or an equivalent server-side secret store. Never commit service-account JSON/private keys or paste them into frontend files.

## Acceptance checklist

- [ ] A new Firebase account can sign up and verify its email.
- [ ] Refreshing the page restores the Firebase session.
- [ ] Supabase receives the Firebase ID token and recognizes it as authenticated.
- [ ] The database identity resolves to the correct UUID consistently.
- [ ] A user can only read their own profile, wallet, top-ups, orders, and order codes.
- [ ] A user cannot grant themselves admin privileges.
- [ ] Wallet checkout remains atomic and cannot overspend or sell unavailable stock.
- [ ] Password reset and logout work.
- [ ] Production data and the existing production deployment remain unchanged until rollout approval.

## Official integration reference

https://supabase.com/docs/guides/auth/third-party/firebase-auth
