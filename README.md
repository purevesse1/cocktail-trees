# Cocktail Trees

My personal cocktail recipe collection, organised in tree form. One radial "family tree" per base spirit;
each arrow lists what is added (+) or dropped (−) from the parent drink.

Plain static site, no build step. Run locally:

    python -m http.server 8000   # then open http://localhost:8000

## Layout
- `index.html`: shell + all CSS
- `js/site.js`: hash routing, home view, tree chrome, "My bar" (localStorage `cocktail-bar-v1`), `PLANNED` and `LOG`
- `js/tree.js`: engine, `CocktailTree.mount(data, ui)` → `{paint, apply, destroy}`; card physics, camera
- `data/<base>.js`: `window.COCKTAIL_BASES.<base> = {W,H,hub,nodes,ings,blurb,...}`
- `tools/gen.py`: generator that lays out a tree and writes `data/<base>.js`

## Adding a base
1. Generate `data/<base>.js`.
2. Add `<script src="data/<base>.js">` before `js/tree.js` in `index.html`.
3. Add a `LOG` entry and remove it from `PLANNED` in `js/site.js`.
