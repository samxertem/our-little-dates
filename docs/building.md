# building the phone apps ♡

The phone apps are the same page as the computer app, wrapped with [Capacitor](https://capacitorjs.com).
Everything you write lives on the phone first; once you pair up in **♡ us → our shared board**,
it syncs between all your phones, tablets and the computer.

---

## 🤖 android (on the windows computer)

**once:**
1. Install [Android Studio](https://developer.android.com/studio) with the default options, and let its
   first-launch setup finish downloading the Android SDK.
2. In this folder: `npm install`

**every time you want a fresh app:**

```
npm run apk
```

The app ends up at `android/app/build/outputs/apk/debug/app-debug.apk`.
Send it to the phone (cable, Google Drive, Telegram to yourself…), open it, and allow
"install unknown apps" for whatever you opened it with. Installing a newer apk over the old one
keeps all your dates.

Or, with the phone plugged in and USB debugging on: `npm run android`, then press ▶ in Android Studio.

---

## 🍎 iphone / ipad (on a Mac)

**once:**
1. Install **Xcode** from the Mac App Store (big, takes a while), open it once and let it install its extras.
2. Install **Node.js** (the LTS one) from [nodejs.org](https://nodejs.org).
3. Get the code: open Terminal and run
   ```
   git clone https://github.com/samxertem/our-little-dates.git
   cd our-little-dates
   npm install
   ```
4. On the iPhone: **Settings → Privacy & Security → Developer Mode → on** (it restarts).

**build + install:**
1. In Terminal, inside the folder: `npm run ios` — Xcode opens the app.
2. Click **App** in the left sidebar → **Signing & Capabilities** →
   - **Team:** add your Apple ID (Xcode → Settings → Accounts) and pick "(Personal Team)"
   - if Xcode complains about the **Bundle Identifier**, add something to the end,
     e.g. `io.github.samxertem.ourlittledates.mine`
3. Plug in the iPhone (tap **Trust** on it), choose it at the top of Xcode, press **▶**.
4. First time only, on the iPhone: **Settings → General → VPN & Device Management** → trust your Apple ID.

**good to know:**
- With a free Apple ID the app works for **7 days**, then needs a re-install: plug in, press ▶ again.
  Your dates are safe, they're kept in the app and on the shared board.
- With the paid Apple Developer Program ($99/year) the app can go through **TestFlight** instead:
  no cable, no weekly re-install, and it can go on both of your iPhones/iPads.
- To get new changes: `git pull`, `npm install`, then `npm run ios` and ▶ again.

---

## 🎨 the app icon

The icon and splash screens are drawn in code (`scripts/make-icons.mjs`). After changing it:

```
npm run icons
```
