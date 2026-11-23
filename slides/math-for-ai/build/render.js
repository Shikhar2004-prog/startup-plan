// Renders LaTeX (via KaTeX) and HTML/SVG diagrams to transparent PNGs with headless Chromium.
// Every job is cached by a hash of its content, so re-running the build only renders what changed.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { chromium } = require("playwright");

const CACHE = path.join(__dirname, "cache");
fs.mkdirSync(CACHE, { recursive: true });
const KATEX = path.join(__dirname, "node_modules", "katex", "dist");
const SCALE = 4; // device pixels per CSS pixel: crisp on projectors and 4K screens

const jobs = new Map();

function key(obj) {
  return crypto.createHash("sha1").update(JSON.stringify(obj)).digest("hex").slice(0, 16);
}

// A rendered image handle. path/w/h (inches) are filled in by renderAll().
function job(spec) {
  const id = key(spec);
  if (!jobs.has(id)) jobs.set(id, { id, spec, path: path.join(CACHE, id + ".png"), w: 0, h: 0 });
  return jobs.get(id);
}

// LaTeX equation. size = font size in points as it should appear on the slide.
function tex(src, opts = {}) {
  return job({ kind: "tex", src, size: opts.size || 24, color: opts.color || "#14254F", display: opts.display !== false });
}

// HTML/SVG diagram drawn at a fixed width in inches. $...$ inside is rendered as math.
function html(src, opts = {}) {
  return job({ kind: "html", src, w: opts.w || 10, color: opts.color || "#14254F" });
}

async function renderAll() {
  const pending = [...jobs.values()];
  const metaFile = path.join(CACHE, "meta.json");
  const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, "utf8")) : {};
  const todo = pending.filter((j) => !(meta[j.id] && fs.existsSync(j.path)));
  if (todo.length) {
    const browser = await chromium.launch();
    const page = await browser.newPage({ deviceScaleFactor: SCALE, viewport: { width: 2400, height: 1600 } });
    const base = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="file://${KATEX}/katex.min.css">
<script src="file://${KATEX}/katex.min.js"></script>
<script src="file://${KATEX}/contrib/auto-render.min.js"></script>
<style>
 html,body{margin:0;padding:0;background:transparent}
 #box{display:inline-block;padding:2px 4px;font-family:Calibri,Carlito,Arial,sans-serif}
 .katex{font-size:1em}
 .katex-display{margin:0}
</style></head><body><div id="box"></div></body></html>`;
    const basePath = path.join(CACHE, "_page.html");
    fs.writeFileSync(basePath, base);
    await page.goto("file://" + basePath, { waitUntil: "load" });
    for (const j of todo) {
      const s = j.spec;
      if (s.kind === "tex") {
        await page.evaluate(({ src, size, color, display }) => {
          const box = document.getElementById("box");
          box.style.width = "auto";
          box.style.fontSize = (size * 96) / 72 + "px";
          box.style.color = color;
          box.innerHTML = katex.renderToString(src, { displayMode: display, throwOnError: true, trust: true, strict: false });
        }, s);
      } else {
        await page.evaluate(({ src, w, color }) => {
          const box = document.getElementById("box");
          box.style.width = w * 96 + "px";
          box.style.fontSize = "18px";
          box.style.color = color;
          box.innerHTML = src;
          renderMathInElement(box, { delimiters: [{ left: "$", right: "$", display: false }], throwOnError: true, trust: true, strict: false });
        }, s);
      }
      await page.evaluate(() => document.fonts.ready);
      const el = await page.$("#box");
      const bb = await el.boundingBox();
      await el.screenshot({ path: j.path, omitBackground: true });
      meta[j.id] = { w: bb.width / 96, h: bb.height / 96 };
    }
    await browser.close();
    fs.writeFileSync(metaFile, JSON.stringify(meta));
  }
  for (const j of pending) Object.assign(j, meta[j.id]);
  return { total: pending.length, rendered: todo.length };
}

module.exports = { tex, html, renderAll };
