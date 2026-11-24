// Diagram helpers: return HTML/SVG strings that render.js turns into crisp PNGs.
// Labels may contain $...$ LaTeX. Coordinates are CSS pixels on a W x H canvas (96 px = 1 inch).
const { html } = require("./render");

const P = {
  navy: "#14254F", teal: "#0F6E78", green: "#12A58A", blue: "#1B7FC4", gold: "#F2B32A",
  mint: "#7FE7C9", coral: "#E0565F", violet: "#6A5ACD", panel: "#EEF3F8", white: "#FFFFFF",
  muted: "#5A6475", line: "#9AA8BC", soft: { green: "#DDF4EE", blue: "#DCEBF8", gold: "#FCEFCF", coral: "#FADDE0", violet: "#E6E3F8", teal: "#D7ECEE", navy: "#DCE1EE" },
};

function esc(s) { return String(s); }

// Point where the ray from node center towards (tx,ty) leaves the node.
function exitPt(n, tx, ty) {
  const dx = tx - n.x, dy = ty - n.y;
  if (n.shape === "circle") {
    const r = n.w / 2, d = Math.hypot(dx, dy) || 1;
    return [n.x + (dx / d) * r, n.y + (dy / d) * r];
  }
  const hw = n.w / 2, hh = n.h / 2;
  const s = Math.min(Math.abs(dx) > 1e-9 ? hw / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-9 ? hh / Math.abs(dy) : Infinity);
  return [n.x + dx * s, n.y + dy * s];
}

/**
 * graph({ W, H, nodes:[{id,x,y,w,h,label,fill,color,stroke,shape,fs,r,sub}], edges:[{a,b,label,color,dash,bend,width,lfs,both,from,to}], extra })
 * Node x,y is its center. fill can be a palette name. Edge bend > 0 curves it. extra = raw SVG appended.
 */
function graph({ W, H, nodes, edges = [], extra = "", under = "", extraHtml = "", wIn }) {
  const N = {};
  nodes.forEach((n) => { N[n.id] = { w: 120, h: 50, ...n }; });
  const col = (c, d) => (c ? P[c] || c : d);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="position:absolute;left:0;top:0;overflow:visible">
<defs>${["navy", "teal", "green", "blue", "gold", "coral", "violet", "muted", "line"].map((c) => `<marker id="ah-${c}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${P[c]}"/></marker>`).join("")}</defs>${under}`;
  let labels = "";
  for (const e of edges) {
    const a = N[e.a], b = N[e.b];
    const c = e.color || "line";
    const bend = e.bend || 0;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const cx = mx - ((b.y - a.y) / len) * bend, cy = my + ((b.x - a.x) / len) * bend;
    const p1 = e.from || exitPt(a, bend ? cx : b.x, bend ? cy : b.y);
    const p2 = e.to || exitPt(b, bend ? cx : a.x, bend ? cy : a.y);
    const d = bend ? `M${p1[0]},${p1[1]} Q${cx},${cy} ${p2[0]},${p2[1]}` : `M${p1[0]},${p1[1]} L${p2[0]},${p2[1]}`;
    svg += `<path d="${d}" fill="none" stroke="${P[c] || c}" stroke-width="${e.width || 2.5}" ${e.dash ? 'stroke-dasharray="7 6"' : ""} ${e.noHead ? "" : `marker-end="url(#ah-${c})"`} ${e.both ? `marker-start="url(#ah-${c})"` : ""}/>`;
    if (e.label) {
      const lx = bend ? 0.25 * p1[0] + 0.5 * cx + 0.25 * p2[0] : (p1[0] + p2[0]) / 2;
      const ly = bend ? 0.25 * p1[1] + 0.5 * cy + 0.25 * p2[1] : (p1[1] + p2[1]) / 2;
      const [ox, oy] = e.lofs || [0, 0];
      labels += `<div style="position:absolute;left:${lx + ox}px;top:${ly + oy}px;transform:translate(-50%,-50%);background:${e.lbg || "rgba(255,255,255,0.92)"};padding:1px 6px;border-radius:6px;font-size:${e.lfs || 18}px;color:${P[e.lcolor] || P.navy};white-space:nowrap">${esc(e.label)}</div>`;
    }
  }
  for (const n of Object.values(N)) {
    const fill = col(n.fill, P.white), stroke = col(n.stroke, "none");
    const x = n.x - n.w / 2, y = n.y - n.h / 2;
    if (n.shape === "circle") svg += `<circle cx="${n.x}" cy="${n.y}" r="${n.w / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${n.sw || 2.5}"/>`;
    else if (n.shape !== "none") svg += `<rect x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="${n.r ?? 12}" fill="${fill}" stroke="${stroke}" stroke-width="${n.sw || 2}" ${n.dash ? 'stroke-dasharray="6 5"' : ""}/>`;
    if (n.label !== undefined) {
      const tc = col(n.color, P.navy);
      labels += `<div style="position:absolute;left:${x}px;top:${y}px;width:${n.w}px;height:${n.h}px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:${tc};font-size:${n.fs || 21}px;font-weight:${n.bold === false ? 400 : 600};line-height:1.25"><div>${esc(n.label)}</div>${n.sub ? `<div style="font-size:${n.sfs || 15}px;font-weight:400;opacity:.85;margin-top:3px">${n.sub}</div>` : ""}</div>`;
    }
  }
  svg += extra + "</svg>";
  return html(`<div style="position:relative;width:${W}px;height:${H}px">${svg}${labels}${extraHtml}</div>`, { w: wIn || W / 96 });
}

// Plain text/HTML label at a position (for annotations inside graph extraHtml)
function label(x, y, text, o = {}) {
  return `<div style="position:absolute;left:${x}px;top:${y}px;transform:translate(${o.anchor === "left" ? "0" : "-50%"},-50%);font-size:${o.fs || 17}px;color:${P[o.color] || o.color || P.muted};font-weight:${o.bold ? 700 : 400};white-space:nowrap;${o.style || ""}">${text}</div>`;
}

/** Fully connected network. layers: [{n, label, color}], W,H */
function nnet({ layers, W = 900, H = 420, r = 18, showLabels = true, edgeColor = "#B7C3D4", nodeLabels }) {
  const nodes = [], edges = [];
  const L = layers.length, xs = layers.map((_, i) => 80 + (i * (W - 160)) / (L - 1));
  layers.forEach((ly, i) => {
    for (let j = 0; j < ly.n; j++) {
      const y = H / 2 + (j - (ly.n - 1) / 2) * Math.min(70, (H - 110) / Math.max(ly.n - 1, 1));
      nodes.push({ id: `n${i}_${j}`, x: xs[i], y, w: 2 * r, shape: "circle", fill: ly.color || "blue", stroke: "white", label: nodeLabels && nodeLabels[i] ? nodeLabels[i][j] : "", color: "white", fs: 15 });
    }
  });
  let extra = "";
  layers.forEach((ly, i) => {
    if (i === L - 1) return;
    for (let j = 0; j < ly.n; j++) for (let k = 0; k < layers[i + 1].n; k++) {
      const a = nodes.find((n) => n.id === `n${i}_${j}`), b = nodes.find((n) => n.id === `n${i + 1}_${k}`);
      extra = `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${edgeColor}" stroke-width="1.6"/>` + extra;
    }
  });
  const lab = showLabels ? layers.map((ly, i) => label(xs[i], H - 18, ly.label || "", { fs: 16, color: "navy", bold: true })).join("") : "";
  // draw lines underneath: put them in a separate svg first
  return graph({ W, H, nodes, edges, extraHtml: lab, under: extra });
}

/** Colored grid of numbers (matrices, attention maps, kernels). vals: 2D array. */
function grid({ vals, cell = 48, rowLabels, colLabels, color = "blue", fmt = (v) => v, title, hi = [], fs = 16, max }) {
  const flat = vals.flat().map(Number).filter((v) => !isNaN(v));
  const mx = max ?? Math.max(...flat.map(Math.abs), 1e-9);
  const base = { blue: [27, 127, 196], green: [18, 165, 138], coral: [224, 86, 95], violet: [106, 90, 205], gold: [242, 179, 42], teal: [15, 110, 120] }[color];
  let h = `<table style="border-collapse:separate;border-spacing:3px;font-size:${fs}px">`;
  if (colLabels) h += `<tr><td></td>${colLabels.map((c) => `<td style="text-align:center;color:${P.muted};padding-bottom:2px">${c}</td>`).join("")}</tr>`;
  vals.forEach((row, i) => {
    h += "<tr>";
    if (rowLabels) h += `<td style="color:${P.muted};padding-right:6px;text-align:right">${rowLabels[i]}</td>`;
    row.forEach((v, j) => {
      const num = Number(v), a = isNaN(num) ? 0.06 : 0.1 + 0.8 * Math.min(1, Math.abs(num) / mx);
      const dark = a > 0.55;
      const isHi = hi.some(([r, c]) => r === i && c === j);
      h += `<td style="width:${cell}px;height:${cell * 0.8}px;text-align:center;border-radius:6px;background:rgba(${base.join(",")},${a});color:${dark ? "#fff" : P.navy};font-weight:600;${isHi ? `outline:3px solid ${P.gold};` : ""}">${fmt(v)}</td>`;
    });
    h += "</tr>";
  });
  h += "</table>";
  return (title ? `<div style="font-weight:700;color:${P.navy};margin-bottom:6px;font-size:${fs + 1}px">${title}</div>` : "") + h;
}

// Arrange several HTML blocks in a row with optional operator symbols between them.
function row(items, { gap = 18, align = "center" } = {}) {
  return `<div style="display:flex;align-items:${align};gap:${gap}px">${items.map((it) => `<div>${it}</div>`).join("")}</div>`;
}
function op(t, fs = 30) { return `<div style="font-size:${fs}px;color:${P.navy};padding:0 4px">${t}</div>`; }

module.exports = { graph, nnet, grid, row, op, label, P, htmlImg: html };
