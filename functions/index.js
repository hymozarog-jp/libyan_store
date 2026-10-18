const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { logger } = require("firebase-functions");
const { onUserCreated } = require("firebase-functions/v2/identity");

initializeApp();

/**
 * Supabase's Firebase third-party-auth integration expects the signed Firebase
 * ID token to carry role=authenticated. This trigger adds that non-privileged
 * claim while preserving any claims already assigned by trusted server code.
 *
 * This does NOT grant admin privileges and does NOT migrate database identity.
 */
exports.addSupabaseAuthenticatedClaim = onUserCreated(
  { region: "us-central1" },
  async (event) => {
    const user = event.data;
    if (!user?.uid) {
      logger.warn("Firebase Auth create event had no user UID");
      return;
    }

    const auth = getAuth();
    const current = user.customClaims || {};
    if (current.role === "authenticated") return;

    await auth.setCustomUserClaims(user.uid, {
      ...current,
      role: "authenticated",
    });
    logger.info("Added Supabase authenticated claim", { uid: user.uid });
  }
);
