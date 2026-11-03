#!/bin/sh
# Live-reload server for both decks.
#
# Why this exists instead of `marp -s .`:
#
# Marp's server mode always watches its input directory (watch is forced on in
# server mode), and chokidar opens one inotify instance per watched directory.
# Pointed at the repo root, that is node_modules: ~1,170 directories. Linux
# caps inotify instances per user — fs.inotify.max_user_instances, 128 by
# default — so the watcher dies with "EMFILE: too many open files, watch ..."
# before the server ever starts, and the error names whichever theme CSS it was
# about to watch rather than node_modules.
#
# Serving a directory of symlinks keeps live editing (the watcher follows the
# links, so saving slides-eng.md reloads) and drops the watched tree to ~4
# directories.
#
# --allow-local-files matches the build:pdf:* scripts. The server index's PDF
# and PPTX links convert on demand, and without the flag Marp renders from a
# data: URI, so the relative assets/screenshots/* images would not resolve and
# the PDF would come out without them.
set -eu
cd "$(dirname "$0")/.."

rm -rf .serve
mkdir -p .serve
for entry in slides-customer.md slides-eng.md themes assets; do
  ln -s "../$entry" ".serve/$entry"
done

exec npx marp --no-stdin -s .serve --theme-set themes/ --allow-local-files "$@"
