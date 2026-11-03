// Post-process a Marp HTML build so every slide image can be opened full size.
//
// Marp scales the whole slide to the viewport, so a screenshot inside a slide is
// only ever a few hundred pixels wide — the numbers in an Optimizations table
// are unreadable when projected. Clicking (or Enter/Space) on an image opens it
// in a lightbox at close to the capture's own resolution. Escape or a click on
// the backdrop closes it.
//
// Runs on the built HTML only: PDFs cannot do this, and the published Pages
// artifact is a single self-contained file with no network access.

import { readFile, writeFile } from "node:fs/promises";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/zoomable-images.mjs <built.html>");
  process.exit(1);
}

const STYLE = `
section img { cursor: zoom-in; }
/* The wrapper must not move the image. It takes over the image's own box
   (block vs inline flow, centring) and the image becomes a plain block inside
   it, so a slide renders identically with and without the wrap. */
.zoom-wrap { position: relative; max-width: 100%; }
.zoom-wrap > img { display: block; margin: 0; }
.zoom-hint {
  position: absolute; top: 8px; right: 8px; width: 30px; height: 30px;
  border-radius: 50%; background: rgba(21, 21, 21, .68); color: #fff;
  display: grid; place-items: center; pointer-events: none;
  box-shadow: 0 1px 6px rgba(0, 0, 0, .35);
}
.zoom-wrap:focus-within .zoom-hint,
.zoom-wrap:hover .zoom-hint { background: rgba(21, 21, 21, .88); }
.zoom-lightbox {
  position: fixed; inset: 0; z-index: 2147483647;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14px; padding: 3vh 2vw; background: rgba(8, 8, 8, .965);
}
.zoom-lightbox[hidden] { display: none; }
.zoom-lightbox img {
  max-width: 96vw; max-height: 88vh; cursor: zoom-out;
  border-radius: 4px; box-shadow: 0 12px 60px rgba(0, 0, 0, .7);
}
.zoom-lightbox .zoom-caption {
  max-width: 72ch; text-align: center; color: #d9d9d9;
  font: 400 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
}
.zoom-lightbox .zoom-close {
  position: absolute; top: 12px; right: 18px; padding: 4px 8px;
  border: 0; background: transparent; color: #fff; font-size: 30px;
  line-height: 1; cursor: pointer;
}
`;

const SCRIPT = `
(function () {
  var GLASS = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"></circle><line x1="15.4" y1="15.4" x2="21" y2="21"></line><line x1="10.5" y1="7.5" x2="10.5" y2="13.5"></line><line x1="7.5" y1="10.5" x2="13.5" y2="10.5"></line></svg>';

  var box = document.createElement('div');
  box.className = 'zoom-lightbox';
  box.setAttribute('hidden', '');
  box.innerHTML =
    '<button class="zoom-close" type="button" aria-label="Close">&times;</button>' +
    '<img alt="">' +
    '<div class="zoom-caption"></div>';
  document.body.appendChild(box);

  var big = box.querySelector('img');
  var caption = box.querySelector('.zoom-caption');
  var opener = null;

  function close() {
    box.setAttribute('hidden', '');
    big.removeAttribute('src');
    caption.textContent = '';
    if (opener) { opener.focus(); opener = null; }
  }

  function open(img) {
    opener = img;
    big.src = img.currentSrc || img.src;
    big.alt = img.alt || '';
    caption.textContent = img.alt || '';
    box.removeAttribute('hidden');
    box.querySelector('.zoom-close').focus();
  }

  box.addEventListener('click', function (event) {
    if (event.target === box || event.target.classList.contains('zoom-close') ||
        event.target === big) close();
  });

  // While the lightbox is up it owns the keyboard: Escape closes, arrows and
  // space must not page the deck underneath.
  document.addEventListener('keydown', function (event) {
    if (box.hasAttribute('hidden')) return;
    var k = event.key;
    if (k === 'Escape') { event.stopPropagation(); close(); return; }
    if (k === 'ArrowRight' || k === 'ArrowLeft' || k === 'ArrowUp' ||
        k === 'ArrowDown' || k === 'PageUp' || k === 'PageDown' || k === ' ' || k === 'Enter') {
      event.stopPropagation();
      event.preventDefault();
    }
  }, true);

  var images = document.querySelectorAll('section img');
  for (var i = 0; i < images.length; i++) {
    (function (img) {
      if (img.closest('.zoom-wrap')) return;

      var wrap = document.createElement('span');
      wrap.className = 'zoom-wrap';

      // Reproduce the image's own box on the wrapper, or the slide reflows:
      // display decides block vs inline flow, and equal non-zero horizontal
      // margins mean the theme centred a block image with auto left/right.
      var cs = getComputedStyle(img);
      if (cs.display === 'block') {
        var left = parseFloat(cs.marginLeft) || 0;
        var right = parseFloat(cs.marginRight) || 0;
        wrap.style.display = 'block';
        wrap.style.width = 'fit-content';
        wrap.style.maxWidth = '100%';
        wrap.style.margin = left > 1 && Math.abs(left - right) < 1 ? '0 auto' : '0';
      } else {
        wrap.style.display = 'inline-block';
      }

      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);

      var hint = document.createElement('span');
      hint.className = 'zoom-hint';
      hint.setAttribute('aria-hidden', 'true');
      hint.innerHTML = GLASS;
      wrap.appendChild(hint);

      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', (img.alt || 'Screenshot') + ' — click to enlarge');

      img.addEventListener('click', function (event) {
        event.stopPropagation();
        open(img);
      });
      img.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          open(img);
        }
      });
    })(images[i]);
  }
})();
`;

const html = await readFile(file, "utf8");
const injected = `<style data-zoomable-images>${STYLE}</style>\n<script data-zoomable-images>${SCRIPT}</script>\n`;

if (html.includes("data-zoomable-images")) {
  console.error(`${file}: lightbox already present, nothing to do`);
  process.exit(0);
}
if (!html.includes("</body>")) {
  console.error(`${file}: no </body>, not a Marp HTML build`);
  process.exit(1);
}

await writeFile(file, html.replace("</body>", `${injected}</body>`), "utf8");
console.log(`${file}: images are clickable`);
