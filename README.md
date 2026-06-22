# Spotify Remote

A static Vercel-ready Spotify front end that signs in with Authorization Code with PKCE, searches tracks and episodes, lists Spotify Connect devices, and sends play/pause/resume commands to the Spotify app.

The app has six tabs:

- Search: search tracks and episodes, then start playback in Spotify.
- Podcasts: list saved shows from your Spotify library, filter by category, and open each show's episodes in a modal, newest to oldest.
- News Queue: collect today's News podcast episodes that are not more than 90% played.
- Unfinished: show the 10 most recent unfinished episodes tracked by this app.
- Config: set each followed podcast's category and rank, with a category filter for the config list. Podcasts sort by rank by default.
- Connection: manage the Client ID, redirect URI, device target, and scopes.

## Spotify setup

1. Create an app in the Spotify Developer Dashboard.
2. Add redirect URIs for every origin you will use:
   - `http://127.0.0.1:5173/`
   - `https://YOUR-VERCEL-PROJECT.vercel.app/`
3. Copy the app Client ID into `config.js`, or paste it into the app UI and press Save.
4. If your Spotify app is in Development Mode, add every tester account in the dashboard or request an extension before broader use.

If Spotify shows `redirect_uri: Not matching configuration`, copy the Redirect URI shown in the app and add that exact value to the Spotify app settings. Spotify treats `http://127.0.0.1:5173/`, `http://localhost:5173/`, `http://127.0.0.1:5173`, and any Vercel preview URL as different redirect URIs.

The app requests these scopes:

- `user-read-playback-state`
- `user-read-currently-playing`
- `user-modify-playback-state`
- `user-library-read`
- `user-read-playback-position`

If you were already connected before a scope was added, sign out and connect again so Spotify grants the new scope.

## Run locally

```bash
npm run dev
```

Open `http://127.0.0.1:5173/`.

## GitHub and Vercel

This is a static Vercel app. To deploy:

1. Push this folder to GitHub.
2. In Vercel, import the GitHub repository.
3. Use these Vercel settings:
   - Framework Preset: `Other`
   - Build Command: `npm run build`
   - Output Directory: `public`
   - Install Command: leave default
   - Node.js Version: `22.x`
4. Deploy.
5. Add the deployed URL with a trailing slash to your Spotify app's Redirect URIs, for example `https://YOUR-VERCEL-PROJECT.vercel.app/`.

The Client ID can stay blank in `config.js`; you can paste it into the Connection tab after deployment and the app will store it in browser local storage.

## Important limits

- Spotify playback control requires Spotify Premium.
- The Spotify desktop or mobile app must be visible as a Spotify Connect device.
- Some device models are not exposed by Spotify's devices endpoint, and restricted devices will not accept Web API commands.
- The Podcasts tab uses Spotify saved shows (`GET /me/shows`) and show episodes (`GET /shows/{id}/episodes`).
- News Queue uses episode playback-position data to filter out episodes that are more than 90% played.
- Unfinished uses local app tracking because Spotify's recently played endpoint does not support podcast episodes.
- Podcast category, rank, and unfinished episode tracking are stored in this browser's local storage.
- Spotify does not expose a clear-queue endpoint. The News Queue button starts playback with the generated episode URI list, which replaces the active playback context as closely as Spotify's Web API allows.
- Refresh tokens issued to dashboard apps expire after 6 months, so users eventually need to connect again.
- Spotify's policy does not allow commercial streaming integrations, content alteration, synchronization with visual media, or non-interactive broadcasting through the platform.
