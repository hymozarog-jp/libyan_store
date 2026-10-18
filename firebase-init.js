/* Firebase client initialization only; the existing Supabase auth flow remains active
   until third-party auth and database identity compatibility are verified. */
(function () {
  if (!window.firebase || !window.LIBYAN_FIREBASE_CONFIG) {
    console.warn("Firebase SDK/config not loaded; current auth provider remains unchanged.");
    return;
  }
  try {
    window.libyanFirebaseApp = window.firebase.apps && window.firebase.apps.length
      ? window.firebase.app()
      : window.firebase.initializeApp(window.LIBYAN_FIREBASE_CONFIG);
    window.libyanFirebaseAuth = window.libyanFirebaseApp.auth();
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
})();
