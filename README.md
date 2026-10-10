# DJ’s Click Booth — GitHub + Render edition

A portable photobooth with **32 filters**, mid-session and selected-photo retakes, print approval, event presets, readiness checks, gallery exports, folder backup, server backup and expiring QR downloads.

This edition runs on ordinary Node.js. It uses its own server admin login and disk storage; it does not require ChatGPT authentication, Cloudflare R2 or the Sites hosting plugin. Your existing hosted booth is a separate installation.

## Deploy from GitHub to Render

1. Create a GitHub repository. Upload the **contents** of this folder so `package.json`, `server.mjs`, `render.yaml` and `public/` are at the repository root. Include `.gitignore` and `package-lock.json`. Do not upload `.env`, `data/`, `node_modules/`, kiosk profiles or actual customer photos.
2. In Render choose **New → Blueprint**, connect the repository and apply `render.yaml`.
3. Set `BOOTH_ADMIN_PASSWORD` to a unique password of at least 12 characters when Render prompts. This is the server login password, separate from the familiar in-booth operator PIN **011623**. Render generates `SESSION_SECRET` automatically.
4. The Blueprint creates a Node web service with build command `npm ci`, start command `npm start`, health check `/healthz`, and a persistent disk mounted at `/var/data`. **The included service/disk configuration is paid.** Review Render’s displayed price before creating it.
5. Open the resulting HTTPS URL, enter the server admin password, connect the camera and run Event readiness. Your Render URL is detected automatically from `RENDER_EXTERNAL_URL`. For a custom domain, set `APP_URL` to its exact HTTPS origin and redeploy.

Alternatively create a **Web Service**, use `npm ci` / `npm start`, and configure the same environment variables and persistent disk yourself. A Static Site or GitHub Pages deployment cannot run the login, backups or QR endpoints. A disk-less free service can lose uploaded photos on restart/redeploy: keep the provided persistent-disk configuration for event use.

Primary deployment references: [Render Node services](https://render.com/docs/web-services), [Blueprint configuration](https://render.com/docs/blueprint-spec), [persistent disks](https://render.com/docs/disks), [default environment variables](https://render.com/docs/environment-variables).

## Run locally

Install Node.js 22 or 24. Run:

```sh
npm ci
```

Copy `.env.example` to `.env`, replace both placeholder secrets, then:

```sh
npm start
```

Visit `http://localhost:4173`. Do not open `public/index.html` directly. HTTPS or localhost is required for camera access. Keep `.env` private. To generate a session secret locally: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## Daily booth operation

Sign in with your server password. Open Operator with PIN **011623**, apply your event preset and run readiness checks. Connect a real camera, print and inspect a test sheet, and choose a backup folder. Enable private server backup if desired. Local gallery data is separate in each browser and website origin.

Guests can select any of 32 filters, search the collection, retake earlier photos during capture, then select an individual photo on review to retake. Filters retain the original captured JPEGs during that session. Finish & print starts printing only after approval. Regular browsers show a print dialog; for silent printing, edit `kiosk/booth-url.txt` to your Render URL and follow `kiosk/README.md`.

QR download links are created only when the operator/customer chooses and confirms sharing. Anyone with a link can access its single JPEG without logging in. Links expire after **7 days** and can be revoked with **Remove download link**. Expiry/revocation deletes the link record, not the owner's backup. Deleting a server photo makes all its links unusable. Backup JPEGs remain until deleted from the server backup library.

Server login sessions expire after 8 hours. API writes require the signed admin cookie and matching Origin. The server ignores spoofed ChatGPT/owner headers. Sign out from Operator when finished. Rotating `SESSION_SECRET` and restarting invalidates existing sessions.

## Backups and migration

Before switching from the current booth URL, download a complete event backup there. Restore it in Operator on Render, then optionally back up all keepsakes to the new server. Old QR URLs still point to their original host and cannot be moved automatically. Keep external event backup files as well as the persistent disk; a disk is not an independent backup.

Do not commit or publish runtime photos to GitHub. `DATA_DIR` contains private server JPEGs, metadata and link records. Treat it as confidential and back it up separately.

## Checks and limitations

Run `npm test` for server authorization, CSRF, upload validation, QR expiry/revocation and restart persistence tests. `npm run check` checks server syntax. Browser verification covers filter previews, printing triggers, retakes and mobile width; actual USB camera/printer compatibility needs testing on your hardware.

Direct DSLR control, silent printer-status monitoring and generative AI print design are not implemented. Instant print themes work locally. Camera capture works when Windows exposes the camera as a browser video device.
