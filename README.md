
# KirillChess (Next.js 14, Static Export Ready)

✅ Fixed `useSearchParams` for SSG
✅ `output: 'export'` already set
✅ Royal chess background pre-configured

## Use
1. Upload this repo to GitHub.
2. Install deps locally or in CI:
   ```bash
   npm i
   npm run build
   npm run export
   ```
3. Deploy the `out/` folder to GitHub Pages (or set up an action to publish `/out`).

You can edit content in:
- `app/(public)/tournaments/TournamentsView.tsx` (replace sample DATA with your JSON/API)
- `app/(public)/home/View.tsx` and other pages
- Background at `public/assets/bg-royal.svg`
