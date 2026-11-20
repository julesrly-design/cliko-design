import wave, math, array, sys
w=wave.open(sys.argv[1]); sr=w.getframerate(); a=array.array('h'); a.frombytes(w.readframes(w.getnframes()))
B=60/110; row=[]
for k in range(0,70,2):
    seg=a[int(k*B*sr)*2:int((k+2)*B*sr)*2:8]
    if not seg: break
    r=math.sqrt(sum(x*x for x in seg)/len(seg))/32768
    row.append(f"{k}:{20*math.log10(r+1e-9):.0f}")
print(" ".join(row))
