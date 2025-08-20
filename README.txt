# kirillchess — Past Tournaments (2025)

Files included:
- `past.html` — a standalone page that renders the table.
- `data/past_tournaments.json` — the data source used by the page.
- `data/past_tournaments.csv` — same data if you prefer CSV.

## How to add to your site
1. Copy the `site/past.html` to your repo root (or under `/public` if using a framework).
2. Copy the `site/data/` folder (keeping the same structure) to the same relative path.
3. Create a menu link wherever you want (not shown on the home page if you prefer):
   ```html
   <a href="/past.html" target="_blank" rel="noopener">Past tournaments</a>
   ```
   This will open the page in a new tab and keep it out of the main page content.
4. Commit & push to GitHub. If you're using GitHub Pages, the page will be served at `/past.html` once deployed.
