#!/usr/bin/env node
/**
 * One-time backfill for existing Firebase Auth users.
 *
 * Run only from a trusted workstation/CI identity authorized for Firebase
 * Admin SDK (Application Default Credentials). Never commit service-account
 * JSON or run this from browser code.
 *
 * Usage:
 *   GOOGLE_CLOUD_PROJECT=l1017n node scripts/backfill-authenticated-claim.js
 */
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
if (!projectId) {
  throw new Error("Set GOOGLE_CLOUD_PROJECT to the Firebase project ID.");
}

initializeApp({ credential: applicationDefault(), projectId });

async function main() {
  const auth = getAuth();
  let pageToken;
  let updated = 0;
  let unchanged = 0;

  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const user of page.users) {
      const claims = user.customClaims || {};
      if (claims.role === "authenticated") {
        unchanged++;
        continue;
      }
      await auth.setCustomUserClaims(user.uid, {
        ...claims,
        role: "authenticated",
      });
      updated++;
    }
    pageToken = page.pageToken;
  } while (pageToken);

  process.stdout.write(JSON.stringify({ projectId, updated, unchanged }) + "\n");
}

main().catch((error) => {
  process.stderr.write((error?.stack || String(error)) + "\n");
  process.exitCode = 1;
});
