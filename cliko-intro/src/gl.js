// Décors procéduraux en WebGL 1 (un seul shader plein écran, aucune texture) :
// 0 bokeh · 1 coucher de soleil sur l'océan · 2 autoroute néon · 3 skyline et reflets · 4 tunnel de lumière · 5 reveal (soleil + rayons)
const FRAG = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 R;
uniform float T;
uniform vec4 SA;   // x: plan A, y: plan B, z: mélange, w: type de transition (0 fondu, 1 whip, 2 traversée)
uniform vec4 PA;   // paramètres du plan A
uniform vec4 PB;   // paramètres du plan B
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

// 0 — Bokeh : lumières de ville hors mise au point
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

// 1 — Coucher de soleil sur l'océan
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

// 2 — Autoroute néon : sol quadrillé, soleil rayé, montagnes
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

// 3 — Skyline de nuit et reflets dans l'eau
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

// 4 — Tunnel de lumière numérique
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

// 5 — Reveal : soleil qui se contracte, rayons divins
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
}`;

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

export function createGL(canvas, preserve = false) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: preserve, powerPreference: "high-performance" });
  if (!gl) return null;
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
    return s;
  };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link");
  } catch (e) {
    console.warn("[cliko-intro] WebGL indisponible :", e);
    return null;
  }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  for (const n of ["R", "T", "SA", "PA", "PB", "FX", "FX2", "CEN"]) U[n] = gl.getUniformLocation(prog, n);

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
    lost: () => gl.isContextLost(),
  };
}
