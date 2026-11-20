(() => {
  // src/timeline.js
  var BPM = 110;
  var BEAT = 60 / BPM;
  var bt = (beats) => beats * BEAT;
  var VIDEO_END = bt(70);
  var AUTO_EXIT = bt(78);
  var BARS = ["Am", "F", "Am", "F", "C", "G", "Am", "F", "G", "Am", "F", "C", "G", "Am", "F", "G", "Am"];
  var clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
  var lerp = (a, b, k) => a + (b - a) * k;
  var prog = (x, a, b) => clamp((x - a) / (b - a));
  var bell = (x, a, b) => {
    const k = prog(x, a, b);
    return Math.sin(k * Math.PI);
  };
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 6; i++) {
        const d = dx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= (sx(t) - x) / d;
      }
      return sy(clamp(t));
    };
  }
  var E = {
    out: bezier(0.22, 1, 0.36, 1),
    // --ease
    reveal: bezier(0.16, 1, 0.3, 1),
    // --ease-reveal
    io: bezier(0.65, 0, 0.35, 1),
    // --ease-io
    expo: (x) => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
    inExpo: (x) => x <= 0 ? 0 : Math.pow(2, 10 * x - 10),
    back: (x) => {
      const c = 2.2;
      return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
    },
    inCubic: (x) => x * x * x
  };
  var hit = (b, at, decayBeats = 0.6) => b < at ? 0 : Math.exp(-((b - at) / decayBeats) * 3);
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = a + 1831565813 >>> 0;
      let t = a;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var hash = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  // src/gl.js
  var FRAG = (
    /* glsl */
    `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 R;
uniform float T;
uniform vec4 SA;   // x: plan A, y: plan B, z: m\xE9lange, w: type de transition (0 fondu, 1 whip, 2 travers\xE9e)
uniform vec4 PA;   // param\xE8tres du plan A
uniform vec4 PB;   // param\xE8tres du plan B
uniform vec4 FX;   // x: flash, y: light leak, z: vignette, w: exposition
uniform vec4 FX2;  // x: teinte nuit (sortie), y: grain, zw: secousse
uniform vec2 CEN;  // centre du soleil du reveal

#define PI 3.14159265
const vec3 DEEP=vec3(.055,.02,.09);
const vec3 VIOLET=vec3(.34,.13,.52);
const vec3 MAGENTA=vec3(1.,.16,.5);
const vec3 PINK=vec3(1.,.4,.66);
const vec3 CORAL=vec3(1.,.42,.36);
const vec3 ORANGE=vec3(1.,.53,.22);
const vec3 AMBER=vec3(1.,.77,.42);
const vec3 NIGHT=vec3(.043,.063,.125);

float h11(float p){p=fract(p*.1031);p*=p+33.33;p*=p+p;return fract(p);}
float h21(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*vn(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}

// 0 \u2014 Bokeh : lumi\xE8res de ville hors mise au point
vec3 shBokeh(vec2 p, vec4 P){
  p/=P.y;
  vec3 c=DEEP*.7*P.x;
  for(int i=0;i<24;i++){
    float f=float(i);
    vec2 o=vec2(h11(f*7.13)-.5,h11(f*3.71+.3)-.5)*vec2(2.3,1.15);
    o+=vec2(sin(T*.13+f*1.7),cos(T*.11+f*2.3))*.03;
    float hr=h11(f*1.91);
    float r=mix(.03,.13,hr*hr);
    float d=length(p-o);
    float a=smoothstep(h11(f*4.4)*.75,h11(f*4.4)*.75+.25,P.x);
    vec3 bc=h11(f*5.3)>.5?MAGENTA:ORANGE;
    if(h11(f*9.1)>.78) bc=AMBER;
    if(h11(f*2.2)<.16) bc=VIOLET*1.7;
    float disc=smoothstep(r,r*.84,d);
    float rim=disc*smoothstep(r*.5,r,d);
    float halo=exp(-d*d/(r*r)*1.1)*.12;
    c+=bc*(disc*.2+rim*.22+halo)*a*(.86+.14*sin(T*2.1+f*11.));
  }
  c+=(PINK*.6+AMBER*.5)*exp(-abs(p.y)*140.)*exp(-abs(p.x)*1.1)*P.z*1.6;
  c+=AMBER*exp(-length(p*vec2(.55,4.))*5.)*P.z*.45;
  return c;
}

// 1 \u2014 Coucher de soleil sur l'oc\xE9an
vec3 sky(vec2 q, float sunY, float dusk){
  float y=q.y;
  vec3 c=mix(ORANGE*1.2,CORAL*1.05,smoothstep(0.,.07,y));
  c=mix(c,MAGENTA*.9,smoothstep(.05,.21,y));
  c=mix(c,VIOLET*.72,smoothstep(.17,.4,y));
  c=mix(c,DEEP,smoothstep(.34,.8,y));
  c*=mix(1.,.5,dusk);
  float cl=fbm(vec2(q.x*1.25+T*.012,y*6.5+2.));
  cl=smoothstep(.5,.8,cl)*smoothstep(.03,.12,y)*smoothstep(.52,.18,y);
  vec3 cc=mix(PINK*1.15,ORANGE*1.25,smoothstep(.26,.05,y));
  c=mix(c,cc*(1.-dusk*.5),cl*.6);
  vec2 sp=vec2(0.,sunY);float sd=length(q-sp);float sr=.14;
  float sun=smoothstep(sr,sr-.003,sd)*step(0.,y);
  vec3 sc=mix(PINK*1.25,AMBER*1.45,smoothstep(sunY-sr,sunY+sr*.6,y));
  c=mix(c,sc,sun);
  c+=(AMBER*.6*exp(-sd*7.)+CORAL*.38*exp(-sd*2.2))*(1.-dusk*.4);
  return c;
}
vec3 shSunset(vec2 p, vec4 P){
  p.x+=P.w; p/=P.y;
  vec2 q=vec2(p.x,p.y+.1);
  vec3 c;
  if(q.y>=0.){ c=sky(q,P.x,P.z); }
  else{
    float d=-q.y;
    float z=1./(d+.015);
    vec2 w=vec2(q.x*z*1.2,z*.9+T*.9);
    float n=vn(w*vec2(3.,1.2))*.6+vn(w*vec2(9.,3.))*.4;
    vec3 refl=sky(vec2(q.x+(n-.5)*.05*d*4.,d*.9+.004),P.x,P.z);
    c=refl*mix(.6,.16,smoothstep(0.,.35,d));
    float colw=.03+.55*d;
    float column=exp(-pow(q.x/colw,2.));
    float glit=smoothstep(.6,.95,n);
    c+=mix(AMBER*1.25,PINK,smoothstep(0.,.3,d))*column*(.16+glit*1.5)*(1.-P.z*.55);
    c+=ORANGE*exp(-d*70.)*.5;
  }
  c+=CORAL*.2*exp(-abs(q.y)*18.);
  return c;
}

// 2 \u2014 Autoroute n\xE9on : sol quadrill\xE9, soleil ray\xE9, montagnes
vec3 shGrid(vec2 p, vec4 P){
  p/=P.y;
  float hz=.03; vec3 c;
  if(p.y>hz){
    float y=p.y-hz;
    c=mix(MAGENTA*.6,VIOLET*.38,smoothstep(0.,.15,y));
    c=mix(c,DEEP*.7,smoothstep(.12,.55,y));
    vec2 g=floor(p*150.);float st=step(.996,h21(g))*smoothstep(.06,.3,y);
    c+=vec3(1.,.8,.9)*st*(.5+.5*sin(T*3.+h21(g)*40.));
    vec2 sp=vec2(0.,hz+.13);float sd=length(p-sp);float sr=.21;
    float sy=(p.y-sp.y)/sr;
    float cutAmt=clamp((.3-sy)/1.3,0.,1.);
    float cut=step(fract(sy*8.-T*.4),cutAmt*.8);
    float sun=smoothstep(sr,sr-.003,sd)*(1.-cut);
    vec3 sc=mix(MAGENTA*1.25,AMBER*1.4,smoothstep(-1.,1.,sy));
    c=mix(c,sc,sun*P.z);
    c+=PINK*.4*exp(-sd*4.)*P.z;
    float m=hz+.05*fbm(vec2(p.x*2.6,1.3))+.012*vn(vec2(p.x*22.,3.));
    if(p.y<m){ c=DEEP*.45+MAGENTA*.5*smoothstep(m-.006,m,p.y)+VIOLET*.1; }
  } else {
    float d=hz-p.y; float z=.32/(d+.002);
    float x=p.x*z; float zz=z+T*P.x;
    float gx=abs(fract(x*.5)-.5), gz=abs(fract(zz*.5)-.5);
    float wx=min(.5,.025+.008*z), wz=min(.5,.025+.016*z);
    float l=max(smoothstep(wx,0.,gx),smoothstep(wz,0.,gz));
    float fog=exp(-z*.045);
    c=DEEP*.5+MAGENTA*1.15*l*fog+PINK*.7*exp(-d*14.);
    float lane=smoothstep(.05,0.,abs(x))*step(.55,fract(zz*.35));
    c+=AMBER*lane*fog*1.2;
  }
  c*=P.w;
  return c;
}

// 3 \u2014 Skyline de nuit et reflets dans l'eau
vec3 city(vec2 q){
  vec3 c=mix(MAGENTA*.55+ORANGE*.18,VIOLET*.5,smoothstep(0.,.2,q.y));
  c=mix(c,DEEP*.7,smoothstep(.16,.6,q.y));
  for(int L=0;L<3;L++){
    float fl=float(L);
    float dens=mix(15.,6.,fl*.5);
    float hmax=mix(.17,.34,fl*.5);
    float x=q.x+fl*3.1+T*.006*(fl+1.);
    float i=floor(x*dens);
    float hh=hmax*(.22+.78*pow(h11(i*1.37+fl*7.),1.6));
    if(q.y<hh){
      vec3 bc=mix(VIOLET*.22,DEEP*.3,fl*.5);
      float fx=fract(x*dens);
      vec2 wv=vec2(fx*6.,q.y*mix(150.,75.,fl*.5));
      vec2 wi=floor(wv);vec2 wf=fract(wv);
      float win=step(.25,wf.x)*step(wf.x,.75)*step(.3,wf.y)*step(wf.y,.75)*step(.5,wi.x)*step(wi.x,4.5);
      float lit=step(.6,h21(wi+i*13.+fl*5.))*win;
      vec3 wc=mix(AMBER,PINK,step(.72,h21(wi+3.+i)));
      bc+=wc*lit*mix(.45,.95,fl*.5)*(.8+.2*sin(T*.7+i));
      bc+=MAGENTA*smoothstep(hh-.005,hh,q.y)*step(.65,h11(i*2.1+fl))*1.3;
      c=bc;
    }
  }
  return c;
}
vec3 shCity(vec2 p, vec4 P){
  p/=P.y; p.y+=P.x;
  vec2 q=vec2(p.x+P.z,p.y+.17);
  vec3 c;
  if(q.y>=0.) c=city(q);
  else{
    float d=-q.y;
    float rip=sin(d*240.-T*3.)*.5+vn(vec2(q.x*40.,d*90.-T*2.))*.5;
    vec3 r=city(vec2(q.x+(rip-.5)*.008*(1.+d*10.),d));
    c=r*.5*mix(1.,.28,smoothstep(0.,.4,d));
    c+=MAGENTA*exp(-d*40.)*.3;
  }
  c+=MAGENTA*.14*exp(-abs(q.y)*10.)*P.w;
  return c;
}

// 4 \u2014 Tunnel de lumi\xE8re num\xE9rique
vec3 shTunnel(vec2 p, vec4 P){
  float r=length(p);float a=atan(p.y,p.x);
  float z=.3/(r+.02)+T*P.x;
  float ring=pow(abs(sin(z*PI)),16.);
  float seg=step(.45,h21(vec2(floor((a/(PI*2.)+.5)*24.+P.y*z),floor(z))));
  vec3 col=mix(MAGENTA,ORANGE,.5+.5*sin(floor(z)*1.3));
  vec3 c=col*ring*(.35+.65*seg)*smoothstep(0.,.25,r)*1.3;
  vec2 bq=vec2((a/(PI*2.)+.5)*56.,z*2.5);
  float blk=step(.94,h21(floor(bq)+floor(T*6.)))*smoothstep(.05,.45,r);
  c+=mix(PINK,AMBER,h21(floor(bq)))*blk*.55;
  c+=AMBER*exp(-r*9.)*.7+VIOLET*.3*exp(-r*2.)+DEEP*.6;
  return c*P.z;
}

// 5 \u2014 Reveal : soleil qui se contracte, rayons divins
vec3 shReveal(vec2 p, vec4 P){
  vec2 d=p-CEN;float r=length(d);float a=atan(d.y,d.x);
  vec3 c=DEEP*.55*(1.-smoothstep(0.,1.2,length(p)));
  float rays=pow(vn(vec2(a*7.,T*.35)),2.5)*.8+pow(vn(vec2(a*19.+3.,T*.5)),4.)*.6;
  c+=mix(AMBER,PINK,smoothstep(0.,.8,r))*rays*exp(-r*1.7)*P.y;
  float sr=P.x;
  float sun=smoothstep(sr,sr-.004,r);
  c=mix(c,mix(AMBER*1.45,vec3(1.,.95,.86)*1.7,smoothstep(sr,0.,r)),sun);
  c+=AMBER*exp(-r*5./(.25+P.z))*P.z*.75+MAGENTA*exp(-r*2.4)*P.z*.4;
  c+=ORANGE*exp(-abs(p.y+.27)*90.)*P.w*.8*exp(-abs(p.x)*.9);
  c+=PINK*exp(-abs(p.y+.27)*20.)*P.w*.12;
  return c;
}

vec3 shot(float id, vec2 p, vec4 P){
  if(id<.5) return shBokeh(p,P);
  if(id<1.5) return shSunset(p,P);
  if(id<2.5) return shGrid(p,P);
  if(id<3.5) return shCity(p,P);
  if(id<4.5) return shTunnel(p,P);
  return shReveal(p,P);
}
float sh1(float x){ return x<.8?x:1.-.2*exp(-(x-.8)*5.); }

void main(){
  vec2 p=(gl_FragCoord.xy-.5*R)/R.y+FX2.zw;
  float asp=R.x/R.y;
  float m=SA.z;
  vec3 c;
  if(m<=0.) c=shot(SA.x,p,PA);
  else if(m>=1.) c=shot(SA.y,p,PB);
  else if(SA.w<.5) c=mix(shot(SA.x,p,PA),shot(SA.y,p,PB),m);
  else if(SA.w<1.5){
    float e=m*m*(3.-2.*m);
    float sm=sin(m*PI);
    vec3 acc=vec3(0.);
    for(int k=0;k<5;k++){
      float o=(float(k)-2.)*.06*sm;
      float s=p.x+e*asp+o;
      acc+=s<asp*.5?shot(SA.x,vec2(s,p.y),PA):shot(SA.y,vec2(s-asp,p.y),PB);
    }
    c=acc/5.+vec3(1.,.45,.72)*sm*sm*.12;
  } else {
    vec3 a=shot(SA.x,p*(1.-.65*m),PA);
    vec3 b=shot(SA.y,p*(1.+.9*(1.-m)),PB);
    c=mix(a,b,smoothstep(.35,.65,m))+vec3(1.,.82,.78)*pow(sin(m*PI),3.)*.9;
  }
  c+=PINK*FX.y*.5*exp(-length(p-vec2(-.78+.25*sin(T*.31),.36))*2.2);
  c+=ORANGE*FX.y*.42*exp(-length(p-vec2(.82,-.25+.2*cos(T*.23)))*2.6);
  vec2 v=p/vec2(max(asp,1.),1.);
  c*=1.-FX.z*dot(v,v)*1.5;
  c*=FX.w;
  c=vec3(sh1(c.r),sh1(c.g),sh1(c.b));
  c+=(h21(gl_FragCoord.xy+fract(T*7.)*vec2(113.,71.))-.5)*FX2.y;
  c=mix(c,vec3(1.,.96,.92),clamp(FX.x,0.,1.));
  c=mix(c,NIGHT,FX2.x);
  gl_FragColor=vec4(max(c,0.),1.);
}`
  );
  var VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
  function createGL(canvas, preserve = false) {
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: preserve, powerPreference: "high-performance" });
    if (!gl) return null;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
      return s;
    };
    let prog2;
    try {
      prog2 = gl.createProgram();
      gl.attachShader(prog2, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog2, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog2);
      if (!gl.getProgramParameter(prog2, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog2) || "link");
    } catch (e) {
      console.warn("[cliko-intro] WebGL indisponible :", e);
      return null;
    }
    gl.useProgram(prog2);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog2, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {};
    for (const n of ["R", "T", "SA", "PA", "PB", "FX", "FX2", "CEN"]) U[n] = gl.getUniformLocation(prog2, n);
    return {
      draw(s) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(U.R, canvas.width, canvas.height);
        gl.uniform1f(U.T, s.time);
        gl.uniform4f(U.SA, s.a, s.b, s.mix, s.tr);
        gl.uniform4fv(U.PA, s.pa);
        gl.uniform4fv(U.PB, s.pb);
        gl.uniform4fv(U.FX, s.fx);
        gl.uniform4fv(U.FX2, s.fx2);
        gl.uniform2fv(U.CEN, s.cen);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
      lost: () => gl.isContextLost()
    };
  }

  // src/silhouettes.js
  function palm(ctx, toPx, s, x, y, h, lean, t, seed, fronds = 10, fsc = 1) {
    const top = [x + lean * h, y + h];
    const ctl = [x + lean * h * 0.15 + h * 0.1 * Math.sign(lean || 1), y + h * 0.5];
    const P = (u) => [
      (1 - u) * (1 - u) * x + 2 * (1 - u) * u * ctl[0] + u * u * top[0],
      (1 - u) * (1 - u) * y + 2 * (1 - u) * u * ctl[1] + u * u * top[1]
    ];
    const L = [], Rr = [];
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const a = P(Math.max(0, u - 0.01)), b = P(Math.min(1, u + 0.01));
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      const w = h * 0.03 * (1 - u * 0.5) * (1 + 0.08 * Math.sin(u * 60));
      const c = P(u);
      L.push(toPx(c[0] - dy / len * w, c[1] + dx / len * w));
      Rr.push(toPx(c[0] + dy / len * w, c[1] - dx / len * w));
    }
    ctx.beginPath();
    ctx.moveTo(L[0][0], L[0][1]);
    for (const p of L) ctx.lineTo(p[0], p[1]);
    for (let i = Rr.length - 1; i >= 0; i--) ctx.lineTo(Rr[i][0], Rr[i][1]);
    ctx.closePath();
    ctx.fill();
    const tp = top;
    ctx.lineWidth = Math.max(1, h * s * 65e-4);
    for (let f = 0; f < fronds; f++) {
      const base = f / (fronds - 1) * Math.PI * 1.2 - Math.PI * 0.1;
      const a0 = base + (hash(seed + f) - 0.5) * 0.3 + Math.sin(t * 1.1 + f * 0.9 + seed) * 0.045;
      const len = h * fsc * (0.34 + 0.16 * hash(seed * 3 + f));
      const up = 0.35 + 0.35 * Math.max(0, Math.sin(a0));
      const droop = 0.9 + 0.5 * hash(seed * 7 + f);
      const M = 26;
      const pts = [];
      for (let k = 0; k <= M; k++) {
        const u = k / M;
        const ax = Math.cos(a0) * len * u;
        const ay = Math.sin(a0) * len * u * up + len * u * 0.25 - droop * len * u * u * 0.8;
        pts.push([tp[0] + ax, tp[1] + ay + h * 0.015]);
      }
      ctx.beginPath();
      pts.forEach((p, k) => {
        const P2 = toPx(p[0], p[1]);
        k ? ctx.lineTo(P2[0], P2[1]) : ctx.moveTo(P2[0], P2[1]);
      });
      ctx.lineWidth = Math.max(1, h * s * 9e-3);
      ctx.stroke();
      ctx.beginPath();
      for (let k = 1; k < M; k++) {
        const u = k / M;
        const [px, py] = pts[k];
        const dx = pts[k + 1][0] - pts[k - 1][0], dy = pts[k + 1][1] - pts[k - 1][1], dl = Math.hypot(dx, dy) || 1;
        const tx = dx / dl, ty = dy / dl;
        const ll = h * fsc * 0.12 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.95 + 0.05)), 0.8) * (0.85 + 0.3 * hash(seed + f * 31 + k));
        const sw = Math.sin(t * 1.6 + k * 0.4 + f) * 0.04;
        for (const sgn of [1, -1]) {
          let ex = -ty * sgn * 0.62 - tx * 0.35, ey = tx * sgn * 0.62 - ty * 0.35 - 0.55;
          const el = Math.hypot(ex, ey) || 1;
          ex = ex / el * ll + sw * ll;
          ey = ey / el * ll;
          const A = toPx(px, py), B = toPx(px + ex * 0.55 + ex * 0.08, py + ey * 0.45), C = toPx(px + ex, py + ey);
          ctx.moveTo(A[0], A[1]);
          ctx.quadraticCurveTo(B[0], B[1], C[0], C[1]);
        }
      }
      ctx.lineWidth = Math.max(1, h * s * 55e-4);
      ctx.stroke();
    }
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const c = toPx(tp[0] + (i - 1.5) * h * 0.018, tp[1] - h * 0.015 - i % 2 * h * 0.012);
      ctx.moveTo(c[0] + h * s * 0.014, c[1]);
      ctx.arc(c[0], c[1], h * s * 0.014, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  function birds(ctx, toPx, s, t, k, x0, y0) {
    ctx.beginPath();
    for (let i = 0; i < 7; i++) {
      const bx = x0 + t * 0.03 + i * 0.045 + Math.sin(i * 2.1) * 0.03;
      const by = y0 + Math.cos(i * 1.7) * 0.03 + Math.sin(t * 0.8 + i) * 4e-3;
      const w = 0.011 * (1 - i * 0.05);
      const flap = Math.sin(t * 7 + i * 1.3) * 6e-3;
      const a = toPx(bx - w, by + flap), b = toPx(bx, by - 2e-3), c = toPx(bx + w, by + flap);
      ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo((a[0] + b[0]) / 2, b[1] - w * s * 0.2, b[0], b[1]);
      ctx.quadraticCurveTo((b[0] + c[0]) / 2, b[1] - w * s * 0.2, c[0], c[1]);
    }
    ctx.lineWidth = Math.max(1, s * 22e-4);
    ctx.globalAlpha = k;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function createSilhouettes(canvas) {
    const ctx = canvas.getContext("2d");
    return {
      // cam : { zoom, panX, offX (décalage écran en unités, pour les whips), alpha, layout: 'sunset'|'city', birds }
      draw(t, cams) {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        const asp = W / H;
        for (const cam of cams) {
          if (!cam || cam.alpha <= 1e-3) continue;
          const z = 1 + (cam.zoom - 1) * cam.fg;
          const toPx = (x, y) => [W / 2 + (x * z - cam.panX * cam.fg - cam.offX) * H, H / 2 - (y * z + cam.offY) * H];
          ctx.save();
          ctx.globalAlpha = cam.alpha;
          ctx.fillStyle = cam.color || "#0a0410";
          ctx.strokeStyle = cam.color || "#0a0410";
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          const ex = asp / 2 / z;
          const k = cam.small || 1;
          const P = (x, y, h, lean, tt, seed, n, fsc = 1) => palm(ctx, toPx, H * z, x, y, h * k, lean, tt, seed, n, fsc);
          if (asp < 0.8) {
            P(-ex - 0.05, -0.62, 1.02, 0.05, t, 3, 13, 0.42);
            P(ex + 0.05, -0.66, 0.92, -0.05, t + 0.6, 17, 13, 0.42);
          } else if (cam.layout === "sunset") {
            P(-ex + 0.03, -0.66, 0.92, 0.14, t, 3, 13);
            P(-ex + 0.24, -0.62, 0.62, 0.08, t + 1.3, 9, 12);
            P(ex - 0.06, -0.68, 0.86, -0.17, t + 0.6, 17, 13);
            if (asp > 1.2) P(ex - 0.34, -0.56, 0.44, -0.05, t + 2.1, 23, 11);
          } else if (cam.layout === "city") {
            P(-ex + 0.04, -0.68, 0.9, 0.12, t, 41, 13);
            if (asp > 1.2) P(ex - 0.1, -0.7, 0.66, -0.12, t + 1.1, 47, 12);
          }
          ctx.restore();
          if (cam.birds) {
            ctx.save();
            ctx.strokeStyle = "#1b0a1e";
            ctx.lineCap = "round";
            birds(ctx, toPx, H * z, t, cam.birds * cam.alpha, -0.25, 0.22);
            ctx.restore();
          }
        }
      },
      clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }

  // src/audio.js
  var mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  var CHORDS = {
    Am: { bass: 33, pad: [57, 60, 64, 67, 71], arp: [69, 72, 76, 79, 81] },
    F: { bass: 29, pad: [53, 57, 60, 64, 67], arp: [65, 69, 72, 76, 77] },
    C: { bass: 36, pad: [55, 60, 62, 64, 67], arp: [67, 72, 74, 76, 79] },
    G: { bass: 31, pad: [55, 59, 62, 64, 67], arp: [67, 71, 74, 79, 83] }
  };
  var HOOK = [
    [0, 76, 1],
    [1, 74, 0.5],
    [1.5, 72, 0.5],
    [2, 74, 1.5],
    [3.5, 76, 0.5],
    [4, 72, 1],
    [5, 69, 1],
    [6, 72, 0.5],
    [6.5, 74, 0.5],
    [7, 76, 1],
    [8, 79, 1.5],
    [9.5, 76, 0.5],
    [10, 74, 1],
    [11, 72, 1],
    [12, 74, 2],
    [14, 71, 1],
    [15, 74, 0.75]
  ];
  function createEngine(ctx) {
    const R = rng(20261119);
    const now0 = 0;
    const master = ctx.createGain();
    master.gain.value = 0.82;
    const clip = ctx.createWaveShaper();
    {
      const n = 2048, c = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = i / (n - 1) * 2 - 1;
        c[i] = Math.tanh(x * 1.25) / Math.tanh(1.25);
      }
      clip.curve = c;
      clip.oversample = "2x";
    }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -15;
    comp.knee.value = 9;
    comp.ratio.value = 3.2;
    comp.attack.value = 6e-3;
    comp.release.value = 0.16;
    const lows = ctx.createBiquadFilter();
    lows.type = "lowshelf";
    lows.frequency.value = 95;
    lows.gain.value = 0.5;
    const highs = ctx.createBiquadFilter();
    highs.type = "highshelf";
    highs.frequency.value = 8500;
    highs.gain.value = 4;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 32;
    hp.Q.value = 0.6;
    const bus = ctx.createGain();
    bus.gain.value = 0.36;
    bus.connect(hp).connect(lows).connect(highs).connect(comp).connect(clip).connect(master).connect(ctx.destination);
    const pump = ctx.createGain();
    pump.connect(bus);
    const drums = ctx.createGain();
    drums.gain.value = 0.9;
    drums.connect(bus);
    const fx = ctx.createGain();
    fx.gain.value = 0.85;
    fx.connect(bus);
    const lead = ctx.createGain();
    lead.gain.value = 0.9;
    lead.connect(bus);
    const rev = ctx.createConvolver();
    {
      const len = Math.floor(ctx.sampleRate * 3.4);
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        let lp = 0;
        for (let i = 0; i < len; i++) {
          const k = i / len;
          lp += (R() * 2 - 1 - lp) * (0.55 - 0.4 * k);
          d[i] = lp * Math.pow(1 - k, 2.6) * (i < ctx.sampleRate * 0.012 ? i / (ctx.sampleRate * 0.012) : 1);
        }
      }
      rev.buffer = ir;
    }
    const revIn = ctx.createGain();
    const revOut = ctx.createGain();
    revOut.gain.value = 0.42;
    const revHp = ctx.createBiquadFilter();
    revHp.type = "highpass";
    revHp.frequency.value = 220;
    revIn.connect(revHp).connect(rev).connect(revOut).connect(bus);
    const dIn = ctx.createGain();
    const dL = ctx.createDelay(2), dR = ctx.createDelay(2);
    dL.delayTime.value = BEAT * 0.75;
    dR.delayTime.value = BEAT * 0.75;
    const fb = ctx.createGain();
    fb.gain.value = 0.36;
    const dLp = ctx.createBiquadFilter();
    dLp.type = "lowpass";
    dLp.frequency.value = 3600;
    const pL = ctx.createStereoPanner(), pR = ctx.createStereoPanner();
    pL.pan.value = -0.75;
    pR.pan.value = 0.75;
    const dOut = ctx.createGain();
    dOut.gain.value = 0.5;
    dIn.connect(dL);
    dL.connect(pL).connect(dOut);
    dL.connect(dR);
    dR.connect(pR).connect(dOut);
    dR.connect(dLp).connect(fb).connect(dL);
    dOut.connect(bus);
    dOut.connect(revIn);
    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    {
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = R() * 2 - 1;
    }
    const crushCurve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) crushCurve[i] = Math.round((i / 1023 * 2 - 1) * 5) / 5;
    const drive = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) drive[i] = Math.tanh((i / 1023 * 2 - 1) * 4);
    const G = (v = 0) => {
      const g = ctx.createGain();
      g.gain.value = v;
      return g;
    };
    const O = (type, f, at) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f, at);
      return o;
    };
    const F = (type, f, q = 0.7) => {
      const b = ctx.createBiquadFilter();
      b.type = type;
      b.frequency.value = f;
      b.Q.value = q;
      return b;
    };
    const N = (at, dur) => {
      const s = ctx.createBufferSource();
      s.buffer = noise;
      s.loop = true;
      s.start(at, R() * 1.5);
      s.stop(at + dur + 0.05);
      return s;
    };
    const send = (node, dest, amt) => {
      if (amt <= 0) return;
      const g = G(amt);
      node.connect(g).connect(dest);
    };
    const ad = (g, at, peak, a, d) => {
      g.gain.setValueAtTime(1e-4, at);
      g.gain.linearRampToValueAtTime(peak, at + a);
      g.gain.exponentialRampToValueAtTime(1e-4, at + a + d);
    };
    const pan = (v) => {
      const p = ctx.createStereoPanner();
      p.pan.value = v;
      return p;
    };
    const duck = (at, depth = 0.62) => {
      pump.gain.setValueAtTime(1 - depth, at);
      pump.gain.setTargetAtTime(1, at + 0.02, 0.09);
    };
    const I = {
      kick(at, v = 1) {
        const o = O("sine", 165, at);
        o.frequency.exponentialRampToValueAtTime(52, at + 0.09);
        o.frequency.exponentialRampToValueAtTime(40, at + 0.42);
        const g = G();
        ad(g, at, v, 2e-3, 0.5);
        o.connect(g).connect(drums);
        o.start(at);
        o.stop(at + 0.6);
        const n = N(at, 0.03), hp2 = F("highpass", 2500), gn = G();
        ad(gn, at, 0.22 * v, 1e-3, 0.02);
        n.connect(hp2).connect(gn).connect(drums);
        duck(at);
      },
      snare(at, v = 1, wet = 0.6) {
        const n = N(at, 0.4), bp = F("bandpass", 1900, 0.6), g = G();
        ad(g, at, 0.75 * v, 2e-3, 0.24);
        n.connect(bp).connect(g).connect(drums);
        send(g, revIn, wet);
        const o = O("triangle", 200, at);
        o.frequency.exponentialRampToValueAtTime(155, at + 0.1);
        const go = G();
        ad(go, at, 0.45 * v, 2e-3, 0.12);
        o.connect(go).connect(drums);
        send(go, revIn, wet * 0.5);
        o.start(at);
        o.stop(at + 0.2);
      },
      clap(at, v = 1) {
        const n = N(at, 0.3), bp = F("bandpass", 1300, 1.2), g = G();
        g.gain.setValueAtTime(1e-4, at);
        for (let i = 0; i < 3; i++) {
          g.gain.setValueAtTime(0.5 * v, at + i * 0.011);
          g.gain.exponentialRampToValueAtTime(0.05, at + i * 0.011 + 9e-3);
        }
        g.gain.setValueAtTime(0.45 * v, at + 0.034);
        g.gain.exponentialRampToValueAtTime(1e-4, at + 0.22);
        n.connect(bp).connect(g).connect(drums);
        send(g, revIn, 0.5);
      },
      hat(at, v = 1, open = false) {
        const n = N(at, open ? 0.35 : 0.08), hp2 = F("highpass", 7800), g = G();
        ad(g, at, (open ? 0.17 : 0.23) * v, 1e-3, open ? 0.26 : 0.045);
        n.connect(hp2).connect(g).connect(pan(open ? 0.25 : -0.2)).connect(drums);
      },
      tom(at, f, v = 1) {
        const o = O("sine", f, at);
        o.frequency.exponentialRampToValueAtTime(f * 0.55, at + 0.3);
        const g = G();
        ad(g, at, 0.6 * v, 2e-3, 0.32);
        o.connect(g).connect(drums);
        send(g, revIn, 0.35);
        o.start(at);
        o.stop(at + 0.4);
      },
      crash(at, v = 1) {
        const n = N(at, 2.6), hp2 = F("highpass", 4200), g = G();
        ad(g, at, 0.2 * v, 3e-3, 2.4);
        n.connect(hp2).connect(g).connect(drums);
        send(g, revIn, 0.3);
      },
      // Pad : 3 dents de scie désaccordées par note, filtrées, stéréo
      pad(at, notes, dur, v = 1, cutoff = 1800, att = 0.5) {
        const f = F("lowpass", cutoff, 0.6);
        const g = G();
        g.gain.setValueAtTime(1e-4, at);
        g.gain.linearRampToValueAtTime(0.055 * v, at + att);
        g.gain.setValueAtTime(0.055 * v, at + dur);
        g.gain.exponentialRampToValueAtTime(1e-4, at + dur + 1.1);
        f.connect(g).connect(pump);
        send(g, revIn, 0.5);
        for (const m of notes)
          for (const [det, p] of [[-9, -0.6], [0, 0], [9, 0.6]]) {
            const o = O("sawtooth", mtof(m), at);
            o.detune.value = det + (R() - 0.5) * 3;
            o.connect(pan(p)).connect(f);
            o.start(at);
            o.stop(at + dur + 1.2);
          }
        return f;
      },
      bass(at, m, dur, v = 1, open = 1) {
        const o1 = O("sawtooth", mtof(m), at), o2 = O("square", mtof(m), at);
        o2.detune.value = -7;
        const f = F("lowpass", 260, 5);
        f.frequency.setValueAtTime(260 + 1500 * open, at);
        f.frequency.exponentialRampToValueAtTime(240, at + 0.16);
        const g = G();
        g.gain.setValueAtTime(1e-4, at);
        g.gain.linearRampToValueAtTime(0.11 * v, at + 5e-3);
        g.gain.setValueAtTime(0.095 * v, at + Math.max(0.02, dur - 0.03));
        g.gain.exponentialRampToValueAtTime(1e-4, at + dur + 0.04);
        const s = O("sine", mtof(m), at), gs = G(0.16 * v);
        gs.gain.setValueAtTime(0.16 * v, at + Math.max(0.02, dur - 0.03));
        gs.gain.exponentialRampToValueAtTime(1e-4, at + dur + 0.04);
        o1.connect(f);
        o2.connect(f);
        f.connect(g).connect(pump);
        s.connect(gs).connect(pump);
        for (const o of [o1, o2, s]) {
          o.start(at);
          o.stop(at + dur + 0.1);
        }
      },
      // Basse tenue avec filtre qui s'ouvre (reveal)
      bassSwell(at, m, dur) {
        const o = O("sawtooth", mtof(m), at), s = O("sine", mtof(m), at);
        const f = F("lowpass", 120, 3);
        f.frequency.setValueAtTime(120, at);
        f.frequency.exponentialRampToValueAtTime(900, at + dur * 0.8);
        const g = G();
        g.gain.setValueAtTime(1e-4, at);
        g.gain.linearRampToValueAtTime(0.13, at + 0.3);
        g.gain.setValueAtTime(0.13, at + dur);
        g.gain.exponentialRampToValueAtTime(1e-4, at + dur + 0.3);
        o.connect(f);
        s.connect(f);
        f.connect(g).connect(bus);
        for (const x of [o, s]) {
          x.start(at);
          x.stop(at + dur + 0.4);
        }
      },
      pluck(at, m, v = 1, dly = 0.35) {
        const o = O("square", mtof(m), at);
        const o2 = O("triangle", mtof(m + 12), at);
        const f = F("lowpass", 3800, 2);
        f.frequency.setValueAtTime(3800, at);
        f.frequency.exponentialRampToValueAtTime(500, at + 0.16);
        const g = G();
        ad(g, at, 0.07 * v, 3e-3, 0.2);
        const g2 = G(0.4);
        o.connect(f);
        o2.connect(g2).connect(f);
        f.connect(g).connect(pump);
        send(g, dIn, dly);
        send(g, revIn, 0.2);
        o.start(at);
        o2.start(at);
        o.stop(at + 0.3);
        o2.stop(at + 0.3);
      },
      lead(at, m, dur, v = 1) {
        const end = at + dur * BEAT;
        const f = F("lowpass", 3400, 1.2);
        const g = G();
        g.gain.setValueAtTime(1e-4, at);
        g.gain.linearRampToValueAtTime(0.085 * v, at + 0.025);
        g.gain.setValueAtTime(0.075 * v, end - 0.02);
        g.gain.exponentialRampToValueAtTime(1e-4, end + 0.28);
        f.connect(g).connect(lead);
        send(g, dIn, 0.42);
        send(g, revIn, 0.45);
        const lfo = O("sine", 5.6, at), lg = G(0);
        lg.gain.setValueAtTime(0, at);
        lg.gain.linearRampToValueAtTime(mtof(m) * 6e-3, at + Math.min(0.5, dur * BEAT));
        lfo.connect(lg);
        for (const det of [-8, 8]) {
          const o = O("sawtooth", mtof(m), at);
          o.detune.value = det;
          lg.connect(o.frequency);
          o.connect(f);
          o.start(at);
          o.stop(end + 0.35);
        }
        const sq = O("square", mtof(m - 12), at), gq = G(0.25);
        lg.connect(sq.frequency);
        sq.connect(gq).connect(f);
        sq.start(at);
        sq.stop(end + 0.35);
        lfo.start(at);
        lfo.stop(end + 0.35);
      },
      stab(at, notes, v = 1) {
        const f = F("lowpass", 5200, 1.5);
        f.frequency.setValueAtTime(5200, at);
        f.frequency.exponentialRampToValueAtTime(700, at + 0.35);
        const g = G();
        ad(g, at, 0.09 * v, 4e-3, 0.42);
        f.connect(g).connect(bus);
        send(g, revIn, 0.6);
        send(g, dIn, 0.2);
        for (const m of notes)
          for (const det of [-11, 11]) {
            const o = O("sawtooth", mtof(m), at);
            o.detune.value = det;
            o.connect(f);
            o.start(at);
            o.stop(at + 0.6);
          }
      },
      // ——— Sound design ———
      impact(at, size = 1) {
        const s = O("sine", 72, at);
        s.frequency.exponentialRampToValueAtTime(28, at + 1.4);
        const gs = G();
        ad(gs, at, 0.6 * size, 4e-3, 1.8 * size);
        s.connect(gs).connect(fx);
        s.start(at);
        s.stop(at + 2.4 * size);
        const b = O("sine", 140, at);
        b.frequency.exponentialRampToValueAtTime(42, at + 0.25);
        const sh = ctx.createWaveShaper();
        sh.curve = drive;
        const gb = G();
        ad(gb, at, 0.4 * size, 2e-3, 0.7);
        b.connect(sh).connect(gb).connect(fx);
        b.start(at);
        b.stop(at + 1);
        const n = N(at, 2.2), lp = F("lowpass", 4500, 0.5), gn = G();
        lp.frequency.setValueAtTime(4500, at);
        lp.frequency.exponentialRampToValueAtTime(180, at + 1.6);
        ad(gn, at, 0.42 * size, 3e-3, 1.8);
        n.connect(lp).connect(gn).connect(fx);
        send(gn, revIn, 0.9);
        I.crash(at, 0.9 * size);
        duck(at, 0.85);
      },
      riser(at, dur, v = 1) {
        const n = N(at, dur), bp = F("bandpass", 300, 3), g = G();
        bp.frequency.setValueAtTime(260, at);
        bp.frequency.exponentialRampToValueAtTime(7500, at + dur);
        g.gain.setValueAtTime(1e-4, at);
        g.gain.exponentialRampToValueAtTime(0.32 * v, at + dur);
        g.gain.setValueAtTime(0, at + dur + 0.01);
        n.connect(bp).connect(g).connect(fx);
        send(g, revIn, 0.5);
        const o = O("sawtooth", 110, at), lp = F("lowpass", 1800), go = G();
        o.frequency.exponentialRampToValueAtTime(880, at + dur);
        go.gain.setValueAtTime(1e-4, at);
        go.gain.exponentialRampToValueAtTime(0.06 * v, at + dur);
        go.gain.setValueAtTime(0, at + dur + 0.01);
        o.connect(lp).connect(go).connect(fx);
        send(go, dIn, 0.3);
        o.start(at);
        o.stop(at + dur + 0.05);
      },
      reverse(at, dur, v = 1) {
        const n = N(at, dur), hp2 = F("highpass", 2400), g = G();
        g.gain.setValueAtTime(1e-4, at);
        g.gain.exponentialRampToValueAtTime(0.4 * v, at + dur);
        g.gain.setValueAtTime(0, at + dur + 8e-3);
        n.connect(hp2).connect(g).connect(fx);
        send(g, revIn, 0.3);
      },
      whoosh(at, dur = 0.5, dir = 1, v = 1) {
        const n = N(at, dur), bp = F("bandpass", 500, 1.6), g = G(), p = ctx.createStereoPanner();
        bp.frequency.setValueAtTime(450, at);
        bp.frequency.exponentialRampToValueAtTime(3800, at + dur * 0.55);
        bp.frequency.exponentialRampToValueAtTime(600, at + dur);
        g.gain.setValueAtTime(1e-4, at);
        g.gain.exponentialRampToValueAtTime(0.5 * v, at + dur * 0.55);
        g.gain.exponentialRampToValueAtTime(1e-4, at + dur);
        p.pan.setValueAtTime(-0.9 * dir, at);
        p.pan.linearRampToValueAtTime(0.9 * dir, at + dur);
        n.connect(bp).connect(g).connect(p).connect(fx);
        send(g, revIn, 0.3);
      },
      downlifter(at, dur) {
        const o = O("sawtooth", 1100, at), lp = F("lowpass", 2600), g = G();
        o.frequency.exponentialRampToValueAtTime(55, at + dur);
        lp.frequency.setValueAtTime(2600, at);
        lp.frequency.exponentialRampToValueAtTime(160, at + dur);
        g.gain.setValueAtTime(0.09, at);
        g.gain.exponentialRampToValueAtTime(1e-4, at + dur);
        o.connect(lp).connect(g).connect(fx);
        send(g, revIn, 0.4);
        o.start(at);
        o.stop(at + dur + 0.05);
      },
      // Tube néon qui s'allume : bourdonnement et grésillements irréguliers
      zap(at, v = 1) {
        const o = O("sawtooth", 98, at), bp = F("bandpass", 1500, 2.5), g = G();
        const pat = [1, 0, 0.8, 0, 0, 1, 0.3, 1];
        g.gain.setValueAtTime(0, at);
        pat.forEach((k, i) => g.gain.setValueAtTime(k * 0.09 * v, at + i * 0.028));
        g.gain.setValueAtTime(0.05 * v, at + pat.length * 0.028);
        g.gain.exponentialRampToValueAtTime(1e-4, at + 0.5);
        o.connect(bp).connect(g).connect(fx);
        send(g, revIn, 0.2);
        o.start(at);
        o.stop(at + 0.55);
        const n = N(at, 0.25), hp2 = F("highpass", 5e3), gn = G();
        gn.gain.setValueAtTime(0, at);
        pat.forEach((k, i) => gn.gain.setValueAtTime(k * 0.12 * v, at + i * 0.028 + 4e-3));
        gn.gain.setValueAtTime(0, at + 0.25);
        n.connect(hp2).connect(gn).connect(fx);
        const t = O("sine", 2600, at), gt = G();
        ad(gt, at, 0.05 * v, 1e-3, 0.12);
        t.connect(gt).connect(fx);
        send(gt, dIn, 0.4);
        t.start(at);
        t.stop(at + 0.2);
      },
      buzz(at, dur) {
        const o = O("sawtooth", 100, at), bp = F("bandpass", 1700, 3), g = G();
        g.gain.setValueAtTime(1e-4, at);
        g.gain.linearRampToValueAtTime(0.025, at + 0.05);
        g.gain.setValueAtTime(0.025, at + dur - 0.1);
        g.gain.linearRampToValueAtTime(1e-4, at + dur);
        o.connect(bp).connect(g).connect(fx);
        o.start(at);
        o.stop(at + dur + 0.05);
      },
      pop(at, v = 1) {
        const o = O("sine", 520, at), g = G();
        o.frequency.exponentialRampToValueAtTime(1500, at + 0.06);
        ad(g, at, 0.28 * v, 2e-3, 0.12);
        o.connect(g).connect(fx);
        send(g, dIn, 0.25);
        send(g, revIn, 0.25);
        o.start(at);
        o.stop(at + 0.2);
      },
      blip(at, f = 1400, v = 1) {
        const o = O("sine", f, at), g = G();
        ad(g, at, 0.12 * v, 2e-3, 0.08);
        o.connect(g).connect(pan((R() - 0.5) * 0.8)).connect(fx);
        send(g, dIn, 0.25);
        o.start(at);
        o.stop(at + 0.12);
      },
      click(at, v = 1) {
        const n = N(at, 0.03), hp2 = F("highpass", 3500), g = G();
        ad(g, at, 0.16 * v, 1e-3, 0.018);
        n.connect(hp2).connect(g).connect(pan((R() - 0.5) * 0.6)).connect(fx);
      },
      glitch(at, dur) {
        const sh = ctx.createWaveShaper();
        sh.curve = crushCurve;
        const g = G(0.11);
        sh.connect(g).connect(fx);
        send(g, dIn, 0.15);
        const step = BEAT / 8;
        for (let x = 0; x < dur; x += step) {
          if (R() < 0.3) continue;
          const t = at + x;
          if (R() < 0.55) {
            const o = O("square", 200 + R() * 1800, t), go = G();
            ad(go, t, 0.6, 1e-3, step * 0.8);
            o.connect(go).connect(sh);
            o.start(t);
            o.stop(t + step);
          } else {
            const n = N(t, step), go = G();
            ad(go, t, 0.7, 1e-3, step * 0.7);
            n.connect(go).connect(sh);
          }
        }
      },
      laser(at, v = 1) {
        const o = O("sawtooth", 2600, at), bp = F("bandpass", 1600, 3), g = G(), p = ctx.createStereoPanner();
        o.frequency.exponentialRampToValueAtTime(160, at + 0.4);
        ad(g, at, 0.1 * v, 3e-3, 0.4);
        p.pan.setValueAtTime(-0.8, at);
        p.pan.linearRampToValueAtTime(0.8, at + 0.4);
        o.connect(bp).connect(g).connect(p).connect(fx);
        send(g, dIn, 0.3);
        o.start(at);
        o.stop(at + 0.45);
      },
      bell(at, m, v = 1) {
        const parts = [[1, 0.22, 2.4], [2, 0.08, 1.4], [3.01, 0.05, 0.8], [4.17, 0.025, 0.45]];
        for (const [r, a, d] of parts) {
          const o = O("sine", mtof(m) * r, at), g = G();
          ad(g, at, a * v, 2e-3, d);
          o.connect(g).connect(fx);
          send(g, revIn, 0.5);
          send(g, dIn, 0.25);
          o.start(at);
          o.stop(at + d + 0.1);
        }
      },
      thump(at, v = 1) {
        const o = O("sine", 78, at), g = G();
        o.frequency.exponentialRampToValueAtTime(44, at + 0.35);
        ad(g, at, 0.55 * v, 4e-3, 0.55);
        o.connect(g).connect(fx);
        send(g, revIn, 0.35);
        o.start(at);
        o.stop(at + 0.7);
        const n = N(at, 0.2), lp = F("lowpass", 900), gn = G();
        ad(gn, at, 0.08 * v, 2e-3, 0.15);
        n.connect(lp).connect(gn).connect(fx);
        send(gn, revIn, 0.6);
      },
      shimmer(at, dur, v = 1) {
        const n = N(at, dur), bp = F("bandpass", 6e3, 6), g = G();
        g.gain.setValueAtTime(1e-4, at);
        g.gain.exponentialRampToValueAtTime(0.18 * v, at + dur * 0.4);
        g.gain.exponentialRampToValueAtTime(1e-4, at + dur);
        n.connect(bp).connect(g).connect(fx);
        send(g, revIn, 0.7);
        send(g, dIn, 0.3);
      },
      drone(at, m, dur) {
        const o = O("sine", mtof(m), at), o2 = O("triangle", mtof(m + 12), at), g = G();
        g.gain.setValueAtTime(1e-4, at);
        g.gain.linearRampToValueAtTime(0.08, at + dur * 0.5);
        g.gain.setValueAtTime(0.08, at + dur - 0.2);
        g.gain.linearRampToValueAtTime(1e-4, at + dur);
        const g2 = G(0.18);
        o.connect(g);
        o2.connect(g2).connect(g);
        g.connect(bus);
        for (const x of [o, o2]) {
          x.start(at);
          x.stop(at + dur + 0.05);
        }
      }
    };
    function score() {
      const ev = [];
      const at = (beat, fn) => ev.push({ t: beat * BEAT, run: fn });
      const chordAt = (bar) => CHORDS[BARS[Math.min(bar, BARS.length - 1)]];
      for (let bar = 0; bar < 16; bar++) {
        const c = chordAt(bar);
        const cut = bar < 2 ? 700 + bar * 500 : bar === 6 ? 1300 : bar >= 13 ? 2600 : 2e3;
        const v = bar < 2 ? 0.9 : bar === 6 ? 1.1 : 1;
        const att = bar === 0 ? 2 : bar === 6 ? 0.15 : 0.35;
        at(bar * 4, (t) => I.pad(t, c.pad, 4 * BEAT - 0.05, v, cut, att));
      }
      at(64, (t) => I.pad(t, [45, 57, 60, 64, 67, 71, 76], BEAT * 5, 1.25, 2400, 0.08));
      at(0, (t) => I.drone(t, 33, 8 * BEAT));
      [2, 3, 4, 5].forEach((b, i) => at(b, (t) => I.thump(t, 0.8 + i * 0.1)));
      at(1, (t) => I.shimmer(t, BEAT * 2.5, 0.8));
      [4, 4.75, 5.5, 6, 6.5, 7].forEach((b, i) => at(b, (t) => I.pluck(t, CHORDS.F.arp[i % 5], 0.7, 0.5)));
      at(5, (t) => I.riser(t, BEAT * 3, 1));
      at(6, (t) => I.reverse(t, BEAT * 2, 1));
      const groove = (bar, { ghost = true, fill = false, half = false } = {}) => {
        const b0 = bar * 4;
        if (half) {
          at(b0, (t) => I.kick(t, 1));
          at(b0 + 2, (t) => I.snare(t, 1, 0.8));
          for (let i = 0; i < 4; i++) at(b0 + i, (t) => I.hat(t, 0.6));
          return;
        }
        at(b0, (t) => I.kick(t, 1));
        at(b0 + 2, (t) => I.kick(t, 0.95));
        if (ghost && bar % 2 === 1) at(b0 + 2.5 + 0.25, (t) => I.kick(t, 0.6));
        at(b0 + 1, (t) => {
          I.snare(t);
          I.clap(t, 0.6);
        });
        if (!fill) at(b0 + 3, (t) => {
          I.snare(t);
          I.clap(t, 0.6);
        });
        for (let i = 0; i < 8; i++) {
          if (fill && i >= 4) break;
          at(b0 + i * 0.5, (t) => I.hat(t, i % 2 ? 1 : 0.55, i === 7));
        }
        for (let i = 0; i < 16; i += 2) if (!fill || i < 8) at(b0 + i * 0.25 + 0.25, (t) => I.hat(t, 0.25));
      };
      const bassBar = (bar, beats = 4) => {
        const c = chordAt(bar);
        for (let i = 0; i < beats * 2; i++) {
          const m = c.bass + (i % 2 ? 12 : 0);
          at(bar * 4 + i * 0.5, (t) => I.bass(t, m, BEAT * 0.45, i % 2 ? 0.8 : 1, i % 4 === 0 ? 1 : 0.6));
        }
      };
      const arpBar = (bar, v = 1, beats = 4) => {
        const c = chordAt(bar).arp;
        const order = [0, 1, 2, 3, 4, 3, 2, 1];
        for (let i = 0; i < beats * 4; i++) at(bar * 4 + i * 0.25, (t) => I.pluck(t, c[order[i % 8]], v * (i % 4 === 0 ? 1 : 0.7)));
      };
      at(8, (t) => I.impact(t, 0.9));
      for (let bar = 2; bar <= 5; bar++) {
        groove(bar, { fill: bar === 5 });
        bassBar(bar, bar === 5 ? 3 : 4);
        arpBar(bar, 0.8, bar === 5 ? 3 : 4);
      }
      at(9, (t) => I.stab(t, [57, 64, 69, 72], 0.9));
      at(11.75, (t) => I.whoosh(t, BEAT * 0.75, 1, 1.1));
      at(12.5, (t) => I.zap(t, 1));
      at(13, (t) => I.zap(t, 1.1));
      at(13.2, (t) => I.buzz(t, BEAT * 2.6));
      at(15.75, (t) => I.whoosh(t, BEAT * 0.6, -1, 1));
      at(16, (t) => I.crash(t, 0.8));
      at(20, (t) => I.riser(t, BEAT * 3, 0.8));
      [22, 22.25, 22.5, 22.75].forEach((b, i) => at(b, (t) => I.tom(t, [190, 160, 130, 100][i], 1)));
      at(22.5, (t) => I.downlifter(t, BEAT * 0.5));
      at(23, (t) => I.reverse(t, BEAT, 1.2));
      at(24, (t) => {
        I.impact(t, 1.25);
        I.kick(t, 1);
      });
      at(24, (t) => I.bassSwell(t, 33, BEAT * 4));
      arpBar(6, 0.45);
      at(24.5, (t) => I.shimmer(t, BEAT * 3, 1));
      [25, 25.6, 26, 26.6, 27, 27.2].forEach((b, i) => at(b, (t) => I.zap(t, 0.7 + i % 2 * 0.2)));
      at(26.5, (t) => I.pop(t, 1));
      at(27.75, (t) => I.reverse(t, BEAT * 0.25, 0.8));
      const stabC = [[57, 60, 64, 69], [57, 60, 65, 69], [60, 64, 67, 72]];
      [28, 29, 30].forEach(
        (b, i) => at(b, (t) => {
          I.stab(t, stabC[i], 1.1);
          I.snare(t, 0.9, 0.7);
          I.kick(t, 1);
        })
      );
      at(28, (t) => I.crash(t, 1));
      for (let bar = 7; bar <= 8; bar++) {
        if (bar === 7) {
          at(31, (t) => I.snare(t));
          for (let i = 6; i < 8; i++) at(28 + i * 0.5, (t) => I.hat(t, i % 2 ? 1 : 0.55, i === 7));
          for (let i = 0; i < 2; i++) at(31 + i * 0.5, (t) => I.bass(t, chordAt(7).bass + (i % 2 ? 12 : 0), BEAT * 0.45));
        } else {
          groove(bar);
          bassBar(bar);
        }
        arpBar(bar, 0.9);
      }
      at(35.5, (t) => I.whoosh(t, BEAT * 0.7, 1, 1));
      for (let bar = 9; bar <= 12; bar++) {
        groove(bar);
        bassBar(bar);
        arpBar(bar, 0.6);
      }
      HOOK.forEach(([b, m, d]) => at(36 + b, (t) => I.lead(t, m, d, 0.85)));
      [36, 40, 44, 48].forEach((b) => at(b, (t) => I.crash(t, 0.7)));
      at(36, (t) => I.laser(t, 0.6));
      [36.8, 36.9, 37].forEach((b, i) => at(b, (t) => I.blip(t, 1500 + i * 300, 0.8)));
      [37.25, 37.5, 38, 38.5, 38.75, 39].forEach((b, i) => at(b, (t) => I.blip(t, [900, 1200, 1e3, 1350, 1500, 1700][i], 1)));
      at(39.5, (t) => {
        I.click(t, 1.4);
        I.pop(t, 0.6);
      });
      at(39.75, (t) => I.whoosh(t, BEAT * 0.5, 1, 0.9));
      at(40, (t) => I.glitch(t, BEAT * 0.75));
      at(41, (t) => I.glitch(t, BEAT * 0.25));
      [41, 42, 43].forEach((b) => at(b, (t) => I.pop(t, 0.5)));
      at(42.5, (t) => I.glitch(t, BEAT * 0.4));
      at(43.75, (t) => I.whoosh(t, BEAT * 0.5, -1, 0.9));
      [44.5, 45, 45.5].forEach((b, i) => at(b, (t) => I.whoosh(t, BEAT * 0.4, i % 2 ? -1 : 1, 0.7)));
      [44.7, 45.2, 45.7].forEach((b) => at(b, (t) => I.click(t, 1.2)));
      at(47.75, (t) => I.whoosh(t, BEAT * 0.5, 1, 0.9));
      for (let i = 0; i < 44; i++) {
        const b = 48.3 + i * 0.062 + (i % 5 === 4 ? 0.06 : 0);
        if (b < 51) at(b, (t) => I.click(t, 0.6 + R() * 0.5));
      }
      at(51, (t) => I.laser(t, 0.8));
      at(51.25, (t) => I.riser(t, BEAT * 0.75, 0.7));
      at(52, (t) => I.impact(t, 1));
      for (let bar = 13; bar <= 14; bar++) {
        groove(bar);
        bassBar(bar);
        arpBar(bar, 0.7);
      }
      groove(15, { half: true });
      bassBar(15, 4);
      arpBar(15, 0.5);
      HOOK.filter(([b]) => b < 8).forEach(([b, m, d]) => at(52 + b, (t) => I.lead(t, m + 12, d, 0.7)));
      [[60, 74, 2], [62, 71, 1], [63, 74, 1]].forEach(([b, m, d]) => at(b, (t) => I.lead(t, m + 12, d, 0.65)));
      for (let i = 0; i < 8; i++) at(54 + i * 0.25, (t) => I.bell(t, [81, 84, 88, 91, 93, 96, 100, 103][i], 0.35));
      at(56, (t) => I.bell(t, 76, 1));
      at(58, (t) => I.pop(t, 0.5));
      at(63, (t) => I.reverse(t, BEAT, 0.9));
      at(64, (t) => {
        I.impact(t, 0.9);
        I.bass(t, 33, BEAT * 4, 1, 0.3);
        I.bell(t, 69, 0.8);
      });
      ev.sort((a, b) => a.t - b.t);
      return ev;
    }
    return { ctx, master, score, I, now0 };
  }
  var LivePlayer = class {
    constructor() {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC({ latencyHint: "interactive" });
      this.engine = createEngine(this.ctx);
      this.events = this.engine.score();
      this.i = 0;
      this.t0 = 0;
      this.timer = 0;
      this.muted = false;
    }
    get latency() {
      return (this.ctx.outputLatency || 0) + (this.ctx.baseLatency || 0);
    }
    // Démarre la partition comme si on était à `offset` secondes du début, avec un pré-délai.
    start(offset = 0, preroll = 0.08) {
      this.t0 = this.ctx.currentTime + preroll - offset;
      this.i = this.events.findIndex((e) => e.t >= offset - 0.02);
      if (this.i < 0) this.i = this.events.length;
      const m = this.engine.master.gain;
      m.cancelScheduledValues(this.ctx.currentTime);
      m.setValueAtTime(this.muted ? 0 : 0.82, this.ctx.currentTime);
      this.tick();
      this.timer = setInterval(() => this.tick(), 25);
    }
    tick() {
      const horizon = this.ctx.currentTime + 0.18;
      while (this.i < this.events.length && this.t0 + this.events[this.i].t < horizon) {
        const e = this.events[this.i++];
        const at = Math.max(this.t0 + e.t, this.ctx.currentTime + 5e-3);
        try {
          e.run(at);
        } catch {
        }
      }
    }
    time() {
      return this.ctx.currentTime - this.t0 - this.latency;
    }
    setMuted(m) {
      this.muted = m;
      const g = this.engine.master.gain, now = this.ctx.currentTime;
      g.cancelScheduledValues(now);
      g.setTargetAtTime(m ? 0 : 0.82, now, 0.06);
    }
    fadeOut(sec = 0.8) {
      const g = this.engine.master.gain, now = this.ctx.currentTime;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(0, now + sec);
      setTimeout(() => this.close(), sec * 1e3 + 100);
    }
    close() {
      clearInterval(this.timer);
      this.ctx.close?.().catch(() => {
      });
    }
  };
  async function renderOffline(seconds, sampleRate = 48e3) {
    const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
    const eng = createEngine(ctx);
    for (const e of eng.score()) if (e.t < seconds) e.run(e.t + 1e-4);
    return ctx.startRendering();
  }

  // src/styles.js
  var NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
  var CSS = (
    /* css */
    `
:host{all:initial}
*{box-sizing:border-box;margin:0;padding:0}
[hidden]{display:none!important}
.ck{position:fixed;inset:0;z-index:2147483647;background:#05030a;overflow:hidden;color:#f2f3fa;
  font-family:var(--font-schibsted,"Schibsted Grotesk"),"Schibsted Grotesk","Inter",system-ui,-apple-system,sans-serif;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-tap-highlight-color:transparent;
  user-select:none;-webkit-user-select:none;touch-action:none;overscroll-behavior:contain;contain:strict;
  --u:10px;--bh:0px;--ub:16px}
.ck.nogl{background:linear-gradient(180deg,#120624 0%,#3d1a63 30%,#c42a77 56%,#ff8a3d 66%,#2a0f2e 67%,#0b1020 100%)}
.mono{font-family:var(--font-geist-mono,"Geist Mono"),"Geist Mono",ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.2em;font-weight:500}
canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.nogl canvas.gl{display:none}
.stage{position:absolute;inset:0;pointer-events:none;will-change:transform}
.sc{position:absolute;inset:0;display:none;align-items:center;justify-content:center}
.a{position:absolute;left:50%;top:50%;width:max-content;will-change:transform,opacity}
.w{display:inline-block;position:relative;will-change:transform,opacity}
.grain{position:absolute;inset:-60px;background-image:${NOISE};background-size:220px 220px;opacity:.085;mix-blend-mode:overlay;pointer-events:none}
.bar{position:absolute;left:0;right:0;height:var(--bh);background:#000;pointer-events:none}
.bar.t{top:0}.bar.b{bottom:0}
.fade{position:absolute;inset:0;background:#05030a;pointer-events:none;opacity:0}

/* \u2014\u2014\u2014 Mati\xE8res typographiques \u2014\u2014\u2014 */
.big{font-weight:900;text-transform:uppercase;letter-spacing:-.045em;line-height:.84;white-space:nowrap}
.grad,.chrome,.shine{-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}
.grad{background-image:linear-gradient(180deg,#fff7e6 6%,#ffd68f 28%,#ff9d4d 50%,#ff3f8c 76%,#b93cff 100%)}
.chrome{background-image:linear-gradient(180deg,#ffffff 0%,#ffeef8 38%,#ffb8d9 47%,#3a1252 49.5%,#7a2a7a 53%,#ff8a4d 62%,#ffd59a 80%,#fff4e0 100%)}
.glowP{filter:drop-shadow(0 0 calc(var(--u)*1.4) rgba(255,61,139,.5)) drop-shadow(0 calc(var(--u)*.35) calc(var(--u)*.25) rgba(25,0,35,.55))}
.glowA{filter:drop-shadow(0 0 calc(var(--u)*1.1) rgba(255,160,80,.45))}
.neon{color:#fff5fb;text-shadow:0 0 .02em #fff,0 0 .06em #ffd0e6,0 0 .16em #ff4fa3,0 0 .38em #ff2e88,0 0 .8em rgba(255,110,60,.75)}
.tube{color:rgba(255,120,190,.13);-webkit-text-stroke:1px rgba(255,140,200,.22)}
.shine{position:absolute;left:0;top:0;pointer-events:none;background-image:linear-gradient(100deg,transparent 40%,rgba(255,255,255,.95) 50%,transparent 60%);
  background-size:320% 100%;background-repeat:no-repeat;background-position:130% 0}

/* \u2014\u2014\u2014 Sc\xE8ne 1 \u2014\u2014\u2014 */
.s1l{display:flex;flex-wrap:wrap;justify-content:center;gap:0 .3em;font-weight:800;text-transform:uppercase;font-size:calc(var(--u)*7.2);letter-spacing:.04em;line-height:1;
  color:#fff;text-shadow:0 0 .25em rgba(255,80,160,.6),0 0 .9em rgba(255,120,60,.35);white-space:nowrap}
.flare{position:absolute;left:50%;top:calc(50% + var(--u)*6.4);width:calc(var(--u)*86);height:2px;margin-left:calc(var(--u)*-43);
  background:linear-gradient(90deg,transparent,rgba(255,120,190,.85) 30%,#fff 50%,rgba(255,170,90,.85) 70%,transparent);box-shadow:0 0 14px rgba(255,90,160,.9),0 0 40px rgba(255,140,60,.5)}

/* \u2014\u2014\u2014 Sc\xE8ne 2 \u2014\u2014\u2014 */
.row{display:flex;align-items:baseline;justify-content:center}
.s2a .row{font-size:calc(var(--u)*17);gap:.2em}
.s2b .row{font-size:calc(var(--u)*12.5);gap:.25em;font-weight:800;text-transform:uppercase;letter-spacing:-.02em;line-height:.9;white-space:nowrap}
.tw{position:relative;display:inline-block}
.tw>.neon{position:absolute;left:0;top:0}
.s2c .lk{display:flex;flex-direction:column;align-items:center}
.s2c .k{font-size:calc(var(--u)*1.5);color:#ffd48f;letter-spacing:.42em;margin-bottom:calc(var(--u)*2.2);text-shadow:0 0 12px rgba(255,160,80,.7)}
.s2c .l1{font-size:calc(var(--u)*13.5)}
.s2c .l2{font-size:calc(var(--u)*7);font-weight:800;text-transform:uppercase;letter-spacing:.02em;margin-top:calc(var(--u)*1.6);line-height:1}
.loc{position:absolute;left:calc(var(--u)*5);bottom:calc(var(--bh) + var(--u)*3.2);display:flex;align-items:center;gap:12px;font-size:max(11px,calc(var(--u)*1.05));color:rgba(255,236,220,.88);text-shadow:0 1px 8px rgba(0,0,0,.6)}
.loc i{width:8px;height:8px;border-radius:50%;background:#ff2e88;box-shadow:0 0 10px #ff2e88}
.loc b{display:block;width:calc(var(--u)*4);height:1px;background:rgba(255,236,220,.6)}

/* \u2014\u2014\u2014 Logo \u2014\u2014\u2014 */
.logo{display:block;width:100%;height:auto;overflow:visible}
.logo .st path{fill:none;stroke-width:22;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 2}
.logo .o{fill:#ffc46b}
.logo .dt{fill:#fff}
.logo .spk{fill:#fff}
.lw{position:absolute;left:50%;top:50%;will-change:transform,opacity,filter}
.s3 .lw{width:calc(var(--u)*54)}
.s3t{position:absolute;left:50%;top:50%;width:max-content;font-size:calc(var(--u)*9.4);gap:.24em}

/* \u2014\u2014\u2014 Sc\xE8ne 4 \u2014\u2014\u2014 */
.g4{position:absolute;left:calc(var(--u)*7);right:calc(var(--u)*7);top:calc(var(--bh) + var(--u)*3);bottom:calc(var(--bh) + var(--u)*5);display:grid;grid-template-columns:1fr 1.05fr;gap:calc(var(--u)*5)}
.tx,.vs{position:relative}
.m{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%)}
.ml{display:flex;align-items:center;gap:.9em;font-size:max(11px,calc(var(--u)*1.25));color:#ffd48f;margin-bottom:calc(var(--u)*2.2)}
.ml i{width:.7em;height:.7em;border-radius:50%;background:#ffc46b;box-shadow:0 0 12px rgba(255,196,107,.9)}
.ml em{font-style:normal;color:rgba(242,243,250,.45)}
.mt{width:max-content;font-weight:850;font-size:calc(var(--u)*5.5);line-height:.98;letter-spacing:-.035em;white-space:nowrap}
.ln{display:block;overflow:hidden;padding:.04em 0 .1em;margin-bottom:-.06em}
.ln>span{display:inline-block;position:relative;will-change:transform,opacity}
.ln.g>span{background-image:linear-gradient(90deg,#ffd68f 0%,#ff9d4d 35%,#ff3f8c 75%,#c04bff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 calc(var(--u)*.9) rgba(255,61,139,.35))}
.m3 .mt{perspective:calc(var(--u)*60)}
.m3 .ln{overflow:visible}
.m3 .ln>span{transform-origin:50% 100%;backface-visibility:hidden}
.m4 .ln>span{padding-right:.12em}
.car{position:absolute;top:.1em;bottom:.12em;width:.08em;background:#ffc46b;box-shadow:0 0 12px rgba(255,196,107,.9)}
.md{text-shadow:0 1px 12px rgba(15,0,25,.85);margin-top:calc(var(--u)*2.2);font-size:max(14px,calc(var(--u)*1.55));line-height:1.45;color:rgba(242,243,250,.78);max-width:calc(var(--u)*34);white-space:normal}
.pb{position:absolute;left:calc(var(--u)*7);bottom:calc(var(--bh) + var(--u)*2.2);display:flex;gap:8px}
.pb i{display:block;width:calc(var(--u)*4.5);height:3px;border-radius:3px;background:rgba(242,243,250,.16);overflow:hidden;position:relative}
.pb i b{position:absolute;inset:0;background:linear-gradient(90deg,#ff3f8c,#ffc46b);transform-origin:0 50%;transform:scaleX(0)}
.v{position:absolute;left:50%;top:50%;width:max-content;will-change:transform,opacity;perspective:calc(var(--u)*110)}

/* v1 navigateur */
.bw{position:relative;width:calc(var(--u)*44);aspect-ratio:400/270;transform-style:preserve-3d}
.bw svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.bw rect,.bw line{fill:none;stroke:#ff6fb5;stroke-width:2;vector-effect:non-scaling-stroke;stroke-dasharray:1 2;filter:drop-shadow(0 0 6px rgba(255,79,163,.9))}
.bw .bg{position:absolute;inset:0;border-radius:3.5%/5.2%;background:linear-gradient(160deg,rgba(40,16,60,.78),rgba(12,8,30,.86))}
.bw i{position:absolute;display:block;will-change:transform,opacity}
.bw .d{top:4.2%;width:2.6%;aspect-ratio:1;border-radius:50%}
.bw .d1{left:4%;background:#ff5f7a}.bw .d2{left:8%;background:#ffc46b}.bw .d3{left:12%;background:#ff9d4d}
.bw .url{left:34%;width:32%;top:4.1%;height:4.6%;border-radius:99px;background:rgba(242,243,250,.12);transform-origin:0 50%}
.bw .hero{left:5%;right:5%;top:17%;height:36%;border-radius:10px;background:linear-gradient(120deg,#ffb15a 0%,#ff4f8f 55%,#7d35ff 100%);transform-origin:50% 0;overflow:hidden}
.bw .hero::after{content:"";position:absolute;inset:0;background:radial-gradient(60% 90% at 80% 110%,rgba(255,220,150,.75),transparent 60%)}
.bw .h1{left:10%;top:25%;width:38%;height:6%;border-radius:4px;background:#fff;transform-origin:0 50%;z-index:1}
.bw .h2{left:10%;top:34%;width:26%;height:3.6%;border-radius:4px;background:rgba(255,255,255,.75);transform-origin:0 50%;z-index:1}
.bw .bt{left:10%;top:42%;width:16%;height:6.4%;border-radius:99px;background:#0b1020;z-index:1}
.bw .cd{top:59%;width:27.5%;height:31%;border-radius:10px;background:linear-gradient(180deg,rgba(242,243,250,.16),rgba(242,243,250,.05));border:1px solid rgba(255,255,255,.14)}
.bw .c1{left:5%}.bw .c2{left:36.25%}.bw .c3{left:67.5%}
.bw .cur{left:0;top:0;width:5%;aspect-ratio:18/26;z-index:3;background:#fff;clip-path:polygon(0 0,0 85%,30% 62%,52% 100%,68% 92%,48% 55%,100% 55%);filter:drop-shadow(0 2px 4px rgba(0,0,0,.6))}
.bw .rip{left:18%;top:45%;width:12%;aspect-ratio:1;margin:-6% 0 0 -6%;border-radius:50%;border:2px solid #ffc46b;z-index:2}

/* v2 t\xE9l\xE9phone */
.ph{position:relative;width:calc(var(--u)*17);aspect-ratio:9/19;border-radius:calc(var(--u)*2.8);border:2px solid rgba(255,255,255,.55);padding:calc(var(--u)*.7);
  background:#0a0612;box-shadow:0 0 0 1px rgba(255,79,163,.4),0 0 60px rgba(255,46,136,.45),inset 0 0 0 1px rgba(255,255,255,.06)}
.scr{position:relative;width:100%;height:100%;border-radius:calc(var(--u)*2.1);overflow:hidden;background:linear-gradient(200deg,#2b0f4a 0%,#c22a7a 45%,#ff8a3d 70%,#ffd08a 100%);background-size:100% 220%}
.scr .sg{position:absolute;left:12%;right:12%;top:16%;height:22%;border-radius:12px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25)}
.chip{position:absolute;left:12%;right:12%;height:9%;border-radius:99px;display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:700;font-size:calc(var(--u)*1.25);color:#0b1020;background:#fff;box-shadow:0 6px 20px rgba(40,0,40,.35)}
.chip.k1{top:48%;background:#ffc46b}.chip.k2{top:60%}.chip.k3{top:72%}
.notch{position:absolute;left:38%;right:38%;top:calc(var(--u)*1.2);height:calc(var(--u)*.9);border-radius:99px;background:#000;display:block}
.ring{position:absolute;display:block;width:calc(var(--u)*6);height:calc(var(--u)*6);margin:calc(var(--u)*-3) 0 0 calc(var(--u)*-3);border-radius:50%;border:2px solid #ff6fb5;box-shadow:0 0 18px rgba(255,79,163,.8)}

/* v3 cartes */
.cds{position:relative;width:calc(var(--u)*50);height:calc(var(--u)*26);transform-style:preserve-3d}
.cd3{position:absolute;left:50%;top:50%;width:calc(var(--u)*15.5);height:calc(var(--u)*20);margin:calc(var(--u)*-10) 0 0 calc(var(--u)*-7.75);border-radius:calc(var(--u)*1.6);padding:calc(var(--u)*1.6);
  display:flex;flex-direction:column;justify-content:flex-end;gap:calc(var(--u)*.5);background:linear-gradient(165deg,rgba(255,255,255,.18),rgba(255,255,255,.04) 55%,rgba(255,61,139,.14));
  border:1px solid rgba(255,255,255,.24);box-shadow:0 30px 60px -20px rgba(10,0,20,.8),inset 0 1px 0 rgba(255,255,255,.25);backface-visibility:hidden}
.cd3 svg{position:absolute;left:calc(var(--u)*1.6);top:calc(var(--u)*1.6);width:calc(var(--u)*4);height:calc(var(--u)*4);fill:none;stroke:#ffc46b;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 6px rgba(255,196,107,.8))}
.cd3 b{font-size:calc(var(--u)*1.85);font-weight:800;letter-spacing:-.02em;line-height:1.05;white-space:nowrap}
.cd3 span{font-size:max(11px,calc(var(--u)*1.1));color:rgba(242,243,250,.7);line-height:1.3}

/* v4 code */
.cw{position:relative;width:calc(var(--u)*44)}
.code{border-radius:calc(var(--u)*1.4);background:rgba(10,6,24,.82);border:1px solid rgba(255,255,255,.16);box-shadow:0 0 0 1px rgba(255,79,163,.25),0 40px 80px -30px rgba(0,0,0,.9),0 0 70px rgba(255,46,136,.22);overflow:hidden;position:relative}
.cbar{display:flex;align-items:center;gap:7px;padding:calc(var(--u)*1) calc(var(--u)*1.4);border-bottom:1px solid rgba(255,255,255,.08);font-size:max(10px,calc(var(--u)*.95));color:rgba(242,243,250,.5)}
.cbar i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.18)}
.cbar span{margin-left:10px;letter-spacing:.08em;text-transform:none}
.cl{padding:calc(var(--u)*1.5) calc(var(--u)*1.8);font-size:calc(var(--u)*1.42);line-height:1.62;letter-spacing:0;text-transform:none;white-space:pre;color:#e8e6f5}
.cl>span{display:block;height:1.62em;overflow:hidden;white-space:pre}
.cl>span>span{display:inline-block;overflow:hidden;white-space:pre;vertical-align:top}
.kw{color:#ff6fb5}.s{color:#ffc46b}.p{color:#9fa6d8}.cm{color:#7a83b8}.ok{color:#7dffb0}
.ccar{position:absolute;width:.6em;height:1.2em;background:#ffc46b;box-shadow:0 0 10px rgba(255,196,107,.9)}
.scan{position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,#ff6fb5,#fff,#ff6fb5,transparent);box-shadow:0 0 18px #ff2e88;display:block}
.tag{position:absolute;right:calc(var(--u)*-3.5);top:calc(var(--u)*-5.5);font-weight:900;font-size:calc(var(--u)*7);letter-spacing:-.04em}

/* \u2014\u2014\u2014 Sc\xE8ne 5 \u2014\u2014\u2014 */
.s5 .lw{width:calc(var(--u)*40)}
.t5{position:absolute;left:50%;top:50%;width:max-content;display:flex;flex-wrap:wrap;justify-content:center;font-size:calc(var(--u)*6.2);font-weight:900;text-transform:uppercase;letter-spacing:-.03em;line-height:.95;white-space:nowrap}
.t5 .ch{display:inline-block;will-change:transform,opacity}
.t5 .sp{display:inline-block;width:.26em}
.t5 .br{display:none;flex-basis:100%;height:0}
.u5{position:absolute;left:50%;top:50%;width:max-content;text-shadow:0 1px 14px rgba(20,0,30,.9);display:flex;align-items:center;gap:.7em;font-size:max(13px,calc(var(--u)*1.9));color:#f2f3fa;letter-spacing:.24em;text-transform:lowercase}
.u5 i{width:.55em;height:.55em;border-radius:50%;background:#ffc46b;box-shadow:0 0 14px rgba(255,196,107,.95)}
.pk{position:absolute;left:50%;top:50%;width:max-content;font-size:max(11px,calc(var(--u)*1.35));color:#ffd48f;letter-spacing:.34em;white-space:nowrap;display:none}
.cta{position:absolute;left:50%;top:50%;width:max-content;display:flex;gap:12px;flex-wrap:wrap;justify-content:center}

/* \u2014\u2014\u2014 Boutons (m\xEAmes codes que cliko.be) \u2014\u2014\u2014 */
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;-webkit-appearance:none;appearance:none}
button:focus-visible{outline:2px solid #ffc46b;outline-offset:3px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.6em;min-height:48px;padding:0 1.6em;border-radius:999px;font-weight:600;font-size:max(15px,calc(var(--u)*1.25));letter-spacing:-.005em;white-space:nowrap;
  transition:transform .3s cubic-bezier(.4,0,.2,1),background-color .3s,box-shadow .3s}
.btn:active{transform:translateY(1px) scale(.985)}
.btn.pri{background:#ffc46b;color:#0b1020;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 10px 34px -10px rgba(255,196,107,.85)}
.btn.pri:hover{background:#ffd48f}
.btn.sec{background:rgba(242,243,250,.07);color:#f2f3fa;border:1px solid rgba(185,196,240,.24);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.btn.sec:hover{background:rgba(242,243,250,.12)}

/* \u2014\u2014\u2014 Interface pendant la lecture \u2014\u2014\u2014 */
.ui{position:absolute;inset:0;pointer-events:none}
.ui>*{pointer-events:auto}
.ctl{position:absolute;bottom:var(--ub);display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 16px;border-radius:999px;font-size:11px;
  background:rgba(10,8,20,.42);border:1px solid rgba(255,255,255,.14);color:rgba(242,243,250,.86);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
  transition:opacity .5s,background-color .3s}
.ctl:hover{background:rgba(30,20,50,.6);color:#fff}
.skip{right:max(16px,calc(var(--u)*3))}
.snd{left:max(16px,calc(var(--u)*3))}
.snd svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.snd .x{display:none}.snd[aria-pressed="false"] .x{display:inline}.snd[aria-pressed="false"] .wv{display:none}
.prog{position:absolute;left:0;right:0;bottom:0;height:2px;background:rgba(255,255,255,.06);pointer-events:none}
.prog b{position:absolute;inset:0;background:linear-gradient(90deg,#ff3f8c,#ffc46b);transform-origin:0 50%;transform:scaleX(0)}

/* \u2014\u2014\u2014 \xC9cran de lancement \u2014\u2014\u2014 */
.gate{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(var(--u)*2.2);text-align:center;padding:24px;transition:opacity .55s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1)}
.gate.off{opacity:0;transform:scale(1.04);pointer-events:none}
.gate .lw{position:relative;left:auto;top:auto;width:max(150px,calc(var(--u)*15));filter:drop-shadow(0 0 18px rgba(255,79,163,.45))}
.gate .lw .st path{stroke-dasharray:none}
.gk{font-size:max(10px,calc(var(--u)*.95));color:rgba(255,212,143,.9);letter-spacing:.38em;margin-top:calc(var(--u)*.6)}
.play{position:relative;margin-top:calc(var(--u)*1.6);min-height:60px;padding:0 2.1em 0 1.1em;font-size:max(16px,calc(var(--u)*1.45));gap:.9em}
.play .pi{position:relative;display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:#0b1020}
.play .pi svg{width:14px;height:14px;fill:#ffc46b;margin-left:2px}
.play::before{content:"";position:absolute;inset:-6px;border-radius:999px;border:1px solid rgba(255,196,107,.55);animation:ckpulse 2.4s cubic-bezier(.22,1,.36,1) infinite}
@keyframes ckpulse{0%{transform:scale(.96);opacity:.9}70%,100%{transform:scale(1.18);opacity:0}}
.gh{font-size:max(10px,calc(var(--u)*.9));color:rgba(242,243,250,.55);letter-spacing:.3em}
.enter{margin-top:calc(var(--u)*1.4);font-size:max(13px,calc(var(--u)*1.05));color:rgba(242,243,250,.7);min-height:44px;padding:0 12px;text-decoration:underline;text-underline-offset:5px;text-decoration-color:rgba(242,243,250,.25)}
.enter:hover{color:#fff}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* \u2014\u2014\u2014 Portrait (smartphones) \u2014\u2014\u2014 */
.pt .s1l{font-size:calc(var(--u)*11.5);flex-direction:column;align-items:center;gap:.04em}
.pt .s1l .grp{display:block}
.pt .flare{top:calc(50% + var(--u)*16);width:calc(var(--u)*70);margin-left:calc(var(--u)*-35)}
.pt .s2a .row{flex-direction:column;align-items:center;font-size:calc(var(--u)*30);gap:0;line-height:.86}
.pt .s2b .row{flex-direction:column;align-items:center;font-size:calc(var(--u)*19);gap:.06em}
.pt .s2c .l1{font-size:calc(var(--u)*20)}
.pt .s2c .l2{font-size:calc(var(--u)*11)}
.pt .s2c .k{font-size:calc(var(--u)*2.2)}
.pt .s3 .lw{width:calc(var(--u)*66)}
.pt .s3t{font-size:calc(var(--u)*10.5)}
.pt .g4{left:calc(var(--u)*7);right:calc(var(--u)*7);top:calc(var(--u)*10);bottom:calc(var(--u)*14);grid-template-columns:1fr;grid-template-rows:1.05fr 1fr;gap:calc(var(--u)*4)}
.pt .tx{order:2}.pt .vs{order:1}
.pt .m{top:0;transform:none}
.pt .mt{font-size:calc(var(--u)*7.5)}
.pt .ml{font-size:max(11px,calc(var(--u)*2.2))}
.pt .md{font-size:max(14px,calc(var(--u)*2.9));max-width:none}
.pt .pb{left:calc(var(--u)*7);bottom:calc(var(--u)*8)}
.pt .pb i{width:calc(var(--u)*9)}
.pt .bw,.pt .cw{width:calc(var(--u)*68)}
.pt .ph{width:calc(var(--u)*26)}
.pt .chip{font-size:calc(var(--u)*1.9)}
.pt .cds{width:calc(var(--u)*68);height:calc(var(--u)*34)}
.pt .cd3{width:calc(var(--u)*21);height:calc(var(--u)*29);margin:calc(var(--u)*-14.5) 0 0 calc(var(--u)*-10.5);padding:calc(var(--u)*2.4)}
.pt .cd3 b{font-size:calc(var(--u)*2.45)}
.pt .cd3 span{font-size:max(11px,calc(var(--u)*1.9))}
.pt .cd3 svg{width:calc(var(--u)*6);height:calc(var(--u)*6);left:calc(var(--u)*2.4);top:calc(var(--u)*2.4)}
.pt .cl{font-size:calc(var(--u)*2.55)}
.pt .tag{font-size:calc(var(--u)*10);right:0;top:calc(var(--u)*-11)}
.pt .s5 .lw{width:calc(var(--u)*64)}
.pt .t5{font-size:calc(var(--u)*11.5)}
.pt .t5 .br{display:block}
.pt .t5 .sp.b4{display:none}
.pt .u5{font-size:max(14px,calc(var(--u)*3.2))}
.pt .pk{font-size:max(10px,calc(var(--u)*2.1));letter-spacing:.24em}
.pt .cta{flex-direction:column;align-items:stretch;width:min(86vw,360px)}
.pt .loc{left:calc(var(--u)*7);bottom:calc(var(--u)*9)}
`
  );

  // src/markup.js
  var esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  var logoSVG = (extra = "") => `
<svg class="logo" viewBox="0 0 480 148" aria-hidden="true" ${extra}>
  <g class="st" stroke="#fff">
    <path class="p0" d="M82.47 68.57A41 41 0 1 0 82.47 123.43" pathLength="1"/>
    <path class="p1" d="M123 11V135" pathLength="1"/>
    <path class="p2" d="M179 57V135" pathLength="1"/>
    <path class="p3" d="M235 11V135" pathLength="1"/>
    <path class="p4" d="M235 112L289 57" pathLength="1"/>
    <path class="p5" d="M253 93.67L293 135" pathLength="1"/>
  </g>
  <circle class="dt" cx="179" cy="16" r="13"/>
  <path class="o" fill-rule="evenodd" d="M372 44H428A52 52 0 0 1 428 148H372A52 52 0 0 1 372 44ZM389 96A39 39 0 1 0 467 96A39 39 0 1 0 389 96Z"/>
  <circle class="spk" r="10" opacity="0"/>
</svg>`;
  var shineWord = (txt, cls) => `<span class="w ${cls}"><span class="grad">${esc(txt)}</span><span class="shine" aria-hidden="true">${esc(txt)}</span></span>`;
  var neonWord = (txt, cls) => `<span class="w tw ${cls}"><span class="tube">${esc(txt)}</span><span class="neon">${esc(txt)}</span></span>`;
  var ICONS = [
    // globe
    `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9s-1.3 6.3-3.9 9c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3z"/></svg>`,
    // serveur
    `<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="6.5" rx="2"/><rect x="4" y="13.5" width="16" height="6.5" rx="2"/><path d="M8 7.25h.01M8 16.75h.01M12 7.25h4M12 16.75h4"/></svg>`,
    // bulle
    `<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/></svg>`
  ];
  function buildMarkup(L) {
    const sv = L.services;
    const code = [
      `<span class="kw">const</span> site = cliko.<span class="kw">create</span><span class="p">({</span>`,
      `  commerce<span class="p">:</span> <span class="s">"${esc(L.yours)}"</span><span class="p">,</span>`,
      `  langues<span class="p">: [</span><span class="s">"fr"</span><span class="p">,</span> <span class="s">"nl"</span><span class="p">,</span> <span class="s">"en"</span><span class="p">],</span>`,
      `  design<span class="p">:</span> <span class="s">"sur-mesure"</span><span class="p">,</span>`,
      `  hosting<span class="p">:</span> <span class="kw">true</span><span class="p">,</span>`,
      `<span class="p">});</span>`,
      `site.<span class="kw">launch</span><span class="p">();</span> <span class="cm">// </span><span class="ok">\u2713 live</span>`
    ];
    const t5 = "THE FUTURE IS DIGITAL.";
    let t5html = "";
    let wi = 0;
    for (const ch of t5) {
      if (ch === " ") {
        wi++;
        t5html += `<span class="sp b${wi * 2}"></span>`;
        if (wi === 2) t5html += `<span class="br"></span>`;
      } else t5html += `<span class="ch grad">${esc(ch)}</span>`;
    }
    const mission = (i) => {
      const [a, b] = sv[i];
      return `<div class="m m${i + 1}">
      <div class="ml mono"><i></i><span>Mission 0${i + 1}</span><em>/ 04</em></div>
      <div class="mt"><span class="ln"><span>${esc(a)}</span></span><span class="ln g"><span>${esc(b)}</span></span>${i === 3 ? '<span class="car"></span>' : ""}</div>
      <p class="md">${esc(L.desc[i])}</p>
    </div>`;
    };
    return `
<div class="ck" role="dialog" aria-modal="true" aria-label="${esc(L.label)}">
  <canvas class="gl" aria-hidden="true"></canvas>
  <canvas class="sil" aria-hidden="true"></canvas>
  <div class="stage" aria-hidden="true">
    <div class="sc s1"><div class="a s1w"><div class="s1l"><span class="grp"><span class="w">The</span> <span class="w">wait</span></span> <span class="grp"><span class="w">is</span> <span class="w">over.</span></span></div></div><div class="flare"></div></div>

    <div class="sc s2a"><div class="a"><div class="row big glowP">${shineWord("GTA", "gta")}${shineWord("VI", "vi")}</div></div></div>
    <div class="sc s2b"><div class="a"><div class="row">${neonWord("IS", "is")}${neonWord("HERE.", "here")}</div></div></div>
    <div class="sc s2c"><div class="a"><div class="lk">
      <div class="k mono">The wait is over</div>
      <div class="big glowP l1">${shineWord("GTA VI", "l1w")}</div>
      <div class="l2">${neonWord("IS HERE.", "l2w")}</div>
    </div></div></div>
    <div class="loc mono"><i></i><span class="lt"></span><b></b></div>

    <div class="sc s3">
      <div class="lw l3">${logoSVG()}</div>
      <div class="row big s3t glowP"><span class="w chrome">We</span><span class="w chrome">are</span><span class="w chrome">too.</span></div>
    </div>

    <div class="sc s4">
      <div class="g4">
        <div class="tx">${[0, 1, 2, 3].map(mission).join("")}</div>
        <div class="vs">
          <div class="v v1"><div class="bw">
            <div class="bg"></div>
            <svg viewBox="0 0 400 270" preserveAspectRatio="none"><rect class="fr" x="1" y="1" width="398" height="268" rx="14" pathLength="1"/><line class="tb" x1="1" y1="30" x2="399" y2="30" pathLength="1"/></svg>
            <i class="d d1"></i><i class="d d2"></i><i class="d d3"></i><i class="url"></i>
            <i class="hero"></i><i class="h1"></i><i class="h2"></i><i class="bt"></i>
            <i class="cd c1"></i><i class="cd c2"></i><i class="cd c3"></i>
            <i class="rip"></i><i class="cur"></i>
          </div></div>
          <div class="v v2"><div class="ph"><div class="scr"><i class="sg"></i>${L.chips.map((c, i) => `<i class="chip k${i + 1}">${esc(c)}</i>`).join("")}</div><i class="notch"></i></div><i class="ring r1"></i><i class="ring r2"></i><i class="ring r3"></i></div>
          <div class="v v3"><div class="cds">${L.cards.map(([b, s], i) => `<div class="cd3 q${i + 1}">${ICONS[i]}<b>${esc(b)}</b><span>${esc(s)}</span></div>`).join("")}</div></div>
          <div class="v v4"><div class="cw"><div class="code"><div class="cbar"><i></i><i></i><i></i><span class="mono">cliko.config.js</span></div><div class="cl mono">${code.map((c) => `<span><span>${c}</span></span>`).join("")}</div><i class="ccar"></i><i class="scan"></i></div><div class="tag neon">&lt;/&gt;</div></div></div>
        </div>
      </div>
      <div class="pb"><i><b></b></i><i><b></b></i><i><b></b></i><i><b></b></i></div>
    </div>

    <div class="sc s5">
      <div class="pk mono">GTA VI is here. We are too.</div>
      <div class="lw l5">${logoSVG()}</div>
      <div class="t5 glowP">${t5html}</div>
      <div class="u5 mono"><i></i><span>cliko.be</span></div>
    </div>
  </div>
  <div class="grain" aria-hidden="true"></div>
  <div class="bar t" aria-hidden="true"></div><div class="bar b" aria-hidden="true"></div>
  <div class="fade" aria-hidden="true"></div>
  <div class="ui">
    <div class="cta" hidden><button class="btn pri go-site">${esc(L.site)}</button><button class="btn sec go-quote">${esc(L.quote)}</button></div>
    <div class="gate" hidden>
      <div class="lw">${logoSVG()}</div>
      <div class="gk mono">${esc(L.prod)}</div>
      <button class="btn pri play"><span class="pi"><svg viewBox="0 0 14 16"><path d="M0 0l14 8-14 8z"/></svg></span><span>${esc(L.play)}</span></button>
      <div class="gh mono">${esc(L.hint)}</div>
      <button class="enter">${esc(L.enter)} \u2192</button>
    </div>
    <button class="ctl snd mono" aria-pressed="true" hidden><svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="wv" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/><path class="x" d="M17 9.5l5 5M22 9.5l-5 5"/></svg><span class="sl"></span></button>
    <button class="ctl skip mono" hidden>${esc(L.skip)} \u203A</button>
    <div class="prog" hidden><b></b></div>
  </div>
  <p class="sr" aria-live="polite"></p>
</div>`;
  }
  var codeLens = (L) => ["const site = cliko.create({", `  commerce: "${L.yours}",`, '  langues: ["fr", "nl", "en"],', '  design: "sur-mesure",', "  hosting: true,", "});", "site.launch(); // \u2713 live"].map((s) => s.length);

  // src/i18n.js
  var STR = {
    fr: {
      label: "Trailer Cliko : GTA VI is here. We are too. Cr\xE9ation de sites web, exp\xE9riences digitales, solutions modernes, d\xE9veloppement sur mesure. The future is digital.",
      prod: "Une production Cliko \xB7 Bruxelles",
      play: "Lancer le trailer",
      hint: "Son recommand\xE9 \xB7 35 s",
      enter: "Entrer directement sur le site",
      skip: "Passer l\u2019intro",
      soundOn: "Son activ\xE9",
      soundOff: "Son coup\xE9",
      site: "Entrer sur le site",
      quote: "Demander un devis",
      replay: "Lire le trailer",
      loc1: "Bruxelles \u2014 19:47",
      loc2: "En direct \xB7 cliko.be",
      services: [["Cr\xE9ation de", "sites web"], ["Exp\xE9riences", "digitales"], ["Solutions", "modernes"], ["D\xE9veloppement", "sur mesure"]],
      desc: [
        "Des sites vitrines sur mesure, pens\xE9s pour votre commerce.",
        "Animations, interactions : une marque dont on se souvient.",
        "H\xE9bergement, nom de domaine, mises \xE0 jour : on s\u2019occupe de tout.",
        "Du code \xE9crit \xE0 la main \xE0 Bruxelles, rapide sur tous les \xE9crans."
      ],
      chips: ["R\xE9server", "Menu", "Contact"],
      cards: [["FR \xB7 NL \xB7 EN", "Trois langues"], ["H\xE9bergement", "et nom de domaine inclus"], ["24 h", "pour vous r\xE9pondre"]],
      yours: "le v\xF4tre"
    },
    nl: {
      label: "Cliko-trailer: GTA VI is here. We are too. Websitecreatie, digitale ervaringen, moderne oplossingen, ontwikkeling op maat. The future is digital.",
      prod: "Een Cliko-productie \xB7 Brussel",
      play: "Trailer starten",
      hint: "Met geluid \xB7 35 s",
      enter: "Meteen naar de site",
      skip: "Intro overslaan",
      soundOn: "Geluid aan",
      soundOff: "Geluid uit",
      site: "Naar de site",
      quote: "Offerte aanvragen",
      replay: "Trailer afspelen",
      loc1: "Brussel \u2014 19:47",
      loc2: "Live \xB7 cliko.be",
      services: [["Website-", "creatie"], ["Digitale", "ervaringen"], ["Moderne", "oplossingen"], ["Ontwikkeling", "op maat"]],
      desc: [
        "Websites op maat, ontworpen voor uw zaak.",
        "Animaties, interacties: een merk dat men onthoudt.",
        "Hosting, domeinnaam en updates: wij regelen alles.",
        "Handgeschreven code uit Brussel, snel op elk scherm."
      ],
      chips: ["Reserveren", "Menu", "Contact"],
      cards: [["FR \xB7 NL \xB7 EN", "Drie talen"], ["Hosting", "en domeinnaam inbegrepen"], ["24 u", "om u te antwoorden"]],
      yours: "de uwe"
    },
    en: {
      label: "Cliko trailer: GTA VI is here. We are too. Website creation, digital experiences, modern solutions, custom development. The future is digital.",
      prod: "A Cliko production \xB7 Brussels",
      play: "Play the trailer",
      hint: "Sound on \xB7 35 s",
      enter: "Go straight to the site",
      skip: "Skip intro",
      soundOn: "Sound on",
      soundOff: "Sound off",
      site: "Enter the site",
      quote: "Get a quote",
      replay: "Play the trailer",
      loc1: "Brussels \u2014 7:47 pm",
      loc2: "Live \xB7 cliko.be",
      services: [["Website", "creation"], ["Digital", "experiences"], ["Modern", "solutions"], ["Custom", "development"]],
      desc: [
        "Bespoke websites, designed around your business.",
        "Motion and interaction: a brand people remember.",
        "Hosting, domain and updates: we handle everything.",
        "Hand-written code from Brussels, fast on every screen."
      ],
      chips: ["Book", "Menu", "Contact"],
      cards: [["FR \xB7 NL \xB7 EN", "Three languages"], ["Hosting", "and domain included"], ["24 h", "to answer you"]],
      yours: "yours"
    }
  };
  var pickLang = (l) => {
    const k = String(l || "fr").slice(0, 2).toLowerCase();
    return STR[k] ? k : "fr";
  };

  // src/intro.js
  var KEY = "cliko-intro:v1";
  var smooth = (x) => x * x * (3 - 2 * x);
  var css = (el, k, v) => {
    const c = el.__c || (el.__c = {});
    if (c[k] !== v) {
      c[k] = v;
      el.style.setProperty(k, v);
    }
  };
  var op = (el, o) => css(el, "opacity", o <= 2e-3 ? "0" : o >= 0.998 ? "1" : o.toFixed(3));
  var fl = (el, px) => css(el, "filter", px > 0.25 ? `blur(${px.toFixed(1)}px)` : "none");
  var T3 = (x, y, s = 1, extra = "") => `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(4)})${extra}`;
  var tf = (el, x = 0, y = 0, s = 1, extra = "") => css(el, "transform", T3(x, y, s, extra));
  var tfc = (el, x = 0, y = 0, s = 1, extra = "") => css(el, "transform", "translate(-50%,-50%) " + T3(x, y, s, extra));
  var show = (el, on, d = "flex") => css(el, "display", on ? d : "none");
  var chroma = (el, amt, base = "") => {
    if (amt < 0.3) return css(el, "filter", base || "none");
    const a = amt.toFixed(1);
    css(el, "filter", `${base} drop-shadow(${a}px 0 0 rgba(255,40,140,.75)) drop-shadow(-${a}px 0 0 rgba(40,220,255,.6))`);
  };
  function neonOn(b, at) {
    const d = b - at;
    if (d < 0) return 0;
    const steps = [[0, 1], [0.05, 0], [0.11, 0.9], [0.15, 0], [0.27, 1], [0.31, 0.15], [0.37, 1]];
    let v = 0;
    for (const [s, k] of steps) if (d >= s) v = k;
    if (d > 1.6 && d < 1.66) v = 0.35;
    if (d > 3.1 && d < 3.14) v = 0.5;
    return v;
  }
  var SEG = [
    { from: -99, id: 0, sil: null },
    // bokeh
    { from: 8, id: 1, sil: "sunset" },
    // coucher de soleil
    { from: 12, id: 2, sil: null },
    // autoroute néon
    { from: 16, id: 3, sil: "city" },
    // skyline
    { from: 23, id: 5, sil: null },
    // noir / reveal
    { from: 36, id: 2, sil: null },
    // M1
    { from: 40, id: 4, sil: null },
    // M2
    { from: 44, id: 3, sil: "city" },
    // M3
    { from: 48, id: 1, sil: "sunset", dusk: 1 },
    // M4
    { from: 52, id: 1, sil: "sunset", fin: 1 }
    // signature
  ];
  var TRANS = [
    { at: 7.75, to: 8.1, seg: 1, type: 2 },
    { at: 11.7, to: 12.25, seg: 2, type: 1 },
    { at: 15.8, to: 16.2, seg: 3, type: 2 },
    { at: 35.6, to: 36.2, seg: 5, type: 1 },
    { at: 39.7, to: 40.2, seg: 6, type: 1 },
    { at: 43.7, to: 44.2, seg: 7, type: 1 },
    { at: 47.7, to: 48.2, seg: 8, type: 1 },
    { at: 51.6, to: 52.1, seg: 9, type: 2 }
  ];
  function params(si, b, ctx) {
    const s = SEG[si];
    switch (si) {
      case 0: {
        const streak = 0.22 * bell(b, 0.6, 4.2) + Math.pow(prog(b, 6, 7.95), 2) * 1.3 + (ctx.gate ? 0.12 : 0);
        const appear = ctx.gate ? 0.34 : b < 0 ? lerp(0, 0.34, ctx.preroll) : E.out(prog(b, -0.2, 6));
        return [appear, 1 + 0.2 * E.io(prog(b, 0, 8)), streak, 0];
      }
      case 1:
        if (s.fin) return [lerp(0.07, 0.025, E.io(prog(b, 52, 64))), lerp(1.2, 1, E.out(prog(b, 52, 62))), 0.24, 0];
        if (s.dusk) return [0.012, lerp(1.12, 1.04, prog(b, 48, 52)), 0.62, lerp(0.03, -0.03, prog(b, 48, 52))];
        return [0.05, lerp(1.32, 1, E.out(prog(b, 8, 11.9))), 0, lerp(-0.06, 0.04, prog(b, 8, 12))];
      case 2:
        return [2.4, lerp(1, 1.12, prog(b, 12, 16)), 1, 1];
      case 3:
        return [lerp(-0.04, 0.03, E.io(prog(b, 16, 23))), lerp(1.14, 1, E.out(prog(b, 16, 20))), lerp(0, 0.16, prog(b, 16, 23)), 1];
      case 4: {
        if (b < 24) return [0, 0, 0.5 * Math.pow(prog(b, 23, 24), 2), 0];
        const shrink = E.io(prog(b, 24, 26.1));
        const rays = lerp(1.1, 0.55, E.out(prog(b, 24, 27))) * (1 + 0.25 * hit(b, Math.floor(b), 0.5) * (b > 28 ? 1 : 0));
        return [lerp(0.6, 0, shrink), rays, lerp(1, 0.38, E.out(prog(b, 24, 28))), 1];
      }
      case 5:
        return [1, lerp(1, 1.08, prog(b, 36, 40)), 0.85, 0.72];
      case 6:
        return [1.7, 0.3, 0.95, 0];
      case 7:
        return [0.02, 1.04, lerp(0.3, 0.5, prog(b, 44, 48)), 0.85];
      default:
        return [0, 1, 0, 0];
    }
  }
  function createIntro(opts = {}) {
    const lang = pickLang(opts.lang || document.documentElement.lang);
    const L = STR[lang];
    const renderMode = !!opts.renderMode;
    const reduced = !renderMode && (opts.reducedMotion ?? matchMedia("(prefers-reduced-motion: reduce)").matches);
    const host = document.createElement("div");
    host.setAttribute("data-cliko-intro", "");
    host.style.cssText = "position:fixed;inset:0;z-index:2147483647;";
    const root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    root.innerHTML = `<style>${CSS}</style>${buildMarkup(L)}`;
    const $ = (s, el2 = root) => el2.querySelector(s);
    const $$ = (s, el2 = root) => [...el2.querySelectorAll(s)];
    const ck = $(".ck");
    const glc = $("canvas.gl"), silc = $("canvas.sil");
    const stage = $(".stage");
    const sc = {
      s1: $(".s1"),
      s2a: $(".s2a"),
      s2b: $(".s2b"),
      s2c: $(".s2c"),
      s3: $(".s3"),
      s4: $(".s4"),
      s5: $(".s5")
    };
    const el = {
      s1w: $(".s1w"),
      s1words: $$(".s1l .w"),
      s1l: $(".s1l"),
      flare: $(".flare"),
      gta: $(".s2a .gta"),
      vi: $(".s2a .vi"),
      s2row: $(".s2a .row"),
      s2aa: $(".s2a .a"),
      is: $(".s2b .is"),
      here: $(".s2b .here"),
      s2brow: $(".s2b .row"),
      s2c: $(".s2c .a"),
      k: $(".s2c .k"),
      l1: $(".s2c .l1"),
      l2: $(".s2c .l2"),
      l2w: $(".s2c .l2w"),
      loc: $(".loc"),
      lt: $(".loc .lt"),
      l3: $(".l3"),
      s3t: $(".s3t"),
      s3w: $$(".s3t .w"),
      ms: $$(".m"),
      vis: $$(".v"),
      pb: $$(".pb b"),
      pbw: $(".pb"),
      l5: $(".l5"),
      t5: $(".t5"),
      t5c: $$(".t5 .ch"),
      u5: $(".u5"),
      pk: $(".pk"),
      bars: $$(".bar"),
      grain: $(".grain"),
      fade: $(".fade"),
      cta: $(".cta"),
      gate: $(".gate"),
      play: $(".play"),
      enter: $(".enter"),
      snd: $(".snd"),
      sl: $(".snd .sl"),
      skip: $(".skip"),
      prog: $(".prog"),
      progb: $(".prog b"),
      sr: $(".sr")
    };
    const logoParts = (wrap) => ({
      svg: $("svg", wrap),
      paths: $$(".st path", wrap),
      dot: $(".dt", wrap),
      o: $(".o", wrap),
      spk: $(".spk", wrap)
    });
    const L3 = logoParts(el.l3), L5 = logoParts(el.l5);
    const mis = el.ms.map((m) => ({ m, lab: $(".ml", m), lines: $$(".ln>span", m), md: $(".md", m), car: $(".car", m) }));
    const v1 = { fr: $(".fr", el.vis[0]), tb: $(".tb", el.vis[0]), d: $$(".d", el.vis[0]), url: $(".url", el.vis[0]), hero: $(".hero", el.vis[0]), h1: $(".h1", el.vis[0]), h2: $(".h2", el.vis[0]), bt: $(".bt", el.vis[0]), cd: $$(".cd", el.vis[0]), cur: $(".cur", el.vis[0]), rip: $(".rip", el.vis[0]), bw: $(".bw", el.vis[0]) };
    const v2 = { ph: $(".ph", el.vis[1]), scr: $(".scr", el.vis[1]), chips: $$(".chip", el.vis[1]), rings: $$(".ring", el.vis[1]) };
    const v3 = { cards: $$(".cd3", el.vis[2]) };
    const v4 = { cw: $(".cw", el.vis[3]), lines: $$(".cl>span>span", el.vis[3]), car: $(".ccar", el.vis[3]), scan: $(".scan", el.vis[3]), tag: $(".tag", el.vis[3]), code: $(".code", el.vis[3]) };
    const CL = codeLens(L);
    const CLsum = CL.reduce((a, b) => a + b, 0);
    let W = 0, H = 0, u = 10, portrait = false, bh0 = 0, dpr = 1, glScale = 1;
    const meas = {};
    let gl = null, sil = null;
    function measure() {
      W = ck.clientWidth || innerWidth;
      H = ck.clientHeight || innerHeight;
      portrait = W / H < 0.82;
      u = portrait ? Math.min(W * 0.0116, H * 98e-4) : Math.min(W * 0.01, H * 0.0178);
      bh0 = !portrait && W / H > 1.25 ? Math.max(0, Math.round((H - W / 2.39) / 2)) : 0;
      ck.classList.toggle("pt", portrait);
      css(ck, "--u", u.toFixed(2) + "px");
      dpr = renderMode ? 1 : Math.min(devicePixelRatio || 1, 2);
      const budget = renderMode ? opts.glPixels || 1e9 : W * H > 9e5 && !portrait ? 135e4 : 62e4;
      const sc0 = Math.min(dpr, Math.sqrt(budget / (W * H))) * glScale;
      glc.width = Math.max(2, Math.round(W * sc0));
      glc.height = Math.max(2, Math.round(H * sc0));
      silc.width = Math.round(W * dpr);
      silc.height = Math.round(H * dpr);
      meas.s2 = meas.s2b = meas.s3 = null;
      meas.len = [L3, L5].map((P) => P.paths.map((p) => p.getTotalLength?.() || 100));
      for (const P of [L3, L5]) P.paths.forEach((p) => css(p, "stroke-dasharray", "1 2"));
    }
    function lazyMeasure(key) {
      if (meas[key]) return;
      if (key === "s2" && el.s2row.offsetWidth) {
        const r = el.s2row;
        meas.s2 = [r.offsetWidth / 2 - (el.gta.offsetLeft + el.gta.offsetWidth / 2), r.offsetHeight / 2 - (el.gta.offsetTop + el.gta.offsetHeight / 2)];
      } else if (key === "s2b" && el.s2brow.offsetWidth) {
        const r = el.s2brow;
        meas.s2b = [r.offsetWidth / 2 - (el.is.offsetLeft + el.is.offsetWidth / 2), r.offsetHeight / 2 - (el.is.offsetTop + el.is.offsetHeight / 2)];
      } else if (key === "s3" && el.s3t.offsetWidth) {
        const rw = el.s3t.offsetWidth;
        meas.s3 = [0, ...el.s3w.map((w) => (rw - (w.offsetLeft + w.offsetWidth)) / 2)];
      }
    }
    const STROKES = [[25, 25.9], [25.6, 26.15], [26, 26.45], [26.6, 27], [27, 27.35], [27.2, 27.6]];
    function drawLogo(P, b, mode, idx) {
      let head = null;
      P.paths.forEach((p, i) => {
        let k = 1;
        if (mode === "reveal") k = E.io(prog(b, STROKES[i][0], STROKES[i][1]));
        css(p, "stroke-dashoffset", (1 - k).toFixed(4));
        op(p, k > 2e-3 ? 1 : 0);
        if (mode === "reveal" && k > 0.01 && k < 0.99) head = [p, k, meas.len[idx][i]];
      });
      if (head) {
        const pt = head[0].getPointAtLength(head[1] * head[2]);
        P.spk.setAttribute("cx", pt.x.toFixed(1));
        P.spk.setAttribute("cy", pt.y.toFixed(1));
        P.spk.setAttribute("r", (11 + 4 * Math.sin(b * 40)).toFixed(1));
        op(P.spk, 1);
      } else op(P.spk, 0);
      const dk = mode === "reveal" ? E.back(prog(b, 26.5, 26.85)) : 1;
      css(P.dot, "transform", `scale(${Math.max(0, dk).toFixed(3)})`);
      css(P.dot, "transform-origin", "179px 16px");
      const ok = mode === "reveal" ? prog(b, 25.5, 26.15) : 1;
      op(P.o, ok);
      const os = mode === "reveal" ? lerp(1.3, 1, E.out(prog(b, 25.5, 26.7))) : 1;
      css(P.o, "transform", `scale(${os.toFixed(3)})`);
      css(P.o, "transform-origin", "400px 96px");
    }
    const logoGlow = (w, g, pinkness = 1) => {
      const a = (0.35 * g * u).toFixed(1), c = (1.5 * g * u).toFixed(1), d = (0.9 * g * u).toFixed(1);
      return `drop-shadow(0 0 ${a}px rgba(255,${Math.round(lerp(220, 111, pinkness))},${Math.round(lerp(235, 181, pinkness))},.95)) drop-shadow(0 0 ${c}px rgba(255,46,136,${(0.7 * pinkness + 0.25).toFixed(2)})) drop-shadow(0 0 ${d}px rgba(255,170,80,.35))`;
    };
    function sceneState(t, b, ctx) {
      let si = 0;
      for (let i = 0; i < SEG.length; i++) if (b >= SEG[i].from) si = i;
      let tr = null;
      for (const x of TRANS) if (b >= x.at && b < x.to) tr = x;
      const st = { a: SEG[si].id, b: SEG[si].id, mix: 0, tr: 0, pa: params(si, b, ctx), pb: [0, 0, 0, 0], sa: si, sb: si };
      if (tr) {
        const A = tr.seg - 1, B = tr.seg;
        st.sa = A;
        st.sb = B;
        st.a = SEG[A].id;
        st.b = SEG[B].id;
        st.pa = params(A, b, ctx);
        st.pb = params(B, b, ctx);
        st.mix = prog(b, tr.at, tr.to);
        st.tr = tr.type;
      }
      return st;
    }
    function silCam(segIdx, P, role, st) {
      const s = SEG[segIdx];
      if (!s.sil) return null;
      const asp = W / H;
      let zoom = 1, panX = 0, offY = 0, offX = 0, alpha = 1;
      if (s.id === 1) {
        zoom = P[1];
        panX = P[3];
      } else if (s.id === 3) {
        zoom = P[1];
        panX = -P[2] * zoom * 0.25;
        offY = -P[0] * zoom;
      }
      if (st.mix > 0 && st.mix < 1) {
        const m = st.mix;
        if (st.tr === 1) {
          const e = smooth(m);
          offX = role === "a" ? e * asp : e * asp - asp;
        } else if (st.tr === 2) {
          zoom *= role === "a" ? 1 / (1 - 0.65 * m) : 1 / (1 + 0.9 * (1 - m));
          const k = smooth(clamp((m - 0.35) / 0.3));
          alpha = role === "a" ? 1 - k : k;
        } else alpha = role === "a" ? 1 - m : m;
      }
      return { layout: s.sil, zoom, panX, offX, offY, alpha, fg: 1.35, birds: s.fin ? 1 : 0, small: s.fin ? 0.82 : s.dusk ? 0.9 : 1, color: s.dusk ? "#06020a" : "#0a0410" };
    }
    const R = { gate: false, preroll: 0, exitK: 0, exitFly: null };
    function render(t) {
      const b = t / BEAT;
      const ctx = { gate: R.gate, preroll: R.preroll };
      const st = sceneState(t, b, ctx);
      const shk = 0.011 * hit(b, 8, 0.5) + 8e-3 * hit(b, 9, 0.45) + 0.018 * hit(b, 24, 0.7) + 5e-3 * (hit(b, 28, 0.4) + hit(b, 29, 0.4) + hit(b, 30, 0.4)) + 7e-3 * hit(b, 52, 0.6) + 4e-3 * hit(b, 64, 0.6);
      const sx = shk * Math.sin(t * 93), sy = shk * Math.cos(t * 71);
      const flash = 0.55 * hit(b, 8, 0.45) + 0.2 * hit(b, 9, 0.35) + 1 * hit(b, 24, 0.8) + 0.12 * (hit(b, 28, 0.3) + hit(b, 29, 0.3) + hit(b, 30, 0.3)) + 0.5 * hit(b, 52, 0.6) + 0.25 * hit(b, 64, 0.6);
      let leak = 0.3;
      if (b < 8) leak = 0.28 * prog(b, 1, 7);
      else if (b < 23) leak = 0.45;
      else if (b < 24) leak = 0;
      else if (b < 36) leak = 0.32 + 0.3 * hit(b, 24, 1.5);
      else if (b < 52) leak = 0.22;
      else leak = 0.55;
      const exposure = R.gate ? 0.85 : b < 0 ? lerp(0.85, 0.2, R.preroll) : 1;
      const night = R.exitK > 0 ? E.io(prog(R.exitK, 0, 0.6)) : 0;
      if (gl) {
        gl.draw({
          time: t + 40,
          a: st.a,
          b: st.b,
          mix: st.mix,
          tr: st.tr,
          pa: st.pa,
          pb: st.pb,
          fx: [flash, leak, 0.62, exposure],
          fx2: [night, 0.035, sx, sy],
          cen: oCenter(b)
        });
      }
      if (sil) {
        const cams = [silCam(st.sa, st.pa, "a", st), st.sb !== st.sa ? silCam(st.sb, st.pb, "b", st) : null];
        if (cams[0] || cams[1]) {
          for (const c of cams) if (c) c.alpha *= 1 - night;
          sil.draw(t, cams);
          R.silDirty = true;
        } else if (R.silDirty) {
          sil.clear();
          R.silDirty = false;
        }
      }
      css(stage, "transform", `translate3d(${(-sx * H).toFixed(1)}px,${(sy * H).toFixed(1)}px,0)`);
      const bh = Math.round(bh0 * (1 - E.io(prog(b, 52, 54.5))));
      css(ck, "--bh", bh + "px");
      css(ck, "--ub", Math.max(14, Math.round(bh / 2 - 22)) + "px");
      css(el.grain, "transform", `translate3d(${Math.round(hash(Math.floor(t * 24)) * 60 - 30)}px,${Math.round(hash(Math.floor(t * 24) + 7) * 60 - 30)}px,0)`);
      if (R.gate) {
        for (const k in sc) show(sc[k], false);
        show(el.loc, false);
        return;
      }
      renderS1(b);
      renderS2(b);
      renderS3(b);
      renderS4(b);
      renderS5(b);
      if (!renderMode) {
        css(el.progb, "transform", `scaleX(${clamp(t / (64 * BEAT)).toFixed(4)})`);
      }
    }
    function oCenter(b) {
      const lwW = (portrait ? 66 : 54) * u, lwH = lwW * 148 / 480;
      const ly = logoY3(b);
      const x = (400 / 480 - 0.5) * lwW, y = (96 / 148 - 0.5) * lwH + ly;
      const k = E.io(prog(b, 24.4, 26));
      return [lerp(0, x / H, k), lerp(0.03, -y / H, k)];
    }
    const logoY3 = (b) => lerp(0, -(portrait ? 8 : 5.6) * u, E.io(prog(b, 27.6, 28.4)));
    function renderS1(b) {
      const on = b < 8.1;
      show(sc.s1, on);
      if (!on) return;
      const at = [2, 2.75, 3.75, 4.5];
      el.s1words.forEach((w, i) => {
        const k = E.out(prog(b, at[i] - 0.15, at[i] + 0.95));
        op(w, k);
        tf(w, 0, (1 - k) * u * 1.4, 1 + (1 - k) * 0.08);
        fl(w, (1 - k) * 16);
      });
      const push = 1 + 0.07 * prog(b, 2, 7.2) + 0.9 * E.inExpo(prog(b, 7.1, 8.05));
      tfc(el.s1w, 0, 0, push);
      css(el.s1l, "letter-spacing", lerp(0.3, 0.05, E.out(prog(b, 1.6, 7))).toFixed(3) + "em");
      op(el.s1w, 1 - prog(b, 7.7, 8.05));
      chroma(el.s1w, (prog(b, 5.8, 8) * 1.2 + hit(b, 4.5, 0.4) * 0.5) * u * 0.6);
      const fk = E.out(prog(b, 0.7, 2.8));
      css(el.flare, "transform", `scaleX(${(fk * (1 + 0.25 * hit(b, 4.5, 0.6))).toFixed(3)})`);
      op(el.flare, fk * (1 - prog(b, 6.8, 7.8)) * (0.75 + 0.25 * Math.sin(b * 3)));
    }
    const slam = (w, b, at, from = 2.6, blurMax = 20) => {
      const k = E.expo(prog(b, at, at + 0.42));
      op(w, b < at ? 0 : clamp(k * 3));
      fl(w, b < at ? 0 : (1 - k) * blurMax);
      return { k, s: lerp(from, 1, k) };
    };
    function renderS2(b) {
      const onA = b >= 7.9 && b < 12.3;
      show(sc.s2a, onA);
      if (onA) {
        lazyMeasure("s2");
        const g = slam(el.gta, b, 8), v = slam(el.vi, b, 9);
        const join = E.expo(prog(b, 9, 9.4));
        const m2 = meas.s2 || [0, 0];
        tf(el.gta, m2[0] * (1 - join), m2[1] * (1 - join), g.s);
        tf(el.vi, 0, 0, v.s);
        const drift = 1 + 0.05 * prog(b, 8, 11.7);
        const out = E.inExpo(prog(b, 11.55, 12.2));
        tfc(el.s2aa, -smooth(prog(b, 11.7, 12.25)) * W * 0.35, 0, drift * (1 + 2.6 * out));
        op(el.s2aa, 1 - prog(b, 11.85, 12.2));
        chroma(el.s2row, (hit(b, 8, 0.7) + hit(b, 9, 0.7) + 1.4 * out) * u * 0.7, "drop-shadow(0 0 " + (1.4 * u).toFixed(1) + "px rgba(255,61,139,.5))");
        const sh = prog(b, 10, 11.4);
        for (const w of [el.gta, el.vi]) css(w.lastChild, "background-position", lerp(130, -30, sh).toFixed(1) + "% 0");
      }
      const onB = b >= 12.15 && b < 16.25;
      show(sc.s2b, onB);
      if (onB) {
        const a1 = neonOn(b, 12.5), a2 = neonOn(b, 13);
        op(el.is.lastChild, a1);
        op(el.here.lastChild, a2);
        lazyMeasure("s2b");
        const join = E.expo(prog(b, 13, 13.35));
        const m2 = meas.s2b || [0, 0];
        tf(el.is, m2[0] * (1 - join), m2[1] * (1 - join), 1);
        op(el.here.firstChild, prog(b, 12.6, 13));
        op(el.is.firstChild, prog(b, 12.2, 12.5));
        const out = E.inExpo(prog(b, 15.6, 16.2));
        tfc(el.s2brow.parentNode, 0, 0, (1 + 0.05 * prog(b, 12.3, 15.8)) * (1 + 3 * out));
        op(el.s2brow.parentNode, 1 - prog(b, 15.95, 16.2));
      }
      const onC = b >= 16 && b < 23;
      show(sc.s2c, onC);
      if (onC) {
        const kk = E.out(prog(b, 16.3, 17.2));
        op(el.k, kk);
        css(el.k, "letter-spacing", lerp(0.8, 0.42, kk).toFixed(3) + "em");
        const k1 = E.reveal(prog(b, 16.05, 16.9));
        tf(el.l1, 0, (1 - k1) * u * 6, lerp(0.86, 1, k1));
        op(el.l1, k1);
        fl(el.l1, (1 - k1) * 14);
        op(el.l2w.lastChild, neonOn(b, 16.6));
        op(el.l2w.firstChild, prog(b, 16.3, 16.6));
        const sh = (prog(b, 18, 19.4) + prog(b, 20, 21.4)) % 1.0001;
        css(el.l1.querySelector(".shine"), "background-position", lerp(130, -30, sh).toFixed(1) + "% 0");
        const stut = hit(b, 22, 0.25) + hit(b, 22.25, 0.25) + hit(b, 22.5, 0.25) + hit(b, 22.75, 0.25);
        tfc(el.s2c, 0, 0, (1 + 0.06 * prog(b, 16, 22)) * (1 + 0.045 * stut));
        chroma(el.l1, stut * u * 0.8, "drop-shadow(0 0 " + (1.4 * u).toFixed(1) + "px rgba(255,61,139,.5))");
      }
      const onL = b >= 8.4 && b < 23;
      show(el.loc, onL);
      if (onL) {
        const txt = b < 15.8 ? L.loc1 : L.loc2;
        const st = b < 15.8 ? 8.6 : 16.6;
        const n = Math.floor(clamp((b - st) / 1.1) * txt.length);
        if (el.lt.__t !== n + txt) {
          el.lt.__t = n + txt;
          el.lt.textContent = txt.slice(0, n);
        }
        op(el.loc, (1 - prog(b, 15.2, 15.8)) * prog(b, 8.4, 8.8) + prog(b, 16.3, 16.6) * (1 - prog(b, 22.6, 23)));
        op(el.loc.firstChild, Math.floor(b * 2) % 2 ? 1 : 0.25);
      }
    }
    function renderS3(b) {
      const on = b >= 24 && b < 36.3;
      show(sc.s3, on);
      if (!on) return;
      drawLogo(L3, b, "reveal", 0);
      const ly = logoY3(b);
      const push = 1 + 0.05 * prog(b, 28, 35.6);
      const wh = smooth(prog(b, 35.6, 36.2));
      const wx = -wh * W;
      tfc(el.l3, wx, ly, push);
      const g = 1 + 0.9 * hit(b, 27.65, 1.2) + 0.25 * (b > 28 ? hit(b, Math.floor(b), 0.5) : 0) + 0.6 * prog(b, 24.8, 25.6) * (1 - prog(b, 27.6, 28.5));
      const pink = 1 - 0.55 * prog(b, 27.6, 28.6);
      css(el.l3, "filter", logoGlow(el.l3, g, pink) + (wh > 0.02 ? ` blur(${(Math.sin(wh * Math.PI) * 14).toFixed(1)}px)` : ""));
      const ty = (portrait ? 13 : 9.6) * u;
      let cx = 0;
      lazyMeasure("s3");
      if (meas.s3) {
        cx = meas.s3[1];
        [29, 30].forEach((at, i) => cx = lerp(cx, meas.s3[i + 2], E.expo(prog(b, at, at + 0.4))));
      }
      tfc(el.s3t, wx + cx, ty, push);
      [28, 29, 30].forEach((at, i) => {
        const s = slam(el.s3w[i], b, at, 1.7, 12);
        tf(el.s3w[i], 0, 0, s.s);
      });
      chroma(el.s3t, (hit(b, 28, 0.5) + hit(b, 29, 0.5) + hit(b, 30, 0.5)) * u * 0.6 + Math.sin(wh * Math.PI) * u, "drop-shadow(0 0 " + (1.4 * u).toFixed(1) + "px rgba(255,61,139,.5))");
    }
    function renderS4(b) {
      const on = b >= 35.6 && b < 52.15;
      show(sc.s4, on);
      if (!on) return;
      const zoomOut = prog(b, 51.6, 52.1);
      for (let i = 0; i < 4; i++) {
        const s0 = 36 + 4 * i;
        const M = mis[i], V = el.vis[i];
        const active = b >= s0 - 0.45 && b < s0 + 4.25;
        show(M.m, active, "block");
        show(V, active, "block");
        if (!active) continue;
        const ein = 1 - smooth(prog(b, s0 - 0.4, s0 + 0.2));
        const eout = i < 3 ? smooth(prog(b, s0 + 3.7, s0 + 4.2)) : 0;
        const x = (ein - eout) * W;
        const zs = 1 + 1.6 * E.inExpo(zoomOut);
        const zo = 1 - prog(b, 51.75, 52.1);
        css(M.m, "transform", (portrait ? "" : "translateY(-50%) ") + T3(x, 0, zs));
        op(M.m, zo);
        op(V, zo);
        const vb = Math.sin(Math.PI * Math.max(ein, eout)) * 10;
        fl(M.m, vb);
        const kl = E.out(prog(b, s0 + 0.05, s0 + 0.6));
        op(M.lab, kl);
        tf(M.lab, (1 - kl) * -u * 3, 0);
        M.lines.forEach((ln, j) => {
          if (i === 0) {
            const k = E.reveal(prog(b, s0 + 0.15 + j * 0.22, s0 + 1 + j * 0.22));
            tf(ln, 0, (1 - k) * ln.offsetHeight * 1.1);
            op(ln, 1);
          } else if (i === 1) {
            const k = prog(b, s0 + j * 0.2, s0 + 1.1 + j * 0.2);
            const q = Math.floor(b * 8 + j * 3);
            const jit = (1 - k) * (k > 0 ? 1 : 0);
            const jx = (hash(q) - 0.5) * u * 3 * jit, sk = (hash(q + 9) - 0.5) * 24 * jit;
            op(ln, k <= 0 ? 0 : hash(q + 4) < 0.25 * jit ? 0.2 : 1);
            tf(ln, jx, 0, 1, ` skewX(${sk.toFixed(1)}deg)`);
            chroma(ln, jit * u * 1.4 + hit(b, s0 + 1 + j, 0.3) * u * 0.6, j === 1 ? `drop-shadow(0 0 ${(0.9 * u).toFixed(1)}px rgba(255,61,139,.35))` : "");
          } else if (i === 2) {
            const k = E.out(prog(b, s0 + 0.2 + j * 0.25, s0 + 1.1 + j * 0.25));
            op(ln, k > 0 ? 1 : 0);
            css(ln, "transform", `rotateX(${((1 - k) * -100).toFixed(1)}deg) translateZ(0)`);
          } else {
            const len = ln.textContent.length;
            const kRaw = prog(b, s0 + 0.15 + j * 0.65, s0 + 0.75 + j * 0.65);
            const k = Math.floor(kRaw * len) / len;
            css(ln, "clip-path", `inset(-10% ${((1 - k) * 100).toFixed(1)}% -20% 0)`);
            op(ln, 1);
            if (j === 0 && kRaw < 1 || j === 1 && kRaw > 0 || j === 1 && kRaw >= 1) {
              if (M.car) {
                const lx = ln.offsetLeft + ln.offsetWidth * k;
                const lyy = ln.parentNode.offsetTop;
                css(M.car, "left", lx.toFixed(1) + "px");
                css(M.car, "top", lyy.toFixed(1) + "px");
                css(M.car, "height", ln.offsetHeight + "px");
                op(M.car, j === 1 && kRaw >= 1 ? Math.floor(b * 2) % 2 ? 1 : 0 : 1);
              }
            }
          }
        });
        const kd = E.out(prog(b, s0 + 1.1, s0 + 1.9));
        op(M.md, kd);
        tf(M.md, 0, (1 - kd) * u * 1.5);
        renderVis(i, b, s0, x * (portrait ? 1 : 1.15), zs, vb);
      }
      op(el.pbw, prog(b, 36, 36.6) * (1 - prog(b, 51.4, 51.9)));
      el.pb.forEach((p, j) => css(p, "transform", `scaleX(${clamp(prog(b, 36 + 4 * j, 40 + 4 * j)).toFixed(3)})`));
    }
    function renderVis(i, b, s0, vx = 0, vz = 1, vblur = 0) {
      const V = el.vis[i];
      const base = `translate(-50%,-50%) translate3d(${vx.toFixed(1)}px,0,0) scale(${vz.toFixed(4)}) `;
      if (i !== 1) fl(V, vblur);
      if (i === 0) {
        const rot = lerp(-24, -10, E.out(prog(b, s0, s0 + 4)));
        css(v1.bw, "transform", `rotateY(${rot.toFixed(2)}deg) rotateX(${lerp(14, 7, prog(b, s0, s0 + 4)).toFixed(2)}deg)`);
        css(V, "transform", base + T3(0, 0, lerp(0.92, 1, E.out(prog(b, s0, s0 + 1.5)))));
        css(v1.fr, "stroke-dashoffset", (1 - E.io(prog(b, s0, s0 + 0.8))).toFixed(4));
        css(v1.tb, "stroke-dashoffset", (1 - E.io(prog(b, s0 + 0.5, s0 + 0.8))).toFixed(4));
        op($(".bg", V), prog(b, s0 + 0.3, s0 + 0.9));
        v1.d.forEach((d, j) => {
          const k = E.back(prog(b, s0 + 0.8 + j * 0.1, s0 + 1.05 + j * 0.1));
          tf(d, 0, 0, Math.max(0, k));
        });
        const ku = E.out(prog(b, s0 + 0.9, s0 + 1.3));
        css(v1.url, "transform", `scaleX(${ku.toFixed(3)})`);
        const kh = E.out(prog(b, s0 + 1.25, s0 + 1.6));
        css(v1.hero, "transform", `scaleY(${kh.toFixed(3)})`);
        op(v1.hero, kh > 0 ? 1 : 0);
        css(v1.h1, "transform", `scaleX(${E.out(prog(b, s0 + 1.5, s0 + 1.85)).toFixed(3)})`);
        css(v1.h2, "transform", `scaleX(${E.out(prog(b, s0 + 1.6, s0 + 1.95)).toFixed(3)})`);
        const kb = E.back(prog(b, s0 + 2, s0 + 2.3));
        tf(v1.bt, 0, 0, Math.max(0, kb));
        const click = hit(b, s0 + 3.5, 0.5);
        css(v1.bt, "background", click > 0.05 ? "#ffc46b" : "#0b1020");
        v1.cd.forEach((c, j) => {
          const k = E.back(prog(b, s0 + 2.5 + j * 0.25, s0 + 2.85 + j * 0.25));
          op(c, clamp(k * 2));
          tf(c, 0, (1 - clamp(k)) * u * 3, lerp(0.85, 1, clamp(k)));
        });
        const kc = E.io(prog(b, s0 + 2.3, s0 + 3.4));
        const bw = v1.bw.offsetWidth, bhh = v1.bw.offsetHeight;
        const cx = lerp(bw * 0.92, bw * 0.2, kc), cy = lerp(bhh * 1.05, bhh * 0.47, kc);
        op(v1.cur, prog(b, s0 + 2.2, s0 + 2.5));
        tf(v1.cur, cx, cy, 1 - 0.15 * hit(b, s0 + 3.5, 0.3));
        const kr = prog(b, s0 + 3.5, s0 + 4.1);
        op(v1.rip, kr > 0 ? 1 - kr : 0);
        tf(v1.rip, 0, 0, 0.2 + kr * 2.6);
      } else if (i === 1) {
        const k = E.out(prog(b, s0, s0 + 1.2));
        const q = Math.floor(b * 8);
        const g = (1 - prog(b, s0, s0 + 0.8)) * (b >= s0 ? 1 : 0);
        css(V, "transform", base + T3((hash(q) - 0.5) * u * 2.5 * g, 0, lerp(0.9, 1, k)));
        css(v2.ph, "transform", `rotateY(${lerp(38, -10, k).toFixed(1)}deg) rotateZ(${lerp(-8, 4, k).toFixed(1)}deg)`);
        chroma(v2.ph, g * u * 1.6);
        css(v2.scr, "background-position", `0 ${(50 + 50 * Math.sin(b * 0.9)).toFixed(1)}%`);
        v2.chips.forEach((c, j) => {
          const kc = E.back(prog(b, s0 + 1 + j, s0 + 1.35 + j));
          op(c, clamp(kc * 3));
          tf(c, 0, (1 - clamp(kc)) * u * 2, lerp(0.6, 1, kc));
        });
        v2.rings.forEach((r, j) => {
          const kr = prog(b, s0 + 1 + j, s0 + 1.9 + j);
          const ph = v2.ph;
          const ox = ph.offsetLeft + ph.offsetWidth * 0.5, oy = ph.offsetTop + ph.offsetHeight * (0.53 + j * 0.12);
          css(r, "left", ox.toFixed(0) + "px");
          css(r, "top", oy.toFixed(0) + "px");
          op(r, kr > 0 && kr < 1 ? 1 - kr : 0);
          tf(r, 0, 0, 0.2 + kr * 2.4);
        });
      } else if (i === 2) {
        css(V, "transform", base + T3(0, Math.sin(b * 0.8) * u * 0.4, 1));
        const spread = portrait ? 22 : 16.5;
        v3.cards.forEach((c, j) => {
          const k = E.back(prog(b, s0 + 0.5 + j * 0.5, s0 + 1.1 + j * 0.5));
          const kk = clamp(k);
          const fx = (j - 1) * spread * u * kk;
          const ry = lerp(110, (j - 1) * -16, k);
          const fy = Math.sin(b * 1.1 + j * 1.7) * u * 0.5 * kk;
          css(c, "transform", `translate3d(${fx.toFixed(1)}px,${(fy + (j === 1 ? -u * 1.2 : 0)).toFixed(1)}px,${(j === 1 ? u * 4 : 0).toFixed(1)}px) rotateY(${ry.toFixed(1)}deg)`);
          op(c, clamp(k * 2));
        });
      } else {
        const k = E.out(prog(b, s0, s0 + 0.6));
        css(V, "transform", base + T3(0, (1 - k) * u * 3, lerp(0.94, 1, k)));
        css(v4.cw, "transform", `rotateX(${lerp(22, 6, k).toFixed(1)}deg) rotateY(${lerp(-14, -6, prog(b, s0, s0 + 4)).toFixed(1)}deg)`);
        op(V, k);
        const n = Math.floor(prog(b, s0 + 0.3, s0 + 2.95) * CLsum);
        let acc = 0, curLine = 0;
        v4.lines.forEach((ln, j) => {
          const vis = clamp(n - acc, 0, CL[j]);
          css(ln, "width", vis + "ch");
          if (n >= acc) curLine = j;
          acc += CL[j];
        });
        const lnEl = v4.lines[curLine];
        if (lnEl) {
          css(v4.car, "left", (lnEl.offsetLeft + lnEl.offsetWidth).toFixed(0) + "px");
          css(v4.car, "top", (lnEl.parentNode.offsetTop + lnEl.offsetTop + 2).toFixed(0) + "px");
          op(v4.car, n >= CLsum ? Math.floor(b * 2) % 2 ? 1 : 0 : 1);
        }
        op(v4.tag, neonOn(b, s0 + 0.6));
        tf(v4.tag, 0, 0, 1 + 0.08 * hit(b, Math.floor(b), 0.4));
        const ks = prog(b, s0 + 3, s0 + 3.7);
        op(v4.scan, ks > 0 && ks < 1 ? 1 : 0);
        tf(v4.scan, 0, ks * v4.code.offsetHeight);
      }
    }
    function renderS5(b) {
      const on = b >= 51.8;
      show(sc.s5, on);
      if (!on) return;
      const m = prog(b, 51.6, 52.1);
      const enter = 1 / (1 + 0.9 * (1 - smooth(m)));
      const vis = smooth(clamp((m - 0.35) / 0.3));
      const push = 1 + 0.035 * prog(b, 56, 70);
      const P = portrait ? { lg: -25, t5: 1, u5: 17, cta: R.poster ? 39 : 34, pk: -42 } : { lg: -13, t5: 3.6, u5: 10.4, cta: 16.8, pk: -23.5 };
      drawLogo(L5, b, "full", 1);
      const kl = E.out(prog(b, 52, 54.5));
      const g = 0.75 + 0.5 * hit(b, 52, 1.5) + 0.15 * (b > 52 && b < 64 ? hit(b, Math.floor(b), 0.5) : 0) - 0.35 * R.exitK;
      tfc(el.l5, 0, P.lg * u * push, enter * lerp(0.9, 1, kl) * push);
      op(el.l5, vis);
      css(el.l5, "filter", logoGlow(el.l5, Math.max(0, g), 0.55) + (kl < 0.95 ? ` blur(${((1 - E.out(prog(b, 52, 53))) * 10).toFixed(1)}px)` : ""));
      tfc(el.t5, 0, P.t5 * u * push, enter * push);
      op(el.t5, vis);
      el.t5c.forEach((c, j) => {
        const k = E.out(prog(b, 54 + j * 0.07, 54.9 + j * 0.07));
        op(c, k);
        css(c, "transform", `translate3d(0,${((1 - k) * 0.5).toFixed(3)}em,0) rotateX(${((1 - k) * -70).toFixed(1)}deg)`);
      });
      const ku = E.out(prog(b, 56, 57.2));
      tfc(el.u5, 0, P.u5 * u * push, enter * push);
      op(el.u5, ku * vis);
      css(el.u5, "letter-spacing", lerp(0.7, 0.24, ku).toFixed(3) + "em");
      if (R.poster) {
        css(el.pk, "display", "block");
        tfc(el.pk, 0, P.pk * u, 1);
      }
      if (!renderMode) {
        const kc = R.poster ? 1 : E.out(prog(b, 58, 59.2));
        show(el.cta, kc > 1e-3, "flex");
        el.cta.hidden = false;
        css(el.cta, "transform", "translate(-50%,-50%) " + T3(0, P.cta * u + (1 - kc) * u * 2, 1));
        op(el.cta, kc * (1 - R.exitK * 3));
        css(el.cta, "pointer-events", kc > 0.5 ? "auto" : "none");
      }
    }
    let player = null;
    let raf = 0, clock = 0, lastNow = 0, running = false, paused = false;
    let sound = opts.sound !== false;
    let exiting = false;
    const perf = { acc: 0, n: 0, slow: 0 };
    function now() {
      return performance.now() / 1e3;
    }
    function currentTime() {
      if (player && !player.muted) {
        const at = player.time();
        if (Math.abs(at - clock) > 0.08) clock = at;
        else clock += (at - clock) * 0.2;
      }
      return clock;
    }
    function frame() {
      raf = requestAnimationFrame(frame);
      const n = now();
      let dt = n - lastNow;
      lastNow = n;
      if (dt > 0.1) dt = 0.1;
      if (paused) return;
      if (R.gate) {
        clock += dt * 0.35;
        render(clock);
        return;
      }
      if (R.prerollStart != null) {
        R.preroll = clamp((n - R.prerollStart) / 0.6);
        if (R.preroll >= 1) {
          R.prerollStart = null;
          clock = 0;
        } else {
          render(-0.6 + R.preroll * 0.6);
          return;
        }
      }
      clock += dt;
      const t = currentTime();
      perf.acc += dt;
      perf.n++;
      if (perf.n >= 45) {
        const avg = perf.acc / perf.n;
        if (avg > 0.026 && glScale > 0.45) {
          glScale *= 0.8;
          measure();
        }
        perf.acc = 0;
        perf.n = 0;
      }
      if (R.exitStart != null) {
        R.exitK = clamp((n - R.exitStart) / R.exitDur);
        renderExit(t);
        if (R.exitK >= 1) finish();
        return;
      }
      render(t);
      if (t > AUTO_EXIT && !opts.loop) exit("auto");
    }
    function renderExit(t) {
      render(t);
      const k = R.exitK;
      if (R.exitFly) {
        const f = R.exitFly, e = E.io(prog(k, 0.08, 0.82));
        const x = lerp(0, f.dx, e), y = lerp(0, f.dy, e), s = lerp(1, f.s, e);
        css(el.l5, "transform", `translate(-50%,-50%) translate3d(${(f.x0 + x).toFixed(1)}px,${(f.y0 + y).toFixed(1)}px,0) scale(${(f.s0 * s).toFixed(4)})`);
        css(el.l5, "filter", logoGlow(el.l5, lerp(0.7, 0, e), 0.55));
        op(el.l5, 1 - prog(k, 0.88, 1));
        for (const x2 of [el.t5, el.u5, el.cta, el.pk]) op(x2, 1 - prog(k, 0, 0.3));
      } else {
        op(stage, 1 - prog(k, 0, 0.45));
      }
      op(el.grain, 1 - k);
      for (const bar of el.bars) op(bar, 1 - prog(k, 0, 0.5));
      css(host, "opacity", (1 - prog(k, R.exitFly ? 0.72 : 0.55, 1)).toFixed(3));
    }
    const saved = { inert: [], overflow: "", focus: null };
    const stopEv = (e) => {
      e.stopPropagation();
      if (e.cancelable && e.type !== "keydown") e.preventDefault();
    };
    const onKey = (e) => {
      if (!host.isConnected) return;
      const k = e.key;
      if (k === "Escape") {
        e.preventDefault();
        exit("skip");
      } else if ((k === "Enter" || k === " ") && R.gate && !root.activeElement) {
        e.preventDefault();
        start(true);
      } else if (k === "m" || k === "M") toggleSound();
      else if ([" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(k) && !(root.activeElement && root.activeElement.tagName === "BUTTON" && (k === " " || k === "Enter"))) e.preventDefault();
    };
    function lockSite() {
      saved.focus = document.activeElement;
      saved.overflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      for (const c of document.body.children) {
        if (c === host || c.tagName === "SCRIPT" || c.tagName === "STYLE") continue;
        saved.inert.push([c, c.inert]);
        c.inert = true;
      }
      for (const t of ["wheel", "touchmove", "touchstart", "pointerdown", "mousedown"]) host.addEventListener(t, stopEv, { passive: false });
      addEventListener("keydown", onKey, true);
    }
    function unlockSite() {
      document.documentElement.style.overflow = saved.overflow;
      for (const [c, v] of saved.inert) c.inert = v;
      saved.inert = [];
      removeEventListener("keydown", onKey, true);
      try {
        saved.focus?.focus?.({ preventScroll: true });
      } catch {
      }
    }
    const onResize = () => {
      measure();
      if (R.poster) render(R.posterT);
    };
    const onVis = () => {
      if (!player) return;
      if (document.hidden) {
        paused = true;
        player.ctx.suspend?.();
      } else {
        player.ctx.resume?.();
        paused = false;
        lastNow = now();
      }
    };
    function setSoundUI() {
      el.snd.setAttribute("aria-pressed", String(sound));
      el.sl.textContent = sound ? L.soundOn : L.soundOff;
    }
    function toggleSound() {
      if (R.gate || exiting) return;
      sound = !sound;
      if (sound && !player) {
        try {
          player = new LivePlayer();
          player.start(Math.max(0, clock));
        } catch {
          player = null;
        }
      } else if (player) player.setMuted(!sound);
      setSoundUI();
    }
    function start(withSound) {
      if (!R.gate) return;
      R.gate = false;
      sound = withSound;
      el.gate.classList.add("off");
      setTimeout(() => el.gate.hidden = true, 600);
      for (const x of [el.snd, el.skip, el.prog]) x.hidden = false;
      setSoundUI();
      el.skip.focus({ preventScroll: true });
      el.sr.textContent = L.label;
      if (withSound) {
        try {
          player = new LivePlayer();
          player.ctx.resume?.();
          player.start(0, 0.6);
        } catch (e) {
          console.warn("[cliko-intro] audio indisponible", e);
          player = null;
        }
      }
      const at = Math.max(0, +opts.startAt || 0);
      if (at > 0) {
        clock = at;
        R.prerollStart = null;
        if (player) {
          player.close();
          player = new LivePlayer();
          player.start(at);
        }
        return;
      }
      R.prerollStart = now();
      R.preroll = 0;
    }
    function exit(reason = "skip", then) {
      if (exiting) return;
      exiting = true;
      markSeen();
      player?.fadeOut(0.9);
      const t = clock, b = t / BEAT;
      const target = [...document.querySelectorAll('svg[aria-label="Cliko"], [data-cliko-logo]')].find((n) => {
        const r = n.getBoundingClientRect();
        return r.width > 10 && r.top >= -2 && r.top < innerHeight / 2;
      });
      R.exitFly = null;
      if (target && b >= 54 && !R.gate) {
        const r = target.getBoundingClientRect();
        const lr = el.l5.getBoundingClientRect();
        const m = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px,0\) scale\(([-\d.]+)\)/.exec(el.l5.style.transform) || [0, 0, 0, 1];
        const x0 = +m[1], y0 = +m[2], s0 = +m[3];
        R.exitFly = { x0, y0, s0, dx: r.left + r.width / 2 - (lr.left + lr.width / 2), dy: r.top + r.height / 2 - (lr.top + lr.height / 2), s: r.width / lr.width };
      }
      R.exitDur = R.exitFly ? 1.25 : reason === "enter" ? 0.55 : 0.8;
      R.exitStart = now();
      R.then = then;
      if (R.gate) {
        el.gate.classList.add("off");
      }
      el.cta.style.pointerEvents = "none";
      if (R.poster || !running) {
        running = true;
        lastNow = now();
        raf = requestAnimationFrame(frame);
      }
    }
    function finish() {
      cancelAnimationFrame(raf);
      running = false;
      removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      host.remove();
      unlockSite();
      document.documentElement.classList.remove("ck-intro-pending");
      dispatchEvent(new CustomEvent("cliko-intro:exit"));
      opts.onExit?.();
      R.then?.();
    }
    function markSeen() {
      try {
        const store = opts.frequency === "once" ? localStorage : sessionStorage;
        store.setItem(KEY, String(Date.now()));
      } catch {
      }
    }
    const goContact = () => exit("quote", () => {
      const href = opts.contactHref || "#contact";
      const t = href.startsWith("#") ? document.querySelector(href) : null;
      if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
      else location.href = href;
    });
    function mount() {
      document.body.appendChild(host);
      document.documentElement.classList.remove("ck-intro-pending");
      try {
        gl = createGL(glc, renderMode);
      } catch {
        gl = null;
      }
      if (!gl) ck.classList.add("nogl");
      sil = createSilhouettes(silc);
      measure();
      addEventListener("resize", onResize);
      if (renderMode) {
        for (const x of [el.gate, el.snd, el.skip, el.prog, el.cta]) x.hidden = true;
        return api2;
      }
      lockSite();
      document.addEventListener("visibilitychange", onVis);
      el.play.addEventListener("click", () => start(true));
      el.enter.addEventListener("click", () => exit("enter"));
      el.skip.addEventListener("click", () => exit("skip"));
      el.snd.addEventListener("click", toggleSound);
      $(".go-site").addEventListener("click", () => exit("site"));
      $(".go-quote").addEventListener("click", goContact);
      if (reduced) {
        R.poster = true;
        R.posterT = 66 * BEAT;
        el.gate.hidden = true;
        el.cta.hidden = false;
        const replay = document.createElement("button");
        replay.className = "btn sec";
        replay.textContent = L.replay;
        replay.addEventListener("click", () => {
          R.poster = false;
          css(el.pk, "display", "none");
          replay.remove();
          R.gate = true;
          el.cta.hidden = true;
          start(true);
          running = true;
          lastNow = now();
          raf = requestAnimationFrame(frame);
        });
        el.cta.appendChild(replay);
        render(R.posterT);
        $(".go-site").focus({ preventScroll: true });
        return api2;
      }
      if (opts.autoplay === "muted") {
        R.gate = true;
        start(false);
      } else {
        R.gate = true;
        el.gate.hidden = false;
        el.play.focus({ preventScroll: true });
      }
      running = true;
      lastNow = now();
      raf = requestAnimationFrame(frame);
      return api2;
    }
    const api2 = {
      mount,
      exit,
      // rendu déterministe (vidéo / tests) : dessine exactement l'image du temps t
      seek(t) {
        R.gate = false;
        render(t);
      },
      gate() {
        R.gate = true;
        render(0);
      },
      host,
      get time() {
        return clock;
      }
    };
    return api2;
  }
  function shouldShow(opts = {}) {
    const q = location.search;
    if (/[?&]nointro\b/.test(q)) return false;
    if (/[?&]intro\b/.test(q) || opts.frequency === "always" || opts.force) return true;
    if (navigator.connection?.saveData) return false;
    if (/bot|crawl|spider|slurp/i.test(navigator.userAgent) && !opts.allowBots) return false;
    try {
      const store = opts.frequency === "once" ? localStorage : sessionStorage;
      return !store.getItem(KEY);
    } catch {
      return true;
    }
  }
  var current = null;
  function mountClikoIntro(opts = {}) {
    if (current?.host?.isConnected) return current;
    if (!opts.renderMode && !shouldShow(opts)) {
      document.documentElement.classList.remove("ck-intro-pending");
      return null;
    }
    current = createIntro(opts).mount();
    return current;
  }
  function play(opts = {}) {
    return mountClikoIntro({ ...opts, force: true });
  }

  // src/index.js
  var api = { mount: mountClikoIntro, play, shouldShow, createIntro, renderOffline, VIDEO_END, BEAT, version: "1.0.0" };
  window.ClikoIntro = api;
  var me = document.currentScript;
  if (me && me.hasAttribute("data-auto")) {
    const ds = me.dataset;
    const t = /[?&]t=([\d.]+)/.exec(location.search);
    const go = () => mountClikoIntro({ frequency: ds.frequency || "session", autoplay: ds.autoplay, contactHref: ds.contact, lang: ds.lang, startAt: t ? +t[1] : 0 });
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go, { once: true });
    else go();
  }
  var index_default = api;
})();
