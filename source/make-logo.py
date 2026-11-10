# Generates brand/logo-icon.svg and brand/logo-full.svg. Change NAME/TAGLINE and re-run: python3 source/make-logo.py
NAME = ("Leap", "verse")          # first part navy, second part teal
TAGLINE = "LEAP INTO AI, RESEARCH AND BEYOND"

DEFS = '''<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b2f6b"/><stop offset="1" stop-color="#0f6e78"/></linearGradient>
  <linearGradient id="arc" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#7fe7c9"/><stop offset="1" stop-color="#ffd27a"/></linearGradient>
  <radialGradient id="glow"><stop offset="0" stop-color="#ffd27a" stop-opacity="0.75"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
  <linearGradient id="word" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#12a58a"/><stop offset="1" stop-color="#1b7fc4"/></linearGradient>
</defs>'''

ICON = '''<rect width="200" height="200" rx="46" fill="url(#bg)"/>
<!-- ground line: the classroom -->
<line x1="30" y1="158" x2="112" y2="158" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0.9"/>
<!-- the leap: a network path rising into a star -->
<path d="M40 150 C 70 150, 92 126, 104 104 S 132 58, 150 50" fill="none" stroke="url(#arc)" stroke-width="8" stroke-linecap="round"/>
<g stroke="#ffffff" stroke-opacity="0.35" stroke-width="2.5">
  <line x1="74" y1="138" x2="104" y2="104"/><line x1="104" y1="104" x2="128" y2="70"/><line x1="74" y1="138" x2="128" y2="70"/>
</g>
<circle cx="40" cy="150" r="9" fill="#ffffff"/>
<circle cx="74" cy="138" r="8" fill="#7fe7c9"/>
<circle cx="104" cy="104" r="9" fill="#a8eccf"/>
<circle cx="128" cy="70" r="8" fill="#ffe1a0"/>
<!-- the star: the research breakthrough -->
<circle cx="152" cy="48" r="30" fill="url(#glow)"/>
<path d="M152 26 L157 43 L174 48 L157 53 L152 70 L147 53 L130 48 L147 43 Z" fill="#ffc94d"/>
<circle cx="152" cy="48" r="4" fill="#ffffff"/>'''

open('brand/logo-icon.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">{DEFS}{ICON}</svg>')
open('brand/logo-full.svg', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 200" width="820" height="200">{DEFS}{ICON}
<text x="234" y="116" font-family="DejaVu Sans, Arial, sans-serif" font-size="84" font-weight="bold" fill="#14254f" letter-spacing="-1">{NAME[0]}<tspan fill="url(#word)">{NAME[1]}</tspan></text>
<text x="238" y="160" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" fill="#5a6475" letter-spacing="3.5">{TAGLINE}</text>
</svg>''')
