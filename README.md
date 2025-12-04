Project scaffold — static HTML/CSS/JS

Files created:
- `index.html` — main page, includes Handjet via CDN and links to `styles.css` + `script.js`.
- `styles.css` — theme variables and terminal layout (uses `--bg: #100e09`, `--fg: #cbcbcb`).
- `script.js` — small interactions (close terminal button).

How to view
1. Open `index.html` in your browser (double-click or right-click -> Open with).

Notes
- The Handjet font is linked from a CDN in `index.html`. If you prefer self-hosting, add font files to `assets/fonts/` and change the link to an `@font-face` rule in `styles.css`.
- Add `favicon.ico` to the project root or `assets/` and add a `<link rel="icon" href="...">` tag in `index.html`.

Next steps I can do for you
- Add typing cursor content in the terminal body.
- Export or include a favicon and additional assets.
- Improve responsive behavior or animations.
