# Fly Me to the Brew

Website for the coffee stand inside the YMCA lobby, 9055 Northlake Pkwy, Orlando, FL.

- `index.html` is the finished site (one self-contained file). Open it or host it as is.
- `privacy.html` is the privacy page.
- To change something, edit `parts/` (`body.html` = page, `brew.css` = colors, `script.js` = hours + sliders), then run `python3 build.py`.
- Hours live in the `HOURS` object at the top of `parts/script.js`. The departures board, the open-now card and the call button all read from it, so change them there once.
