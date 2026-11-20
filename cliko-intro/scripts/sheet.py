# Planche contact : python3 scripts/sheet.py dir out.png cols
import sys, glob
from PIL import Image, ImageDraw
d, out, cols = sys.argv[1], sys.argv[2], int(sys.argv[3])
fs = sorted(glob.glob(d + "/b*.png"))
ims = [Image.open(f) for f in fs]
w, h = ims[0].size
sc = 0.5 if w > 800 else 0.6
tw, th = int(w*sc), int(h*sc)
rows = (len(ims)+cols-1)//cols
S = Image.new("RGB", (cols*tw, rows*(th+18)), (20,20,20))
dr = ImageDraw.Draw(S)
for i,(im,f) in enumerate(zip(ims,fs)):
    x, y = (i%cols)*tw, (i//cols)*(th+18)
    S.paste(im.resize((tw,th)), (x, y+18))
    dr.text((x+4, y+3), f.split("/")[-1][1:-4], fill=(255,200,120))
S.save(out)
