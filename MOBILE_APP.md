# Libyan Store — Mobile App

This repository is prepared for native Android and iOS builds using Capacitor 8.

## What is ready

- Existing Libyan Store web app remains the source of truth.
- Android package ID: `com.libyanstore.app`
- iOS bundle ID: `com.libyanstore.app`
- Capacitor configuration is included.
- The existing PWA remains available.

## Build locally

1. Install Node.js LTS.
2. Run `npm install`.
3. Add platforms once:
   - `npx cap add android`
   - `npx cap add ios`
4. Sync the web app:
   - `npx cap sync`
5. Open the native project:
   - `npx cap open android`
   - `npx cap open ios`

Android requires Android Studio/SDK for signing and release builds. iOS release builds require Xcode on macOS and an Apple Developer account.

## Store launch

Before submitting, configure the final app icon/splash assets, privacy/support URLs, store screenshots, signing credentials, and the store-specific payment flow for digital products. Do not publish until the Apple/Google policies for the products sold in the app have been reviewed.

Developer account costs are separate from this repository setup.
