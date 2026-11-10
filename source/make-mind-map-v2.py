# Generates assets/mind-map-v2.svg. Edit the BRANCHES list and re-run: python3 source/make-mind-map-v2.py
from xml.sax.saxutils import escape as e
W, H, CX, CY = 1800, 1100, 900, 560
BRANCHES = [
  ("Objective", "#3b6ea5", ["Turn students into researchers", "Bridge academia and industry", "Outcome: repo, paper and talk", "Promise preparation, not seats"]),
  ("Niches", "#2f8f6b", ["Indian-document AI", "Research-internship applicants", "MS / PhD aspirants", "GATE DA aspirants", "Final-year projects (via colleges)"]),
  ("Pricing", "#8a4fb0", ["Free: YouTube and webinars", "₹499–999: mini course", "₹2,999–4,999: pilot cohort", "₹9,999–14,999: Research Track", "₹24,999+: Pro · B2B for colleges"]),
  ("Shikhar", "#c0632a", ["Curriculum and research projects", "Videos and YouTube", "Academic network and speakers", "Learn: linear algebra, probability", "Reproduce 2 papers, submit 1"]),
  ("Sanhita", "#2a7f9e", ["Website and student dashboard", "Workshops, sales, partnerships", "Student success and community", "Learn: LLM apps, then deep learning", "Reproduce a paper, own research"]),
  ("Growth engine", "#b0414f", ["YouTube + LinkedIn with results", "Alumni become TAs, then mentors", "College partnerships", "Own platform with AI feedback"]),
]
HX = {0: 600, 1: 1200}
HY = [190, 560, 930]
out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family="DejaVu Sans, Arial, sans-serif">',
       f'<rect width="{W}" height="{H}" fill="#f7f9fc"/>',
       f'<text x="{CX}" y="44" text-anchor="middle" font-size="30" font-weight="bold" fill="#17324d">Leapverse · How we focus</text>']
for i, (name, col, leaves) in enumerate(BRANCHES):
    side = 0 if i < 3 else 1
    hx, hy = HX[side], HY[i % 3]
    sx = CX - 150 if side == 0 else CX + 150
    out.append(f'<path d="M{sx} {CY} C {(sx+hx)/2} {CY}, {(sx+hx)/2} {hy}, {hx + (120 if side==0 else -120)} {hy}" stroke="{col}" stroke-width="7" fill="none" stroke-linecap="round"/>')
    n = len(leaves); top = hy - (n - 1) * 54 / 2
    lw = 380; lx = 30 if side == 0 else 1390
    for j, leaf in enumerate(leaves):
        ly = top + j * 54
        ex = hx - 120 if side == 0 else hx + 120
        lxe = lx + lw if side == 0 else lx
        out.append(f'<path d="M{ex} {hy} C {(ex+lxe)/2} {hy}, {(ex+lxe)/2} {ly}, {lxe} {ly}" stroke="{col}" stroke-width="2.5" fill="none" opacity="0.7"/>')
        out.append(f'<rect x="{lx}" y="{ly-21}" width="{lw}" height="42" rx="21" fill="#ffffff" stroke="{col}" stroke-width="2"/>')
        out.append(f'<text x="{lx+lw/2}" y="{ly+6}" text-anchor="middle" font-size="17" fill="#1f2430">{e(leaf)}</text>')
    out.append(f'<rect x="{hx-120}" y="{hy-32}" width="240" height="64" rx="32" fill="{col}"/>')
    out.append(f'<text x="{hx}" y="{hy+8}" text-anchor="middle" font-size="23" font-weight="bold" fill="#fff">{e(name)}</text>')
# center
out.append(f'<circle cx="{CX}" cy="{CY}" r="150" fill="#17324d"/>')
out.append(f'<image href="../brand/logo-icon.svg" x="{CX-48}" y="{CY-128}" width="96" height="96"/>')
out.append(f'<text x="{CX}" y="{CY+22}" text-anchor="middle" font-size="34" font-weight="bold" fill="#fff">Leap<tspan fill="#2ec4a0">verse</tspan></text>')
out.append(f'<text x="{CX}" y="{CY+58}" text-anchor="middle" font-size="16" fill="#cfd8e3">Leap into AI, research</text>')
out.append(f'<text x="{CX}" y="{CY+80}" text-anchor="middle" font-size="16" fill="#cfd8e3">and beyond</text>')
out.append('</svg>')
open('assets/mind-map-v2.svg', 'w').write('\n'.join(out))
