// Build decks: node build.js            -> all days found in days/
//              node build.js 1 2 3      -> selected days
// Run `python3 figures.py` first (plots), it writes fig/*.png.
const fs = require("fs");
const path = require("path");
const { deck } = require("./lib");
const D = require("./diagrams");
const { tex, html } = require("./render");

const FIG = path.join(__dirname, "fig");
function F(name) {
  const file = path.join(FIG, name + ".png");
  if (!fs.existsSync(file)) throw new Error("missing figure " + name + " (run python3 figures.py)");
  const b = fs.readFileSync(file);
  return { file, w: b.readUInt32BE(16) / 200, h: b.readUInt32BE(20) / 200 };
}

(async () => {
  const want = process.argv.slice(2).map(Number);
  const files = fs.readdirSync(path.join(__dirname, "days")).filter((f) => /^day\d+\.js$/.test(f)).sort();
  for (const f of files) {
    const mod = require("./days/" + f);
    if (want.length && !want.includes(mod.day)) continue;
    const d = deck({ day: mod.day, short: mod.short });
    mod.build(d, { F, D, tex, html });
    const out = path.join(__dirname, "..", "decks", mod.file + ".pptx");
    await d.write(out);
    console.log("wrote", path.relative(process.cwd(), out));
  }
})().catch((e) => { console.error(e); process.exit(1); });
