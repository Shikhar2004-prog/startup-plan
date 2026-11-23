// Leapverse "Mathematics for AI" slide design system.
// One deck() per day. Each component adds one slide and takes speaker notes.
const path = require("path");
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const R = require("./render");

const ROOT = path.join(__dirname, "..", "..", "..");
const LOGO = path.join(ROOT, "brand", "logo-icon.png");

// Brand palette from source/make-logo.py
const HEX = {
  navy: "14254F", teal: "0F6E78", green: "12A58A", blue: "1B7FC4", gold: "F2B32A",
  mint: "7FE7C9", coral: "E0565F", violet: "6A5ACD", panel: "EEF3F8", white: "FFFFFF",
  muted: "5A6475", navy2: "1F3570", line: "D5DEE9",
};
const THEME = {
  name: "Leapverse Math",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: HEX.navy, lt1: HEX.white, dk2: HEX.teal, lt2: HEX.panel,
    accent1: HEX.green, accent2: HEX.blue, accent3: HEX.gold, accent4: HEX.mint,
    accent5: HEX.coral, accent6: HEX.violet, hlink: HEX.blue, folHlink: HEX.violet,
  },
};

const W = 13.333, H = 7.5, X0 = 0.6, X1 = 12.733, Y0 = 1.45, Y1 = 6.75;

// ---------- icons ----------
const ICONS = {
  bulb: fa.FaLightbulb, book: fa.FaBook, pen: fa.FaPenNib, check: fa.FaCheck, flask: fa.FaFlask,
  brain: fa.FaBrain, chart: fa.FaChartLine, cube: fa.FaCube, arrow: fa.FaArrowRight, target: fa.FaBullseye,
  warn: fa.FaExclamationTriangle, code: fa.FaCode, paper: fa.FaFileAlt, rocket: fa.FaRocket,
  layers: fa.FaLayerGroup, dice: fa.FaDice, compass: fa.FaCompass, eye: fa.FaEye, robot: fa.FaRobot,
  cog: fa.FaCog, star: fa.FaStar, link: fa.FaLink, search: fa.FaSearch, ruler: fa.FaRulerCombined,
  bolt: fa.FaBolt, balance: fa.FaBalanceScale, project: fa.FaProjectDiagram, graduate: fa.FaGraduationCap,
  question: fa.FaQuestion, mountain: fa.FaMountain, random: fa.FaRandom, filter: fa.FaFilter,
  compress: fa.FaCompressArrowsAlt, image: fa.FaImage, language: fa.FaLanguage, gamepad: fa.FaGamepad,
  calc: fa.FaCalculator, table: fa.FaTable, map: fa.FaMapSigns, microscope: fa.FaMicroscope,
};
const iconCache = {};
async function icon(name, color) {
  const k = name + color;
  if (!iconCache[k]) {
    const Comp = ICONS[name];
    if (!Comp) throw new Error("unknown icon " + name);
    const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: "256" }));
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    iconCache[k] = "image/png;base64," + buf.toString("base64");
  }
  return iconCache[k];
}

// ---------- rich text: **bold** and ==highlight== ----------
function runs(str, base = {}, hl = HEX.teal) {
  if (Array.isArray(str)) return str;
  const out = [];
  const re = /(\*\*[^*]+\*\*|==.+?==)/g;
  let last = 0, m;
  while ((m = re.exec(str))) {
    if (m.index > last) out.push({ text: str.slice(last, m.index), options: { ...base } });
    const t = m[0];
    if (t.startsWith("**")) out.push({ text: t.slice(2, -2), options: { ...base, bold: true } });
    else out.push({ text: t.slice(2, -2), options: { ...base, bold: true, color: hl } });
    last = m.index + t.length;
  }
  if (last < str.length) out.push({ text: str.slice(last), options: { ...base } });
  return out;
}
function bullets(items, base = {}, hl) {
  const out = [];
  items.forEach((it, i) => {
    const rs = runs(it, base, hl);
    rs.forEach((r, j) => {
      const o = { ...r.options };
      if (j === 0) { o.bullet = { indent: 18 }; o.paraSpaceAfter = base.paraSpaceAfter ?? 8; }
      if (j === rs.length - 1 && i < items.length - 1) o.breakLine = true;
      out.push({ text: r.text, options: o });
    });
  });
  return out;
}

function shadow() { return { type: "outer", color: "8090A8", opacity: 0.25, blur: 8, offset: 2, angle: 90 }; }

// ---------- deck ----------
function deck({ day, short }) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  pres.author = "Shikhar Dubey · Leapverse";
  pres.company = "Leapverse";
  pres.title = day ? `Mathematics for AI · Day ${day}: ${short}` : "Mathematics for AI · Program overview";
  const C = pres.SchemeColor;
  const dd = day ? String(day).padStart(2, "0") : "";
  const footer = day ? `Mathematics for AI  ·  Day ${dd}  ·  ${short}` : "Mathematics for AI  ·  15-day program";

  pres.defineSlideMaster({
    title: "Title", background: { color: HEX.navy },
    objects: [
      { image: { path: LOGO, x: 0.8, y: 0.55, w: 0.5, h: 0.5 } },
      { text: { text: "Leapverse", options: { x: 1.4, y: 0.55, w: 3, h: 0.5, fontSize: 18, bold: true, color: C.background1, valign: "middle", margin: 0 } } },
      { text: { text: "Mathematics for AI  ·  a 15-day program by Shikhar Dubey", options: { x: 0.8, y: 6.75, w: 8, h: 0.35, fontSize: 11, color: C.accent4, margin: 0 } } },
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.0, w: 7.6, h: 1.9, fontSize: 42, bold: true, color: C.background1, valign: "bottom", align: "left", margin: 0, fontFace: THEME.headFontFace }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 4.05, w: 7.4, h: 1.0, fontSize: 19, color: C.accent4, valign: "top", align: "left", margin: 0 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "Section", background: { color: HEX.navy },
    objects: [
      { image: { path: LOGO, x: 12.2, y: 6.75, w: 0.36, h: 0.36 } },
      { placeholder: { options: { name: "title", type: "title", x: 1.2, y: 2.9, w: 10.5, h: 1.3, fontSize: 40, bold: true, color: C.background1, valign: "middle", align: "left", margin: 0, fontFace: THEME.headFontFace }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 1.2, y: 4.25, w: 10.5, h: 1.0, fontSize: 19, color: C.accent4, valign: "top", align: "left", margin: 0 }, text: "" } },
    ],
    slideNumber: { x: 11.6, y: 6.78, w: 0.5, h: 0.3, fontSize: 10, color: HEX.mint, align: "right" },
  });
  pres.defineSlideMaster({
    title: "Content", background: { color: HEX.white },
    objects: [
      { text: { text: footer, options: { x: X0, y: 7.0, w: 9, h: 0.3, fontSize: 10, color: HEX.muted, margin: 0 } } },
      { image: { path: LOGO, x: 12.43, y: 6.98, w: 0.3, h: 0.3 } },
      { placeholder: { options: { name: "title", type: "title", x: X0, y: 0.4, w: X1 - X0, h: 0.85, fontSize: 30, bold: true, color: C.text1, valign: "middle", align: "left", margin: 0, fontFace: THEME.headFontFace }, text: "" } },
    ],
    slideNumber: { x: 11.75, y: 7.0, w: 0.55, h: 0.3, fontSize: 10, color: HEX.muted, align: "right" },
  });
  pres.defineSlideMaster({
    title: "Dark content", background: { color: HEX.navy },
    objects: [
      { text: { text: footer, options: { x: X0, y: 7.0, w: 9, h: 0.3, fontSize: 10, color: HEX.mint, margin: 0 } } },
      { image: { path: LOGO, x: 12.43, y: 6.98, w: 0.3, h: 0.3 } },
      { placeholder: { options: { name: "title", type: "title", x: X0, y: 0.4, w: X1 - X0, h: 0.85, fontSize: 30, bold: true, color: C.background1, valign: "middle", align: "left", margin: 0, fontFace: THEME.headFontFace }, text: "" } },
    ],
    slideNumber: { x: 11.75, y: 7.0, w: 0.55, h: 0.3, fontSize: 10, color: HEX.mint, align: "right" },
  });

  const ops = []; // deferred: run after equations are rendered
  let section = null;
  const api = { pres, C, HEX, day, ops };

  function add(master, fn) {
    ops.push(async () => {
      const s = pres.addSlide({ masterName: master, sectionTitle: section });
      await fn(s);
    });
  }
  api.section = (title) => { ops.push(async () => { section = title; pres.addSection({ title }); }); };

  // ---- primitives ----
  const T = (s, text, o) => s.addText(typeof text === "string" ? runs(text, {}) : text, { isTextBox: true, margin: 0, valign: "top", ...o });
  const card = (s, x, y, w, h, fill, o = {}) =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: o.line ? { color: o.line, width: 1 } : { type: "none" }, shadow: o.shadow ? shadow() : undefined, objectName: o.name });
  async function badge(s, x, y, d, ic, fill, fg = HEX.white) {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" } });
    const p = d * 0.22;
    s.addImage({ data: await icon(ic, fg), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
  }
  function num(s, x, y, d, n, fill, fg = C.background1) {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" } });
    T(s, String(n), { x, y, w: d, h: d, fontSize: Math.round(d * 34), bold: true, color: fg, align: "center", valign: "middle" });
  }
  // Fit a rendered image (equation/diagram) into a box without upscaling past its natural size * maxScale.
  function fit(s, img, x, y, w, h, o = {}) {
    const k = Math.min(o.maxScale || 1, w / img.w, h / img.h);
    const iw = img.w * k, ih = img.h * k;
    const ax = o.align === "left" ? x : o.align === "right" ? x + w - iw : x + (w - iw) / 2;
    const ay = o.valign === "top" ? y : o.valign === "bottom" ? y + h - ih : y + (h - ih) / 2;
    s.addImage({ path: img.path, x: ax, y: ay, w: iw, h: ih, altText: o.alt || (img.spec.src && img.spec.kind === "tex" ? img.spec.src : "diagram") });
    return { x: ax, y: ay, w: iw, h: ih };
  }
  function fitFile(s, file, iw0, ih0, x, y, w, h) {
    const k = Math.min(w / iw0, h / ih0);
    const iw = iw0 * k, ih = ih0 * k;
    s.addImage({ path: file, x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih });
  }
  const tx = (src, o = {}) => R.tex(src, o);
  const txw = (src, o = {}) => R.tex(src, { ...o, color: "#FFFFFF" });
  api.T = T; api.card = card; api.badge = badge; api.fit = fit; api.num = num;

  // ---------- components ----------
  api.title = ({ title, subtitle, topics = [], eq, eqLabel = "Equation of the day", notes }) => {
    const e = eq && txw(eq, { size: 40 });
    add("Title", async (s) => {
      T(s, `DAY ${dd}  /  15`, { x: 0.8, y: 1.55, w: 4, h: 0.4, fontSize: 15, bold: true, color: C.accent3, charSpacing: 3 });
      s.addText(title, { placeholder: "title" });
      s.addText(subtitle, { placeholder: "body" });
      let cx = 0.8;
      const cy = 5.45;
      topics.forEach((t) => {
        const w = Math.max(1.1, t.length * 0.095 + 0.45);
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: cy, w, h: 0.42, rectRadius: 0.21, fill: { color: HEX.navy2 }, line: { color: HEX.mint, width: 0.75 } });
        T(s, t, { x: cx, y: cy, w, h: 0.42, fontSize: 12, color: C.background1, align: "center", valign: "middle" });
        cx += w + 0.15;
      });
      if (e) {
        card(s, 8.85, 1.55, 3.85, 3.6, HEX.navy2);
        T(s, eqLabel.toUpperCase(), { x: 9.1, y: 1.8, w: 3.4, h: 0.3, fontSize: 11, bold: true, color: C.accent3, charSpacing: 2 });
        fit(s, e, 9.05, 2.25, 3.45, 2.6);
      }
      if (notes) s.addNotes(notes);
    });
  };

  api.objectives = ({ title = "Today's goals", goals, why, prereq, notes }) => {
    add("Content", async (s) => {
      s.addText(title, { placeholder: "title" });
      const n = goals.length, rh = Math.min(0.85, 4.3 / n);
      goals.forEach((g, i) => {
        const y = Y0 + 0.05 + i * rh;
        num(s, X0, y, 0.44, i + 1, C.accent1);
        T(s, g, { x: X0 + 0.62, y: y - 0.02, w: 6.7, h: rh - 0.05, fontSize: 16, color: C.text1, valign: "top" });
      });
      card(s, 8.25, Y0, 4.48, 2.75, HEX.navy, { shadow: true });
      await badge(s, 8.5, Y0 + 0.25, 0.5, "brain", HEX.gold, HEX.navy);
      T(s, "Why this matters in AI", { x: 9.12, y: Y0 + 0.25, w: 3.4, h: 0.5, fontSize: 16, bold: true, color: C.accent3, valign: "middle" });
      T(s, runs(why, {}, HEX.mint), { x: 8.5, y: Y0 + 0.9, w: 4.0, h: 1.75, fontSize: 14, color: C.background1 });
      if (prereq) {
        card(s, 8.25, Y0 + 2.95, 4.48, 1.4, HEX.panel);
        T(s, "You should already know", { x: 8.5, y: Y0 + 3.1, w: 4, h: 0.3, fontSize: 13, bold: true, color: C.text2 });
        T(s, prereq, { x: 8.5, y: Y0 + 3.45, w: 4.0, h: 0.85, fontSize: 13, color: C.text1 });
      }
      // 15-day journey tracker
      const ty = 6.12, gap = (X1 - X0 - 0.5) / 14;
      s.addShape(pres.shapes.LINE, { x: X0 + 0.25, y: ty + 0.2, w: X1 - X0 - 0.5, h: 0, line: { color: HEX.line, width: 2 } });
      for (let i = 1; i <= 15; i++) {
        const cx = X0 + 0.25 + (i - 1) * gap;
        const cur = i === day, done = i < day;
        const d = cur ? 0.5 : 0.36;
        s.addShape(pres.shapes.OVAL, { x: cx - d / 2, y: ty + 0.2 - d / 2, w: d, h: d, fill: { color: cur ? HEX.gold : done ? HEX.green : HEX.white }, line: { color: cur ? HEX.gold : done ? HEX.green : HEX.line, width: 1.5 } });
        T(s, String(i), { x: cx - d / 2, y: ty + 0.2 - d / 2, w: d, h: d, fontSize: cur ? 14 : 11, bold: true, color: cur ? C.text1 : done ? C.background1 : HEX.muted, align: "center", valign: "middle" });
      }
      T(s, "Your 15-day journey", { x: X0, y: ty + 0.48, w: 4, h: 0.25, fontSize: 10, color: HEX.muted });
      if (notes) s.addNotes(notes);
    });
  };

  api.divider = ({ kicker, title, sub, notes }) => {
    add("Section", async (s) => {
      T(s, kicker.toUpperCase(), { x: 1.2, y: 2.4, w: 8, h: 0.4, fontSize: 15, bold: true, color: C.accent3, charSpacing: 3 });
      s.addText(title, { placeholder: "title" });
      if (sub) s.addText(sub, { placeholder: "body" });
      if (notes) s.addNotes(notes);
    });
  };

  api.concept = ({ title, intuition, def, defLabel = "Formal definition", defNote, notes, eqSize = 26 }) => {
    const e = def && txw(def, { size: eqSize });
    add("Content", async (s) => {
      s.addText(title, { placeholder: "title" });
      card(s, X0, Y0, 5.85, 5.2, HEX.panel);
      await badge(s, X0 + 0.3, Y0 + 0.3, 0.5, "bulb", HEX.gold, HEX.navy);
      T(s, "Intuition", { x: X0 + 0.95, y: Y0 + 0.3, w: 4, h: 0.5, fontSize: 18, bold: true, color: C.text1, valign: "middle" });
      T(s, bullets(intuition, { fontSize: 16, color: HEX.navy, paraSpaceAfter: 12 }), { x: X0 + 0.3, y: Y0 + 1.05, w: 5.25, h: 3.95 });
      card(s, 6.75, Y0, 5.98, 5.2, HEX.navy, { shadow: true });
      await badge(s, 7.05, Y0 + 0.3, 0.5, "book", HEX.mint, HEX.navy);
      T(s, defLabel, { x: 7.7, y: Y0 + 0.3, w: 4.8, h: 0.5, fontSize: 18, bold: true, color: C.accent4, valign: "middle" });
      const eh = defNote ? 2.35 : 3.7;
      if (e) fit(s, e, 7.05, Y0 + 1.0, 5.38, eh);
      if (defNote) T(s, runs(defNote, {}, HEX.gold), { x: 7.05, y: Y0 + 1.15 + eh, w: 5.38, h: 5.2 - eh - 1.35, fontSize: 14, color: C.background1 });
      if (notes) s.addNotes(notes);
    });
  };

  api.equation = ({ title, eq, legend = [], foot, notes, eqSize = 34 }) => {
    const e = tx(eq, { size: eqSize });
    const L = legend.map(([t, m]) => [tx(t, { size: 20, display: false }), m]);
    add("Content", async (s) => {
      s.addText(title, { placeholder: "title" });
      card(s, X0, Y0, X1 - X0, 2.05, HEX.panel);
      fit(s, e, X0 + 0.3, Y0 + 0.15, X1 - X0 - 0.6, 1.75);
      const cols = L.length > 3 ? 2 : 1, rows = Math.ceil(L.length / cols);
      const cw = (X1 - X0) / cols, rh = Math.min(0.72, (foot ? 2.25 : 2.9) / Math.max(rows, 1));
      L.forEach(([img, m], i) => {
        const c = cols === 2 ? Math.floor(i / rows) : 0, r = cols === 2 ? i % rows : i;
        const x = X0 + c * cw, y = 3.75 + r * rh;
        fit(s, img, x, y, 1.35, rh - 0.1, { align: "right" });
        T(s, m, { x: x + 1.55, y, w: cw - 1.75, h: rh - 0.1, fontSize: 15, color: C.text1, valign: "middle" });
      });
      if (foot) {
        card(s, X0, 6.05, X1 - X0, 0.7, HEX.navy);
        T(s, runs(foot, {}, HEX.gold), { x: X0 + 0.3, y: 6.05, w: X1 - X0 - 0.6, h: 0.7, fontSize: 15, color: C.background1, valign: "middle" });
      }
      if (notes) s.addNotes(notes);
    });
  };

  api.example = ({ title, problem, problemEq, steps, answer, notes, stepSize = 22 }) => {
    const pe = problemEq && tx(problemEq, { size: 22 });
    const S = steps.map((st) => ({ img: tx(st.eq, { size: stepSize }), note: st.note }));
    add("Content", async (s) => {
      s.addText(title, { placeholder: "title" });
      card(s, X0, Y0, 3.85, 5.3, HEX.panel);
      await badge(s, X0 + 0.25, Y0 + 0.25, 0.48, "pen", HEX.blue);
      T(s, "Worked example", { x: X0 + 0.85, y: Y0 + 0.25, w: 2.9, h: 0.48, fontSize: 16, bold: true, color: C.text1, valign: "middle" });
      const ph = pe ? 2.3 : 4.2;
      T(s, problem, { x: X0 + 0.25, y: Y0 + 0.95, w: 3.35, h: ph, fontSize: 15, color: C.text1 });
      if (pe) { card(s, X0 + 0.2, Y0 + 3.35, 3.45, 1.7, HEX.white); fit(s, pe, X0 + 0.3, Y0 + 3.45, 3.25, 1.5); }
      const n = S.length, top = Y0 + 0.05, avail = answer ? 4.45 : 5.2, rh = Math.min(1.15, avail / n);
      S.forEach((st, i) => {
        const y = top + i * rh;
        num(s, 4.75, y + (rh - 0.4) / 2 - 0.03, 0.4, i + 1, C.accent2);
        fit(s, st.img, 5.3, y, st.note ? 4.6 : 7.4, rh - 0.12, { align: "left" });
        if (st.note) T(s, st.note, { x: 10.25, y, w: 2.48, h: rh - 0.08, fontSize: 13, color: HEX.muted, valign: "middle" });
        if (i < n - 1) s.addShape(pres.shapes.LINE, { x: 5.3, y: y + rh - 0.04, w: X1 - 5.3, h: 0, line: { color: HEX.line, width: 0.75, dashType: "dash" } });
      });
      if (answer) {
        card(s, 4.75, 6.05, X1 - 4.75, 0.7, HEX.gold);
        T(s, runs(answer, {}, HEX.navy), { x: 5.0, y: 6.05, w: X1 - 5.25, h: 0.7, fontSize: 16, color: C.text1, valign: "middle" });
      }
      if (notes) s.addNotes(notes);
    });
  };

  // fig = { file, w, h } (inches, aspect) from figures.py, or a rendered html() image
  api.figure = ({ title, fig, points = [], caption, notes, wide }) => {
    add("Content", async (s) => {
      s.addText(title, { placeholder: "title" });
      const fw = wide || !points.length ? X1 - X0 : 7.35;
      const fh = caption ? 4.85 : 5.25;
      if (fig.path) fit(s, fig, X0, Y0, fw, fh, { maxScale: 3 });
      else fitFile(s, fig.file, fig.w, fig.h, X0, Y0, fw, fh);
      if (caption) T(s, caption, { x: X0, y: Y0 + fh + 0.08, w: fw, h: 0.35, fontSize: 12, italic: true, color: HEX.muted, align: "center" });
      if (points.length && fw < 10) {
        const px = 8.25, rh = Math.min(1.3, 5.2 / points.length);
        for (let i = 0; i < points.length; i++) {
          const y = Y0 + i * rh;
          card(s, px, y, X1 - px, rh - 0.15, HEX.panel);
          await badge(s, px + 0.18, y + 0.18, 0.36, points[i].icon || "check", HEX.green);
          T(s, runs(points[i].text || points[i]), { x: px + 0.68, y: y + 0.12, w: X1 - px - 0.85, h: rh - 0.38, fontSize: 14, color: C.text1, valign: "middle" });
        }
      } else if (points.length) {
        // points under a wide figure as chips
      }
      if (notes) s.addNotes(notes);
    });
  };

  // Full-width diagram with optional takeaway chips beneath
  api.diagram = ({ title, diag, chips = [], notes }) => {
    add("Content", async (s) => {
      s.addText(title, { placeholder: "title" });
      const dh = chips.length ? 3.95 : 5.25;
      fit(s, diag, X0, Y0, X1 - X0, dh, { maxScale: 3 });
      if (chips.length) {
        const n = chips.length, gap = 0.25, cw = (X1 - X0 - gap * (n - 1)) / n;
        chips.forEach(([head, text], i) => {
          const x = X0 + i * (cw + gap);
          card(s, x, 5.55, cw, 1.2, HEX.panel);
          T(s, head, { x: x + 0.2, y: 5.63, w: cw - 0.4, h: 0.32, fontSize: 14, bold: true, color: C.text2 });
          T(s, text, { x: x + 0.2, y: 5.95, w: cw - 0.4, h: 0.75, fontSize: 13, color: C.text1 });
        });
      }
      if (notes) s.addNotes(notes);
    });
  };

  api.compare = ({ title, cols, notes, foot }) => {
    const E = cols.map((c) => c.eq && tx(c.eq, { size: c.eqSize || 22 }));
    add("Content", async (s) => {
      s.addText(title, { placeholder: "title" });
      const n = cols.length, gap = 0.3, cw = (X1 - X0 - gap * (n - 1)) / n, ch = foot ? 4.45 : 5.25;
      const colors = [HEX.green, HEX.blue, HEX.violet, HEX.coral];
      for (let i = 0; i < n; i++) {
        const c = cols[i], x = X0 + i * (cw + gap), col = c.color ? HEX[c.color] : colors[i];
        card(s, x, Y0, cw, ch, HEX.panel);
        await badge(s, x + 0.25, Y0 + 0.25, 0.5, c.icon || "cube", col);
        T(s, c.head, { x: x + 0.9, y: Y0 + 0.22, w: cw - 1.05, h: 0.56, fontSize: 17, bold: true, color: C.text1, valign: "middle" });
        let y = Y0 + 0.95;
        if (E[i]) { const r = fit(s, E[i], x + 0.2, y, cw - 0.4, c.eqH || 0.9); y += (c.eqH || 0.9) + 0.15; }
        T(s, bullets(c.items, { fontSize: c.fontSize || 15, color: HEX.navy, paraSpaceAfter: 6 }), { x: x + 0.25, y, w: cw - 0.45, h: Y0 + ch - y - 0.15 });
      }
      if (foot) {
        card(s, X0, 6.05, X1 - X0, 0.7, HEX.navy);
        T(s, runs(foot, {}, HEX.gold), { x: X0 + 0.3, y: 6.05, w: X1 - X0 - 0.6, h: 0.7, fontSize: 15, color: C.background1, valign: "middle" });
      }
      if (notes) s.addNotes(notes);
    });
  };

  api.code = ({ title, code, points = [], notes, fontSize = 13 }) => {
    add("Content", async (s) => {
      s.addText(title, { placeholder: "title" });
      card(s, X0, Y0, 7.4, 5.25, "0E1A38");
      const lines = code.replace(/\n$/, "").split("\n");
      T(s, lines.map((l, i) => ({ text: l || " ", options: { breakLine: i < lines.length - 1, color: l.trim().startsWith("#") ? HEX.mint : "E8EEF7" } })),
        { x: X0 + 0.3, y: Y0 + 0.25, w: 6.8, h: 4.8, fontSize, fontFace: "Courier New", lineSpacingMultiple: 1.05 });
      const px = 8.3, rh = Math.min(1.3, 5.25 / Math.max(points.length, 1));
      for (let i = 0; i < points.length; i++) {
        const y = Y0 + i * rh;
        await badge(s, px, y + 0.05, 0.4, "code", HEX.teal);
        T(s, points[i], { x: px + 0.55, y, w: X1 - px - 0.55, h: rh - 0.1, fontSize: 14, color: C.text1 });
      }
      if (notes) s.addNotes(notes);
    });
  };

  api.paper = ({ title = "How it looks in a research paper", rows, notes }) => {
    const E = rows.map((r) => tx(r.eq, { size: 20 }));
    add("Content", async (s) => {
      s.addText(title, { placeholder: "title" });
      const n = rows.length, rh = Math.min(1.35, 5.25 / n);
      T(s, "WRITTEN IN THE PAPER", { x: X0, y: Y0 - 0.05, w: 6, h: 0.3, fontSize: 11, bold: true, color: HEX.muted, charSpacing: 2 });
      T(s, "SAY IT OUT LOUD", { x: 7.7, y: Y0 - 0.05, w: 5, h: 0.3, fontSize: 11, bold: true, color: HEX.muted, charSpacing: 2 });
      for (let i = 0; i < n; i++) {
        const y = Y0 + 0.3 + i * rh;
        card(s, X0, y, 6.35, rh - 0.18, HEX.white, { line: HEX.line, shadow: true });
        fit(s, E[i], X0 + 0.2, y + 0.08, 5.95, rh - 0.34);
        await badge(s, 7.1, y + (rh - 0.18) / 2 - 0.2, 0.4, "arrow", HEX.teal);
        T(s, runs(rows[i].read), { x: 7.7, y, w: X1 - 7.7, h: rh - 0.18, fontSize: 15, color: C.text1, valign: "middle" });
        if (rows[i].src) T(s, rows[i].src, { x: X0 + 0.15, y: y + rh - 0.42, w: 6.1, h: 0.22, fontSize: 9, italic: true, color: HEX.muted, align: "right" });
      }
      if (notes) s.addNotes(notes);
    });
  };

  api.exercises = ({ items, notes }) => {
    const E = items.map((it) => it.eq && tx(it.eq, { size: 18 }));
    add("Content", async (s) => {
      s.addText("Practice problems", { placeholder: "title" });
      const n = items.length, cols = n > 4 ? 3 : 2, rows = Math.ceil(n / cols);
      const gap = 0.25, cw = (X1 - X0 - gap * (cols - 1)) / cols, ch = (5.3 - gap * (rows - 1)) / rows;
      const lv = { "Warm-up": HEX.green, Core: HEX.blue, Challenge: HEX.coral, Research: HEX.violet, Code: HEX.teal };
      items.forEach((it, i) => {
        const x = X0 + (i % cols) * (cw + gap), y = Y0 + Math.floor(i / cols) * (ch + gap);
        card(s, x, y, cw, ch, HEX.panel);
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.2, y: y + 0.18, w: 1.3, h: 0.32, rectRadius: 0.16, fill: { color: lv[it.lvl] || HEX.blue }, line: { type: "none" } });
        T(s, `${i + 1}. ${it.lvl}`, { x: x + 0.2, y: y + 0.18, w: 1.3, h: 0.32, fontSize: 11, bold: true, color: C.background1, align: "center", valign: "middle" });
        const eh = E[i] ? Math.min(0.85, ch * 0.35) : 0;
        T(s, it.text, { x: x + 0.2, y: y + 0.62, w: cw - 0.4, h: ch - 0.75 - eh, fontSize: 13.5, color: C.text1 });
        if (E[i]) fit(s, E[i], x + 0.2, y + ch - eh - 0.12, cw - 0.4, eh);
      });
      if (notes) s.addNotes(notes);
    });
  };

  api.recap = ({ points, next, nextTopics, notes, title = "Recap: what to remember" }) => {
    add("Dark content", async (s) => {
      s.addText(title, { placeholder: "title" });
      const n = points.length, rh = Math.min(0.9, 5.2 / n);
      for (let i = 0; i < n; i++) {
        const y = Y0 + i * rh;
        await badge(s, X0, y + 0.04, 0.38, "check", HEX.green);
        T(s, runs(points[i], {}, HEX.mint), { x: X0 + 0.58, y, w: 6.9, h: rh - 0.05, fontSize: 15, color: C.background1 });
      }
      if (next) {
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.3, y: Y0, w: 4.43, h: 3.4, rectRadius: 0.12, fill: { color: HEX.navy2 }, line: { color: HEX.gold, width: 1.5 } });
        await badge(s, 8.55, Y0 + 0.25, 0.5, "rocket", HEX.gold, HEX.navy);
        T(s, day < 15 ? `Next: Day ${day + 1}` : "What's next", { x: 9.2, y: Y0 + 0.25, w: 3.4, h: 0.5, fontSize: 17, bold: true, color: C.accent3, valign: "middle" });
        T(s, next, { x: 8.55, y: Y0 + 0.95, w: 3.95, h: 0.75, fontSize: 18, bold: true, color: C.background1, fontFace: THEME.headFontFace });
        if (nextTopics) T(s, bullets(nextTopics, { fontSize: 13, color: HEX.mint, paraSpaceAfter: 3 }), { x: 8.55, y: Y0 + 1.75, w: 3.95, h: 1.55 });
      }
      if (notes) s.addNotes(notes);
    });
  };

  api.rows = ({ title, rows, notes, cols = 1 }) => {
    add("Content", async (s) => {
      s.addText(title, { placeholder: "title" });
      const n = rows.length, per = Math.ceil(n / cols), gap = 0.3, cw = (X1 - X0 - gap * (cols - 1)) / cols, rh = Math.min(1.35, 5.3 / per);
      for (let i = 0; i < n; i++) {
        const c = Math.floor(i / per), r = i % per, x = X0 + c * (cw + gap), y = Y0 + r * rh;
        const [ic, head, text] = rows[i];
        card(s, x, y, cw, rh - 0.15, HEX.panel);
        await badge(s, x + 0.22, y + (rh - 0.15) / 2 - 0.27, 0.54, ic, [HEX.green, HEX.blue, HEX.violet, HEX.teal, HEX.coral, HEX.gold][i % 6]);
        T(s, head, { x: x + 0.95, y: y + 0.1, w: cw - 1.1, h: 0.36, fontSize: 16, bold: true, color: C.text1, valign: "middle" });
        T(s, runs(text), { x: x + 0.95, y: y + 0.46, w: cw - 1.15, h: rh - 0.68, fontSize: 13.5, color: C.text1 });
      }
      if (notes) s.addNotes(notes);
    });
  };

  api.table = ({ title, head, rows, notes, colW, foot, fontSize = 14 }) => {
    add("Content", async (s) => {
      s.addText(title, { placeholder: "title" });
      const hdr = head.map((h) => ({ text: h, options: { bold: true, color: C.background1, fill: { color: HEX.navy }, fontSize } }));
      const body = rows.map((r, i) => r.map((c) => ({ text: runs(c, { fontSize, color: HEX.navy }), options: { fill: { color: i % 2 ? HEX.white : HEX.panel } } })));
      s.addTable([hdr, ...body], { x: X0, y: Y0, w: X1 - X0, colW, border: { type: "solid", color: HEX.line, pt: 0.75 }, fontSize, color: C.text1, valign: "middle", margin: [5, 8, 5, 8] });
      if (foot) {
        card(s, X0, 6.05, X1 - X0, 0.7, HEX.navy);
        T(s, runs(foot, {}, HEX.gold), { x: X0 + 0.3, y: 6.05, w: X1 - X0 - 0.6, h: 0.7, fontSize: 15, color: C.background1, valign: "middle" });
      }
      if (notes) s.addNotes(notes);
    });
  };

  // Big statement slide with optional equation
  api.big = ({ title, statement, eq, sub, notes }) => {
    const e = eq && tx(eq, { size: 40 });
    add("Content", async (s) => {
      s.addText(title, { placeholder: "title" });
      T(s, runs(statement), { x: 1.2, y: Y0 + 0.2, w: 10.9, h: 1.2, fontSize: 24, color: C.text1, align: "center", valign: "middle", fontFace: THEME.headFontFace });
      if (e) { card(s, 1.5, 3.05, 10.33, 2.1, HEX.panel); fit(s, e, 1.8, 3.15, 9.73, 1.9); }
      if (sub) T(s, runs(sub), { x: 1.5, y: 5.4, w: 10.33, h: 1.1, fontSize: 16, color: HEX.muted, align: "center", valign: "top" });
      if (notes) s.addNotes(notes);
    });
  };

  api.write = async (file) => {
    await R.renderAll();
    for (const op of ops) await op();
    await pres.writeFile({ fileName: file });
    await fixParagraphs(file);
    const { applyTheme } = require(APPLY_THEME);
    await applyTheme(file, THEME);
  };
  return api;
}

// pptxgenjs writes one <a:pPr> per run; PowerPoint and LibreOffice then read the paragraph's
// bullet from the wrong one. Keep only the first <a:pPr> in each paragraph.
async function fixParagraphs(file) {
  const JSZip = require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))) {
    let xml = await zip.file(name).async("string");
    xml = xml.replace(/<a:p>([\s\S]*?)<\/a:p>/g, (m, inner) => {
      let first = true;
      return "<a:p>" + inner.replace(/<a:pPr\b[^>]*?(?:\/>|>[\s\S]*?<\/a:pPr>)/g, (pp) => (first ? ((first = false), pp) : "")) + "</a:p>";
    });
    zip.file(name, xml);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

const APPLY_THEME = path.join(__dirname, "apply_theme.js");

module.exports = { deck, HEX, THEME, tex: R.tex, html: R.html };
