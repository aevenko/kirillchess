
# KirillChess Starter

A clean, modern chess-themed static site. Works on GitHub Pages. For web-based editing (no code), deploy to **Netlify** and enable **Decap CMS**.

## Quick start (GitHub Pages)
1. Create a new repo, e.g. `kirillchess.com`.
2. Upload all files. Enable Pages in Settings (main branch, root).
3. Edit `data/tournaments.json` to update rating & events.

## Better editing (recommended)
1. Create a Netlify site from this repo.
2. In `admin/config.yml`, replace `your-username/your-repo` with your GitHub repo path.
3. Enable Identity + Git Gateway in Netlify. Then visit `/admin` on your site to edit content in a web UI.

## Where is the data?
- `data/tournaments.json` — add new events to the top (most recent first).
- KPIs (FQE, CFC, FIDE) sit at `kpis` in the same JSON.

## Customize
- Background: replace `assets/bg.svg` (any 16:9 image works).
- Colors: tweak CSS variables at the top of `style.css`.

