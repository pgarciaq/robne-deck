#!/bin/sh
# Assemble the GitHub Pages artifact the way .github/workflows/pages.yml does,
# so a local preview can be checked before a push. Run from the repo root.
set -eu

if [ ! -f dist/customer.html ] || [ ! -f dist/eng.html ]; then
  echo "assemble-site: dist/ is missing a deck; run 'npm run preview:site' instead" >&2
  exit 1
fi

# The landing page links all four handouts; a missing one would ship a dead link.
for handout in customer.pdf eng.pdf customer.pptx eng.pptx; do
  if [ ! -f "dist/$handout" ]; then
    echo "assemble-site: dist/$handout is missing; run 'npm run preview:site' instead" >&2
    exit 1
  fi
done

rm -rf _site
mkdir -p _site

# The decks link assets/screenshots/* relatively, so the whole dist/ tree has
# to travel with them.
cp -r dist/. _site/

# Static landing page; customer.html and eng.html are its siblings.
cp site/index.html _site/index.html

echo "assemble-site: _site/ ready — index.html, customer.*, eng.*"
