#!/bin/bash
# Render a deck to a contact sheet for visual QA: ./qa.sh <deck.pptx> <outdir>
set -e
S=$(ls -d /root/.claude/skills/synced/*/pptx)
deck=$(readlink -f "$1"); out="$2"; name=$(basename "$deck" .pptx)
mkdir -p "$out/$name"
cd "$out"
python3 $S/scripts/office/soffice.py --headless --convert-to pdf "$deck" >/dev/null 2>&1
find "$out/$name" -name 's-*.jpg' -delete
pdftoppm -jpeg -r 80 "$name.pdf" "$out/$name/s"
python3 - "$out/$name" <<'PY'
import sys,glob
from PIL import Image
fs=sorted(glob.glob(sys.argv[1]+'/s-*.jpg'))
ims=[Image.open(f) for f in fs]; w,h=ims[0].size; cols=2
for k in range(0,len(ims),6):
    grp=ims[k:k+6]; rows=(len(grp)+1)//2
    sheet=Image.new('RGB',(w*cols+10,(h+10)*rows),'white')
    for i,im in enumerate(grp): sheet.paste(im,((i%cols)*(w+10),(i//cols)*(h+10)))
    p=f"{sys.argv[1]}/sheet-{k//6+1}.jpg"; sheet.save(p,quality=85); print(p)
PY
