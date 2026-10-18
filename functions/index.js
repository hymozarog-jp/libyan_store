const functions = require("firebase-functions/v1");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

initializeApp();

/**
 * Supabase's Firebase third-party-auth integration expects the signed Firebase
 * ID token to carry role=authenticated. This trigger adds that non-privileged
 * claim while preserving any claims already assigned by trusted server code.
 *
 * This does NOT grant admin privileges and does NOT migrate database identity.
 */
exports.addSupabaseAuthenticatedClaim = functions.auth.user().onCreate(
  async (user) => {
    const uid = user?.uid;
    if (!uid) {
      functions.logger.warn("Firebase Auth create event had no user UID");
      return;
    }

    const auth = getAuth();
    const current = user.customClaims || {};
    if (current.role === "authenticated") return;

    await auth.setCustomUserClaims(uid, {
      ...current,
      role: "authenticated",
    });
    functions.logger.info("Added Supabase authenticated claim", { uid });
  }
);
