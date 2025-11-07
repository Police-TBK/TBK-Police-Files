# TBK-Police Files

This is a ready-to-host static frontend for **TBK-Police Files** using **Firebase** (Authentication, Firestore, Storage).

## What's included
- `index.html` — main app (login, upload, track, admin dashboard)
- `app.js` — frontend logic using Firebase compat SDK
- `styles.css` — styles with dark/light mode
- `seed-users.js` — optional script to create 33 users + 1 admin (requires Firebase service account)
- `functions/` — optional Cloud Functions example (Telegram notifications + admin delete)
- `tbk.png` — placeholder logo

## Quick deploy (frontend only)
1. Edit `index.html` if you need to change the Firebase config (already set).
2. Push repository to GitHub.
3. In GitHub repo settings → Pages, choose `main` branch root and save.
4. Your site will be available at `https://<yourusername>.github.io/<repo>/`.

## Firebase setup notes
- In Firebase Console, enable Authentication (Email/Password), Firestore, and Storage.
- Update Firestore and Storage rules (sample rules in this repo recommended).
- For admin-only delete and Telegram notifications, deploy Cloud Functions (see `functions/`).

## Seed users
To create 33 users + 1 admin automatically, run the `seed-users.js` script with a Firebase service account JSON:
```bash
npm install firebase-admin
node seed-users.js /path/to/serviceAccountKey.json
```
Default password in script: `ChangeMe123!` — change after seeding.

## Telegram
Contact link in the UI points to: https://t.me/domunlocked

# TBK-Police-Files
# TBK-Police-Files
# TBK-Police-Files
