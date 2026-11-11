# Website and Android app: how to launch

Written 11 November 2026. The website lives in [`website/`](../website/). The Android app is the same website packaged as an app (a Trusted Web Activity), so every change to the website shows up in the app too, with no app update needed.

## What is ready

| Part | Where | Status |
|---|---|---|
| Website (one page: courses, 6-week curriculum, how we teach, founders, pricing, FAQ, apply form) | `website/index.html` | Ready. Works on phone, tablet and laptop |
| Installable app (PWA): icon, offline support, app tab bar when installed | `website/manifest.webmanifest`, `website/sw.js`, `website/assets/` | Ready |
| Privacy policy (the Play Store requires one) | `website/privacy.html` | Ready. Add your contact email |
| Auto-deploy to GitHub Pages | `.github/workflows/deploy-website.yml` | Ready, runs when `website/` changes on `main` |
| Android app settings for Bubblewrap | `android/twa-manifest.json` | Ready. Package name `com.leapverse.app` |
| Play Store images: icon 512×512, feature graphic 1024×500, 5 phone screenshots | `android/store-listing/` | Ready |
| Digital Asset Links file (removes the browser bar in the app) | `website/.well-known/assetlinks.json` | Needs a custom domain and your key fingerprint (step 4) |

## Before you go public: fill in these

1. **Founder details.** In `website/index.html`, search for `class="todo"`. Replace each yellow dashed box with real details: degree, institute, PhD plans, papers or projects with links, LinkedIn, Google Scholar. To add a photo, put it in `website/assets/` and replace `SD` / `SS` inside `<div class="avatar">` with `<img src="assets/shikhar.jpg" alt="Shikhar Dubey">`.
2. **Contact email and form.** At the bottom of `website/index.html`, fill in `LEAPVERSE.contactEmail`. To collect applications in a Google Sheet, set `formEndpoint` to a Google Apps Script web app URL (or a Formspree URL). Without an endpoint, the form opens the student's email app with the application filled in.
3. **Prices.** The page shows "₹2,999 onwards" for the pilot and "₹499 onwards" for the starter course and add-ons, from `docs/04`. Change them in the Pricing section if you decide differently.
4. **PhD rules.** The plan says to check your institute's rules on side ventures before charging money. Do that before the form goes live.

## Step 1: put the website online (free)

Everything is hosted from this repository. The site address will be `https://shikhar2004-prog.github.io/startup-plan/`.

1. **Merge the pull request** that adds `website/` into `main`.
2. **Allow GitHub Pages on this repository.** It is private, and GitHub only hosts private repositories on a paid plan. Pick one:
   - **GitHub Pro, free for students (recommended):** apply for the [GitHub Student Developer Pack](https://education.github.com/pack) with your institute email. The repository stays private, so the plan and pricing docs stay hidden, and only the website is public.
   - **Make the repository public:** Settings → General → Danger Zone → Change visibility → Public. This is instant, but everyone can then read the plan, pricing and strategy docs too.
3. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
4. Open the **Actions** tab, choose **Deploy website**, and click **Run workflow** (it also runs by itself whenever `website/` changes on `main`). After about a minute the site is live.

**Your own domain later (for example leapverse.in):** buy it, then in Settings → Pages → Custom domain, enter it and add the DNS records GitHub shows. Then change `host`, `startUrl`, `iconUrl`, `maskableIconUrl` and `webManifestUrl` in `android/twa-manifest.json` to the new domain.

## Step 2: Google Play developer account

1. Go to [play.google.com/console](https://play.google.com/console) and sign up. There is a one-time fee of US$25.
2. Choose **Personal** (fastest) or **Organization** (needs a D-U-N-S number, use this once the company is registered).
3. Verify your identity with a government ID and confirm a phone number. This can take a few days.
4. **New personal accounts must run a closed test first:** at least 12 testers opted in for 14 days in a row before you can publish to everyone. Start collecting 12+ Gmail addresses from friends and classmates now. (Google changes these rules from time to time; check the Play Console for the current numbers.)

## Step 3: build the Android app file (.aab)

**Easiest: PWABuilder (in the browser, nothing to install).**

1. Open [pwabuilder.com](https://www.pwabuilder.com) and enter your live website address from step 1.
2. Click **Package for stores → Android → Generate package**. In the options:
   - Package ID: `com.leapverse.app`
   - App name: `Leapverse`, short name: `Leapverse`
   - Version: `1.0.0`, version code: `1`
   - Signing key: **Create new**. Fill in your name and organization.
3. Download the zip. It contains the `.aab` (for the Play Store), an `.apk` (to try on your own phone), `signing.keystore`, `signing-key-info.txt` and `assetlinks.json`.
4. **Back up `signing.keystore` and `signing-key-info.txt` somewhere safe (two places).** You need them for every future update. Never put them in GitHub.

**Alternative: Bubblewrap on your computer** (needs Node.js; it downloads Java and the Android SDK for you):

```bash
npm install -g @bubblewrap/cli
mkdir leapverse-android && cd leapverse-android
bubblewrap init --manifest https://shikhar2004-prog.github.io/startup-plan/manifest.webmanifest
# accept the defaults; use package id com.leapverse.app (as in android/twa-manifest.json)
bubblewrap build
# gives you app-release-bundle.aab and app-release-signed.apk
```

## Step 4: remove the browser bar (needs your own domain)

The app works without this step, but shows a thin browser address bar at the top. Android only hides that bar when a file called `assetlinks.json` sits at the very root of the website's domain. A site at `shikhar2004-prog.github.io/startup-plan/` cannot put a file at the root, so this step needs a custom domain (see step 1). You can publish the app first and do this later.

1. After you upload the app (step 5), open Play Console → your app → **Test and release → App integrity → App signing**. Copy the **SHA-256 certificate fingerprint** of the *App signing key*.
2. In `website/.well-known/assetlinks.json`, replace `REPLACE_WITH_SHA256_FINGERPRINT_FROM_PLAY_CONSOLE` with it. Also add the fingerprint from your own upload key (it's in PWABuilder's `assetlinks.json`), so the list has both, separated by a comma.
3. Publish the website again. Check that `https://your-domain/.well-known/assetlinks.json` opens in a browser.

## Step 5: create the app in Play Console and upload

1. **Create app**: name `Leapverse`, default language English (India), type **App**, **Free**. Accept the declarations.
2. **Store listing** (Grow → Store presence → Main store listing). Text below; images from `android/store-listing/`:
   - App icon: `app-icon-512.png`
   - Feature graphic: `feature-graphic-1024x500.png`
   - Phone screenshots: the `phone-screenshot-*.png` files (add one of the founders section after you fill in your details)
3. **App content** (Policy → App content), answer each item:
   - Privacy policy URL: `https://shikhar2004-prog.github.io/startup-plan/privacy.html`
   - Ads: No ads
   - App access: All functionality is available without special access
   - Content rating: fill the questionnaire (category: Education). Expect a rating for everyone
   - Target audience: 18 and over (college students). Picking under-13 adds the Families policy, which you don't need
   - Data safety: the app collects **name, email address, phone number** (and the free-text message) when a student applies, for **app functionality / communication**, not shared, not required to use the app, users can ask for deletion. Data is encrypted in transit (HTTPS): Yes
   - Government app: No. Financial features: None. Health: No
4. **Closed testing** (Test and release → Testing → Closed testing): create a track, upload the `.aab`, add your 12+ testers' emails, roll out. Send testers the opt-in link and ask them to keep the app installed for 14 days.
5. After 14 days, **apply for production access** from the dashboard. Answer the questions about your testing, then create a production release with the same `.aab` and roll out. Google's review usually takes a few days.

### Store listing text

**App name:** Leapverse

**Short description (80 characters max):**
Mentored AI research projects for students. Build real work, not certificates.

**Full description:**

Leapverse helps college students make their next big leap in AI, research and careers.

Work on the latest AI research, from LLMs and agents to multimodal models, with mentors who are doing research right now. In six weeks you build working code, a paper-style report and a talk, then use them to apply for research internships, MS/PhD programs and AI jobs.

START WITH THE AI RESEARCH TRACK (PILOT)
• 6 weeks, live online classes, recorded for rewatching
• Teams of 2 to 3 students, weekly mentor review
• Problems from the latest AI research: large language models, AI agents, RAG, vision-language models, fine-tuning and evaluation
• Tools: Python, PyTorch, Hugging Face, open LLMs, vector search, GitHub, Colab, Overleaf

WHAT YOU LEAVE WITH
• A public GitHub project
• A 4 to 6 page research report
• A recorded 5-minute talk
• A research CV, professor emails and mock interview practice

WHO IT'S FOR
• Students applying for research internships
• MS and PhD aspirants
• Students who want careers as AI engineers and scientists
• Colleges looking for guided final-year research projects

You need basic Python. No research experience needed.

We never promise placements. We help you build work you can show.

**Category:** Education. **Tags:** Education, Online courses.

## Updating later

- **Website and app content:** edit `website/` and merge to `main`. The app shows the new content automatically. Bump `VERSION` in `website/sw.js` so phones drop the old cached copy.
- **App itself** (icon, name, package settings): rebuild with the same signing key, raise the version code by 1, upload a new release.
