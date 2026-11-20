var H=.5454545454545454,vt=n=>n*H;var Zt=vt(70),xt=vt(78),it=["Am","F","Am","F","C","G","Am","F","G","Am","F","C","G","Am","F","G","Am"],he=(n,r=0,p=1)=>n<r?r:n>p?p:n,C=(n,r,p)=>n+(r-n)*p,h=(n,r,p)=>he((n-r)/(p-r)),bt=(n,r,p)=>{let M=h(n,r,p);return Math.sin(M*Math.PI)};function at(n,r,p,M){let L=3*n,E=3*(p-n)-L,ee=1-L-E,l=3*r,T=3*(M-r)-l,_=1-l-T,Z=N=>((ee*N+E)*N+L)*N,ce=N=>((_*N+T)*N+l)*N,G=N=>(3*ee*N+2*E)*N+L;return N=>{if(N<=0)return 0;if(N>=1)return 1;let a=N;for(let J=0;J<6;J++){let we=G(a);if(Math.abs(we)<1e-6)break;a-=(Z(a)-N)/we}return ce(he(a))}}var z={out:at(.22,1,.36,1),reveal:at(.16,1,.3,1),io:at(.65,0,.35,1),expo:n=>n>=1?1:1-Math.pow(2,-10*n),inExpo:n=>n<=0?0:Math.pow(2,10*n-10),back:n=>1+(2.2+1)*Math.pow(n-1,3)+2.2*Math.pow(n-1,2),inCubic:n=>n*n*n},U=(n,r,p=.6)=>n<r?0:Math.exp(-((n-r)/p)*3);function wt(n){let r=n>>>0;return()=>{r=r+1831565813>>>0;let p=r;return p=Math.imul(p^p>>>15,p|1),p^=p+Math.imul(p^p>>>7,p|61),((p^p>>>14)>>>0)/4294967296}}var Ve=n=>{let r=Math.sin(n*127.1+311.7)*43758.5453;return r-Math.floor(r)};var Gt=`
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
}`,Nt="attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";function yt(n,r=!1){let p=n.getContext("webgl",{antialias:!1,alpha:!1,depth:!1,stencil:!1,premultipliedAlpha:!1,preserveDrawingBuffer:r,powerPreference:"high-performance"});if(!p)return null;let M=(T,_)=>{let Z=p.createShader(T);if(p.shaderSource(Z,_),p.compileShader(Z),!p.getShaderParameter(Z,p.COMPILE_STATUS))throw new Error(p.getShaderInfoLog(Z)||"shader");return Z},L;try{if(L=p.createProgram(),p.attachShader(L,M(p.VERTEX_SHADER,Nt)),p.attachShader(L,M(p.FRAGMENT_SHADER,Gt)),p.linkProgram(L),!p.getProgramParameter(L,p.LINK_STATUS))throw new Error(p.getProgramInfoLog(L)||"link")}catch(T){return console.warn("[cliko-intro] WebGL indisponible :",T),null}p.useProgram(L);let E=p.createBuffer();p.bindBuffer(p.ARRAY_BUFFER,E),p.bufferData(p.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),p.STATIC_DRAW);let ee=p.getAttribLocation(L,"a");p.enableVertexAttribArray(ee),p.vertexAttribPointer(ee,2,p.FLOAT,!1,0,0);let l={};for(let T of["R","T","SA","PA","PB","FX","FX2","CEN"])l[T]=p.getUniformLocation(L,T);return{draw(T){p.viewport(0,0,n.width,n.height),p.uniform2f(l.R,n.width,n.height),p.uniform1f(l.T,T.time),p.uniform4f(l.SA,T.a,T.b,T.mix,T.tr),p.uniform4fv(l.PA,T.pa),p.uniform4fv(l.PB,T.pb),p.uniform4fv(l.FX,T.fx),p.uniform4fv(l.FX2,T.fx2),p.uniform2fv(l.CEN,T.cen),p.drawArrays(p.TRIANGLES,0,3)},lost:()=>p.isContextLost()}}function Ot(n,r,p,M,L,E,ee,l,T,_=10,Z=1){let ce=[M+ee*E,L+E],G=[M+ee*E*.15+E*.1*Math.sign(ee||1),L+E*.5],N=S=>[(1-S)*(1-S)*M+2*(1-S)*S*G[0]+S*S*ce[0],(1-S)*(1-S)*L+2*(1-S)*S*G[1]+S*S*ce[1]],a=[],J=[],we=16;for(let S=0;S<=we;S++){let K=S/we,de=N(Math.max(0,K-.01)),ze=N(Math.min(1,K+.01)),le=ze[0]-de[0],Se=ze[1]-de[1],ve=Math.hypot(le,Se)||1,j=E*.03*(1-K*.5)*(1+.08*Math.sin(K*60)),O=N(K);a.push(r(O[0]-Se/ve*j,O[1]+le/ve*j)),J.push(r(O[0]+Se/ve*j,O[1]-le/ve*j))}n.beginPath(),n.moveTo(a[0][0],a[0][1]);for(let S of a)n.lineTo(S[0],S[1]);for(let S=J.length-1;S>=0;S--)n.lineTo(J[S][0],J[S][1]);n.closePath(),n.fill();let ye=ce;n.lineWidth=Math.max(1,E*p*.0065);for(let S=0;S<_;S++){let de=S/(_-1)*Math.PI*1.2-Math.PI*.1+(Ve(T+S)-.5)*.3+Math.sin(l*1.1+S*.9+T)*.045,ze=E*Z*(.34+.16*Ve(T*3+S)),le=.35+.35*Math.max(0,Math.sin(de)),Se=.9+.5*Ve(T*7+S),ve=26,j=[];for(let O=0;O<=ve;O++){let F=O/ve,ie=Math.cos(de)*ze*F,V=Math.sin(de)*ze*F*le+ze*F*.25-Se*ze*F*F*.8;j.push([ye[0]+ie,ye[1]+V+E*.015])}n.beginPath(),j.forEach((O,F)=>{let ie=r(O[0],O[1]);F?n.lineTo(ie[0],ie[1]):n.moveTo(ie[0],ie[1])}),n.lineWidth=Math.max(1,E*p*.009),n.stroke(),n.beginPath();for(let O=1;O<ve;O++){let F=O/ve,[ie,V]=j[O],Y=j[O+1][0]-j[O-1][0],se=j[O+1][1]-j[O-1][1],te=Math.hypot(Y,se)||1,W=Y/te,ae=se/te,Fe=E*Z*.12*Math.pow(Math.sin(Math.PI*Math.min(1,F*.95+.05)),.8)*(.85+.3*Ve(T+S*31+O)),Le=Math.sin(l*1.6+O*.4+S)*.04;for(let v of[1,-1]){let qe=-ae*v*.62-W*.35,e=W*v*.62-ae*.35-.55,s=Math.hypot(qe,e)||1;qe=qe/s*Fe+Le*Fe,e=e/s*Fe;let f=r(ie,V),i=r(ie+qe*.55+qe*.08,V+e*.45),d=r(ie+qe,V+e);n.moveTo(f[0],f[1]),n.quadraticCurveTo(i[0],i[1],d[0],d[1])}}n.lineWidth=Math.max(1,E*p*.0055),n.stroke()}n.beginPath();for(let S=0;S<4;S++){let K=r(ye[0]+(S-1.5)*E*.018,ye[1]-E*.015-S%2*E*.012);n.moveTo(K[0]+E*p*.014,K[1]),n.arc(K[0],K[1],E*p*.014,0,Math.PI*2)}n.fill()}function Dt(n,r,p,M,L,E,ee){n.beginPath();for(let l=0;l<7;l++){let T=E+M*.03+l*.045+Math.sin(l*2.1)*.03,_=ee+Math.cos(l*1.7)*.03+Math.sin(M*.8+l)*.004,Z=.011*(1-l*.05),ce=Math.sin(M*7+l*1.3)*.006,G=r(T-Z,_+ce),N=r(T,_-.002),a=r(T+Z,_+ce);n.moveTo(G[0],G[1]),n.quadraticCurveTo((G[0]+N[0])/2,N[1]-Z*p*.2,N[0],N[1]),n.quadraticCurveTo((N[0]+a[0])/2,N[1]-Z*p*.2,a[0],a[1])}n.lineWidth=Math.max(1,p*.0022),n.globalAlpha=L,n.stroke(),n.globalAlpha=1}function kt(n){let r=n.getContext("2d");return{draw(p,M){let L=n.width,E=n.height;r.clearRect(0,0,L,E);let ee=L/E;for(let l of M){if(!l||l.alpha<=.001)continue;let T=1+(l.zoom-1)*l.fg,_=(N,a)=>[L/2+(N*T-l.panX*l.fg-l.offX)*E,E/2-(a*T+l.offY)*E];r.save(),r.globalAlpha=l.alpha,r.fillStyle=l.color||"#0a0410",r.strokeStyle=l.color||"#0a0410",r.lineCap="round",r.lineJoin="round";let Z=ee/2/T,ce=l.small||1,G=(N,a,J,we,ye,S,K,de=1)=>Ot(r,_,E*T,N,a,J*ce,we,ye,S,K,de);ee<.8?(G(-Z-.05,-.62,1.02,.05,p,3,13,.42),G(Z+.05,-.66,.92,-.05,p+.6,17,13,.42)):l.layout==="sunset"?(G(-Z+.03,-.66,.92,.14,p,3,13),G(-Z+.24,-.62,.62,.08,p+1.3,9,12),G(Z-.06,-.68,.86,-.17,p+.6,17,13),ee>1.2&&G(Z-.34,-.56,.44,-.05,p+2.1,23,11)):l.layout==="city"&&(G(-Z+.04,-.68,.9,.12,p,41,13),ee>1.2&&G(Z-.1,-.7,.66,-.12,p+1.1,47,12)),r.restore(),l.birds&&(r.save(),r.strokeStyle="#1b0a1e",r.lineCap="round",Dt(r,_,E*T,p,l.birds*l.alpha,-.25,.22),r.restore())}},clear(){r.clearRect(0,0,n.width,n.height)}}}var be=n=>440*Math.pow(2,(n-69)/12),Tt={Am:{bass:33,pad:[57,60,64,67,71],arp:[69,72,76,79,81]},F:{bass:29,pad:[53,57,60,64,67],arp:[65,69,72,76,77]},C:{bass:36,pad:[55,60,62,64,67],arp:[67,72,74,76,79]},G:{bass:31,pad:[55,59,62,64,67],arp:[67,71,74,79,83]}},At=[[0,76,1],[1,74,.5],[1.5,72,.5],[2,74,1.5],[3.5,76,.5],[4,72,1],[5,69,1],[6,72,.5],[6.5,74,.5],[7,76,1],[8,79,1.5],[9.5,76,.5],[10,74,1],[11,72,1],[12,74,2],[14,71,1],[15,74,.75]];function Ht(n){let r=wt(20261119),p=0,M=n.createGain();M.gain.value=.82;let L=n.createWaveShaper();{let s=new Float32Array(2048);for(let f=0;f<2048;f++){let i=f/2047*2-1;s[f]=Math.tanh(i*1.25)/Math.tanh(1.25)}L.curve=s,L.oversample="2x"}let E=n.createDynamicsCompressor();E.threshold.value=-15,E.knee.value=9,E.ratio.value=3.2,E.attack.value=.006,E.release.value=.16;let ee=n.createBiquadFilter();ee.type="lowshelf",ee.frequency.value=95,ee.gain.value=.5;let l=n.createBiquadFilter();l.type="highshelf",l.frequency.value=8500,l.gain.value=4;let T=n.createBiquadFilter();T.type="highpass",T.frequency.value=32,T.Q.value=.6;let _=n.createGain();_.gain.value=.36,_.connect(T).connect(ee).connect(l).connect(E).connect(L).connect(M).connect(n.destination);let Z=n.createGain();Z.connect(_);let ce=n.createGain();ce.gain.value=.9,ce.connect(_);let G=n.createGain();G.gain.value=.85,G.connect(_);let N=n.createGain();N.gain.value=.9,N.connect(_);let a=n.createConvolver();{let e=Math.floor(n.sampleRate*3.4),s=n.createBuffer(2,e,n.sampleRate);for(let f=0;f<2;f++){let i=s.getChannelData(f),d=0;for(let m=0;m<e;m++){let b=m/e;d+=(r()*2-1-d)*(.55-.4*b),i[m]=d*Math.pow(1-b,2.6)*(m<n.sampleRate*.012?m/(n.sampleRate*.012):1)}}a.buffer=s}let J=n.createGain(),we=n.createGain();we.gain.value=.42;let ye=n.createBiquadFilter();ye.type="highpass",ye.frequency.value=220,J.connect(ye).connect(a).connect(we).connect(_);let S=n.createGain(),K=n.createDelay(2),de=n.createDelay(2);K.delayTime.value=H*.75,de.delayTime.value=H*.75;let ze=n.createGain();ze.gain.value=.36;let le=n.createBiquadFilter();le.type="lowpass",le.frequency.value=3600;let Se=n.createStereoPanner(),ve=n.createStereoPanner();Se.pan.value=-.75,ve.pan.value=.75;let j=n.createGain();j.gain.value=.5,S.connect(K),K.connect(Se).connect(j),K.connect(de),de.connect(ve).connect(j),de.connect(le).connect(ze).connect(K),j.connect(_),j.connect(J);let O=n.createBuffer(1,n.sampleRate*2,n.sampleRate);{let e=O.getChannelData(0);for(let s=0;s<e.length;s++)e[s]=r()*2-1}let F=new Float32Array(1024);for(let e=0;e<1024;e++)F[e]=Math.round((e/1023*2-1)*5)/5;let ie=new Float32Array(1024);for(let e=0;e<1024;e++)ie[e]=Math.tanh((e/1023*2-1)*4);let V=(e=0)=>{let s=n.createGain();return s.gain.value=e,s},Y=(e,s,f)=>{let i=n.createOscillator();return i.type=e,i.frequency.setValueAtTime(s,f),i},se=(e,s,f=.7)=>{let i=n.createBiquadFilter();return i.type=e,i.frequency.value=s,i.Q.value=f,i},te=(e,s)=>{let f=n.createBufferSource();return f.buffer=O,f.loop=!0,f.start(e,r()*1.5),f.stop(e+s+.05),f},W=(e,s,f)=>{if(f<=0)return;let i=V(f);e.connect(i).connect(s)},ae=(e,s,f,i,d)=>{e.gain.setValueAtTime(1e-4,s),e.gain.linearRampToValueAtTime(f,s+i),e.gain.exponentialRampToValueAtTime(1e-4,s+i+d)},Fe=e=>{let s=n.createStereoPanner();return s.pan.value=e,s},Le=(e,s=.62)=>{Z.gain.setValueAtTime(1-s,e),Z.gain.setTargetAtTime(1,e+.02,.09)},v={kick(e,s=1){let f=Y("sine",165,e);f.frequency.exponentialRampToValueAtTime(52,e+.09),f.frequency.exponentialRampToValueAtTime(40,e+.42);let i=V();ae(i,e,s,.002,.5),f.connect(i).connect(ce),f.start(e),f.stop(e+.6);let d=te(e,.03),m=se("highpass",2500),b=V();ae(b,e,.22*s,.001,.02),d.connect(m).connect(b).connect(ce),Le(e)},snare(e,s=1,f=.6){let i=te(e,.4),d=se("bandpass",1900,.6),m=V();ae(m,e,.75*s,.002,.24),i.connect(d).connect(m).connect(ce),W(m,J,f);let b=Y("triangle",200,e);b.frequency.exponentialRampToValueAtTime(155,e+.1);let t=V();ae(t,e,.45*s,.002,.12),b.connect(t).connect(ce),W(t,J,f*.5),b.start(e),b.stop(e+.2)},clap(e,s=1){let f=te(e,.3),i=se("bandpass",1300,1.2),d=V();d.gain.setValueAtTime(1e-4,e);for(let m=0;m<3;m++)d.gain.setValueAtTime(.5*s,e+m*.011),d.gain.exponentialRampToValueAtTime(.05,e+m*.011+.009);d.gain.setValueAtTime(.45*s,e+.034),d.gain.exponentialRampToValueAtTime(1e-4,e+.22),f.connect(i).connect(d).connect(ce),W(d,J,.5)},hat(e,s=1,f=!1){let i=te(e,f?.35:.08),d=se("highpass",7800),m=V();ae(m,e,(f?.17:.23)*s,.001,f?.26:.045),i.connect(d).connect(m).connect(Fe(f?.25:-.2)).connect(ce)},tom(e,s,f=1){let i=Y("sine",s,e);i.frequency.exponentialRampToValueAtTime(s*.55,e+.3);let d=V();ae(d,e,.6*f,.002,.32),i.connect(d).connect(ce),W(d,J,.35),i.start(e),i.stop(e+.4)},crash(e,s=1){let f=te(e,2.6),i=se("highpass",4200),d=V();ae(d,e,.2*s,.003,2.4),f.connect(i).connect(d).connect(ce),W(d,J,.3)},pad(e,s,f,i=1,d=1800,m=.5){let b=se("lowpass",d,.6),t=V();t.gain.setValueAtTime(1e-4,e),t.gain.linearRampToValueAtTime(.055*i,e+m),t.gain.setValueAtTime(.055*i,e+f),t.gain.exponentialRampToValueAtTime(1e-4,e+f+1.1),b.connect(t).connect(Z),W(t,J,.5);for(let g of s)for(let[R,oe]of[[-9,-.6],[0,0],[9,.6]]){let ne=Y("sawtooth",be(g),e);ne.detune.value=R+(r()-.5)*3,ne.connect(Fe(oe)).connect(b),ne.start(e),ne.stop(e+f+1.2)}return b},bass(e,s,f,i=1,d=1){let m=Y("sawtooth",be(s),e),b=Y("square",be(s),e);b.detune.value=-7;let t=se("lowpass",260,5);t.frequency.setValueAtTime(260+1500*d,e),t.frequency.exponentialRampToValueAtTime(240,e+.16);let g=V();g.gain.setValueAtTime(1e-4,e),g.gain.linearRampToValueAtTime(.11*i,e+.005),g.gain.setValueAtTime(.095*i,e+Math.max(.02,f-.03)),g.gain.exponentialRampToValueAtTime(1e-4,e+f+.04);let R=Y("sine",be(s),e),oe=V(.16*i);oe.gain.setValueAtTime(.16*i,e+Math.max(.02,f-.03)),oe.gain.exponentialRampToValueAtTime(1e-4,e+f+.04),m.connect(t),b.connect(t),t.connect(g).connect(Z),R.connect(oe).connect(Z);for(let ne of[m,b,R])ne.start(e),ne.stop(e+f+.1)},bassSwell(e,s,f){let i=Y("sawtooth",be(s),e),d=Y("sine",be(s),e),m=se("lowpass",120,3);m.frequency.setValueAtTime(120,e),m.frequency.exponentialRampToValueAtTime(900,e+f*.8);let b=V();b.gain.setValueAtTime(1e-4,e),b.gain.linearRampToValueAtTime(.13,e+.3),b.gain.setValueAtTime(.13,e+f),b.gain.exponentialRampToValueAtTime(1e-4,e+f+.3),i.connect(m),d.connect(m),m.connect(b).connect(_);for(let t of[i,d])t.start(e),t.stop(e+f+.4)},pluck(e,s,f=1,i=.35){let d=Y("square",be(s),e),m=Y("triangle",be(s+12),e),b=se("lowpass",3800,2);b.frequency.setValueAtTime(3800,e),b.frequency.exponentialRampToValueAtTime(500,e+.16);let t=V();ae(t,e,.07*f,.003,.2);let g=V(.4);d.connect(b),m.connect(g).connect(b),b.connect(t).connect(Z),W(t,S,i),W(t,J,.2),d.start(e),m.start(e),d.stop(e+.3),m.stop(e+.3)},lead(e,s,f,i=1){let d=e+f*H,m=se("lowpass",3400,1.2),b=V();b.gain.setValueAtTime(1e-4,e),b.gain.linearRampToValueAtTime(.085*i,e+.025),b.gain.setValueAtTime(.075*i,d-.02),b.gain.exponentialRampToValueAtTime(1e-4,d+.28),m.connect(b).connect(N),W(b,S,.42),W(b,J,.45);let t=Y("sine",5.6,e),g=V(0);g.gain.setValueAtTime(0,e),g.gain.linearRampToValueAtTime(be(s)*.006,e+Math.min(.5,f*H)),t.connect(g);for(let ne of[-8,8]){let q=Y("sawtooth",be(s),e);q.detune.value=ne,g.connect(q.frequency),q.connect(m),q.start(e),q.stop(d+.35)}let R=Y("square",be(s-12),e),oe=V(.25);g.connect(R.frequency),R.connect(oe).connect(m),R.start(e),R.stop(d+.35),t.start(e),t.stop(d+.35)},stab(e,s,f=1){let i=se("lowpass",5200,1.5);i.frequency.setValueAtTime(5200,e),i.frequency.exponentialRampToValueAtTime(700,e+.35);let d=V();ae(d,e,.09*f,.004,.42),i.connect(d).connect(_),W(d,J,.6),W(d,S,.2);for(let m of s)for(let b of[-11,11]){let t=Y("sawtooth",be(m),e);t.detune.value=b,t.connect(i),t.start(e),t.stop(e+.6)}},impact(e,s=1){let f=Y("sine",72,e);f.frequency.exponentialRampToValueAtTime(28,e+1.4);let i=V();ae(i,e,.6*s,.004,1.8*s),f.connect(i).connect(G),f.start(e),f.stop(e+2.4*s);let d=Y("sine",140,e);d.frequency.exponentialRampToValueAtTime(42,e+.25);let m=n.createWaveShaper();m.curve=ie;let b=V();ae(b,e,.4*s,.002,.7),d.connect(m).connect(b).connect(G),d.start(e),d.stop(e+1);let t=te(e,2.2),g=se("lowpass",4500,.5),R=V();g.frequency.setValueAtTime(4500,e),g.frequency.exponentialRampToValueAtTime(180,e+1.6),ae(R,e,.42*s,.003,1.8),t.connect(g).connect(R).connect(G),W(R,J,.9),v.crash(e,.9*s),Le(e,.85)},riser(e,s,f=1){let i=te(e,s),d=se("bandpass",300,3),m=V();d.frequency.setValueAtTime(260,e),d.frequency.exponentialRampToValueAtTime(7500,e+s),m.gain.setValueAtTime(1e-4,e),m.gain.exponentialRampToValueAtTime(.32*f,e+s),m.gain.setValueAtTime(0,e+s+.01),i.connect(d).connect(m).connect(G),W(m,J,.5);let b=Y("sawtooth",110,e),t=se("lowpass",1800),g=V();b.frequency.exponentialRampToValueAtTime(880,e+s),g.gain.setValueAtTime(1e-4,e),g.gain.exponentialRampToValueAtTime(.06*f,e+s),g.gain.setValueAtTime(0,e+s+.01),b.connect(t).connect(g).connect(G),W(g,S,.3),b.start(e),b.stop(e+s+.05)},reverse(e,s,f=1){let i=te(e,s),d=se("highpass",2400),m=V();m.gain.setValueAtTime(1e-4,e),m.gain.exponentialRampToValueAtTime(.4*f,e+s),m.gain.setValueAtTime(0,e+s+.008),i.connect(d).connect(m).connect(G),W(m,J,.3)},whoosh(e,s=.5,f=1,i=1){let d=te(e,s),m=se("bandpass",500,1.6),b=V(),t=n.createStereoPanner();m.frequency.setValueAtTime(450,e),m.frequency.exponentialRampToValueAtTime(3800,e+s*.55),m.frequency.exponentialRampToValueAtTime(600,e+s),b.gain.setValueAtTime(1e-4,e),b.gain.exponentialRampToValueAtTime(.5*i,e+s*.55),b.gain.exponentialRampToValueAtTime(1e-4,e+s),t.pan.setValueAtTime(-.9*f,e),t.pan.linearRampToValueAtTime(.9*f,e+s),d.connect(m).connect(b).connect(t).connect(G),W(b,J,.3)},downlifter(e,s){let f=Y("sawtooth",1100,e),i=se("lowpass",2600),d=V();f.frequency.exponentialRampToValueAtTime(55,e+s),i.frequency.setValueAtTime(2600,e),i.frequency.exponentialRampToValueAtTime(160,e+s),d.gain.setValueAtTime(.09,e),d.gain.exponentialRampToValueAtTime(1e-4,e+s),f.connect(i).connect(d).connect(G),W(d,J,.4),f.start(e),f.stop(e+s+.05)},zap(e,s=1){let f=Y("sawtooth",98,e),i=se("bandpass",1500,2.5),d=V(),m=[1,0,.8,0,0,1,.3,1];d.gain.setValueAtTime(0,e),m.forEach((ne,q)=>d.gain.setValueAtTime(ne*.09*s,e+q*.028)),d.gain.setValueAtTime(.05*s,e+m.length*.028),d.gain.exponentialRampToValueAtTime(1e-4,e+.5),f.connect(i).connect(d).connect(G),W(d,J,.2),f.start(e),f.stop(e+.55);let b=te(e,.25),t=se("highpass",5e3),g=V();g.gain.setValueAtTime(0,e),m.forEach((ne,q)=>g.gain.setValueAtTime(ne*.12*s,e+q*.028+.004)),g.gain.setValueAtTime(0,e+.25),b.connect(t).connect(g).connect(G);let R=Y("sine",2600,e),oe=V();ae(oe,e,.05*s,.001,.12),R.connect(oe).connect(G),W(oe,S,.4),R.start(e),R.stop(e+.2)},buzz(e,s){let f=Y("sawtooth",100,e),i=se("bandpass",1700,3),d=V();d.gain.setValueAtTime(1e-4,e),d.gain.linearRampToValueAtTime(.025,e+.05),d.gain.setValueAtTime(.025,e+s-.1),d.gain.linearRampToValueAtTime(1e-4,e+s),f.connect(i).connect(d).connect(G),f.start(e),f.stop(e+s+.05)},pop(e,s=1){let f=Y("sine",520,e),i=V();f.frequency.exponentialRampToValueAtTime(1500,e+.06),ae(i,e,.28*s,.002,.12),f.connect(i).connect(G),W(i,S,.25),W(i,J,.25),f.start(e),f.stop(e+.2)},blip(e,s=1400,f=1){let i=Y("sine",s,e),d=V();ae(d,e,.12*f,.002,.08),i.connect(d).connect(Fe((r()-.5)*.8)).connect(G),W(d,S,.25),i.start(e),i.stop(e+.12)},click(e,s=1){let f=te(e,.03),i=se("highpass",3500),d=V();ae(d,e,.16*s,.001,.018),f.connect(i).connect(d).connect(Fe((r()-.5)*.6)).connect(G)},glitch(e,s){let f=n.createWaveShaper();f.curve=F;let i=V(.11);f.connect(i).connect(G),W(i,S,.15);let d=H/8;for(let m=0;m<s;m+=d){if(r()<.3)continue;let b=e+m;if(r()<.55){let t=Y("square",200+r()*1800,b),g=V();ae(g,b,.6,.001,d*.8),t.connect(g).connect(f),t.start(b),t.stop(b+d)}else{let t=te(b,d),g=V();ae(g,b,.7,.001,d*.7),t.connect(g).connect(f)}}},laser(e,s=1){let f=Y("sawtooth",2600,e),i=se("bandpass",1600,3),d=V(),m=n.createStereoPanner();f.frequency.exponentialRampToValueAtTime(160,e+.4),ae(d,e,.1*s,.003,.4),m.pan.setValueAtTime(-.8,e),m.pan.linearRampToValueAtTime(.8,e+.4),f.connect(i).connect(d).connect(m).connect(G),W(d,S,.3),f.start(e),f.stop(e+.45)},bell(e,s,f=1){let i=[[1,.22,2.4],[2,.08,1.4],[3.01,.05,.8],[4.17,.025,.45]];for(let[d,m,b]of i){let t=Y("sine",be(s)*d,e),g=V();ae(g,e,m*f,.002,b),t.connect(g).connect(G),W(g,J,.5),W(g,S,.25),t.start(e),t.stop(e+b+.1)}},thump(e,s=1){let f=Y("sine",78,e),i=V();f.frequency.exponentialRampToValueAtTime(44,e+.35),ae(i,e,.55*s,.004,.55),f.connect(i).connect(G),W(i,J,.35),f.start(e),f.stop(e+.7);let d=te(e,.2),m=se("lowpass",900),b=V();ae(b,e,.08*s,.002,.15),d.connect(m).connect(b).connect(G),W(b,J,.6)},shimmer(e,s,f=1){let i=te(e,s),d=se("bandpass",6e3,6),m=V();m.gain.setValueAtTime(1e-4,e),m.gain.exponentialRampToValueAtTime(.18*f,e+s*.4),m.gain.exponentialRampToValueAtTime(1e-4,e+s),i.connect(d).connect(m).connect(G),W(m,J,.7),W(m,S,.3)},drone(e,s,f){let i=Y("sine",be(s),e),d=Y("triangle",be(s+12),e),m=V();m.gain.setValueAtTime(1e-4,e),m.gain.linearRampToValueAtTime(.08,e+f*.5),m.gain.setValueAtTime(.08,e+f-.2),m.gain.linearRampToValueAtTime(1e-4,e+f);let b=V(.18);i.connect(m),d.connect(b).connect(m),m.connect(_);for(let t of[i,d])t.start(e),t.stop(e+f+.05)}};function qe(){let e=[],s=(t,g)=>e.push({t:t*H,run:g}),f=t=>Tt[it[Math.min(t,it.length-1)]];for(let t=0;t<16;t++){let g=f(t),R=t<2?700+t*500:t===6?1300:t>=13?2600:2e3,oe=t<2?.9:t===6?1.1:1,ne=t===0?2:t===6?.15:.35;s(t*4,q=>v.pad(q,g.pad,4*H-.05,oe,R,ne))}s(64,t=>v.pad(t,[45,57,60,64,67,71,76],H*5,1.25,2400,.08)),s(0,t=>v.drone(t,33,8*H)),[2,3,4,5].forEach((t,g)=>s(t,R=>v.thump(R,.8+g*.1))),s(1,t=>v.shimmer(t,H*2.5,.8)),[4,4.75,5.5,6,6.5,7].forEach((t,g)=>s(t,R=>v.pluck(R,Tt.F.arp[g%5],.7,.5))),s(5,t=>v.riser(t,H*3,1)),s(6,t=>v.reverse(t,H*2,1));let i=(t,{ghost:g=!0,fill:R=!1,half:oe=!1}={})=>{let ne=t*4;if(oe){s(ne,q=>v.kick(q,1)),s(ne+2,q=>v.snare(q,1,.8));for(let q=0;q<4;q++)s(ne+q,$e=>v.hat($e,.6));return}s(ne,q=>v.kick(q,1)),s(ne+2,q=>v.kick(q,.95)),g&&t%2===1&&s(ne+2.5+.25,q=>v.kick(q,.6)),s(ne+1,q=>{v.snare(q),v.clap(q,.6)}),R||s(ne+3,q=>{v.snare(q),v.clap(q,.6)});for(let q=0;q<8&&!(R&&q>=4);q++)s(ne+q*.5,$e=>v.hat($e,q%2?1:.55,q===7));for(let q=0;q<16;q+=2)(!R||q<8)&&s(ne+q*.25+.25,$e=>v.hat($e,.25))},d=(t,g=4)=>{let R=f(t);for(let oe=0;oe<g*2;oe++){let ne=R.bass+(oe%2?12:0);s(t*4+oe*.5,q=>v.bass(q,ne,H*.45,oe%2?.8:1,oe%4===0?1:.6))}},m=(t,g=1,R=4)=>{let oe=f(t).arp,ne=[0,1,2,3,4,3,2,1];for(let q=0;q<R*4;q++)s(t*4+q*.25,$e=>v.pluck($e,oe[ne[q%8]],g*(q%4===0?1:.7)))};s(8,t=>v.impact(t,.9));for(let t=2;t<=5;t++)i(t,{fill:t===5}),d(t,t===5?3:4),m(t,.8,t===5?3:4);s(9,t=>v.stab(t,[57,64,69,72],.9)),s(11.75,t=>v.whoosh(t,H*.75,1,1.1)),s(12.5,t=>v.zap(t,1)),s(13,t=>v.zap(t,1.1)),s(13.2,t=>v.buzz(t,H*2.6)),s(15.75,t=>v.whoosh(t,H*.6,-1,1)),s(16,t=>v.crash(t,.8)),s(20,t=>v.riser(t,H*3,.8)),[22,22.25,22.5,22.75].forEach((t,g)=>s(t,R=>v.tom(R,[190,160,130,100][g],1))),s(22.5,t=>v.downlifter(t,H*.5)),s(23,t=>v.reverse(t,H,1.2)),s(24,t=>{v.impact(t,1.25),v.kick(t,1)}),s(24,t=>v.bassSwell(t,33,H*4)),m(6,.45),s(24.5,t=>v.shimmer(t,H*3,1)),[25,25.6,26,26.6,27,27.2].forEach((t,g)=>s(t,R=>v.zap(R,.7+g%2*.2))),s(26.5,t=>v.pop(t,1)),s(27.75,t=>v.reverse(t,H*.25,.8));let b=[[57,60,64,69],[57,60,65,69],[60,64,67,72]];[28,29,30].forEach((t,g)=>s(t,R=>{v.stab(R,b[g],1.1),v.snare(R,.9,.7),v.kick(R,1)})),s(28,t=>v.crash(t,1));for(let t=7;t<=8;t++){if(t===7){s(31,g=>v.snare(g));for(let g=6;g<8;g++)s(28+g*.5,R=>v.hat(R,g%2?1:.55,g===7));for(let g=0;g<2;g++)s(31+g*.5,R=>v.bass(R,f(7).bass+(g%2?12:0),H*.45))}else i(t),d(t);m(t,.9)}s(35.5,t=>v.whoosh(t,H*.7,1,1));for(let t=9;t<=12;t++)i(t),d(t),m(t,.6);At.forEach(([t,g,R])=>s(36+t,oe=>v.lead(oe,g,R,.85))),[36,40,44,48].forEach(t=>s(t,g=>v.crash(g,.7))),s(36,t=>v.laser(t,.6)),[36.8,36.9,37].forEach((t,g)=>s(t,R=>v.blip(R,1500+g*300,.8))),[37.25,37.5,38,38.5,38.75,39].forEach((t,g)=>s(t,R=>v.blip(R,[900,1200,1e3,1350,1500,1700][g],1))),s(39.5,t=>{v.click(t,1.4),v.pop(t,.6)}),s(39.75,t=>v.whoosh(t,H*.5,1,.9)),s(40,t=>v.glitch(t,H*.75)),s(41,t=>v.glitch(t,H*.25)),[41,42,43].forEach(t=>s(t,g=>v.pop(g,.5))),s(42.5,t=>v.glitch(t,H*.4)),s(43.75,t=>v.whoosh(t,H*.5,-1,.9)),[44.5,45,45.5].forEach((t,g)=>s(t,R=>v.whoosh(R,H*.4,g%2?-1:1,.7))),[44.7,45.2,45.7].forEach(t=>s(t,g=>v.click(g,1.2))),s(47.75,t=>v.whoosh(t,H*.5,1,.9));for(let t=0;t<44;t++){let g=48.3+t*.062+(t%5===4?.06:0);g<51&&s(g,R=>v.click(R,.6+r()*.5))}s(51,t=>v.laser(t,.8)),s(51.25,t=>v.riser(t,H*.75,.7)),s(52,t=>v.impact(t,1));for(let t=13;t<=14;t++)i(t),d(t),m(t,.7);i(15,{half:!0}),d(15,4),m(15,.5),At.filter(([t])=>t<8).forEach(([t,g,R])=>s(52+t,oe=>v.lead(oe,g+12,R,.7))),[[60,74,2],[62,71,1],[63,74,1]].forEach(([t,g,R])=>s(t,oe=>v.lead(oe,g+12,R,.65)));for(let t=0;t<8;t++)s(54+t*.25,g=>v.bell(g,[81,84,88,91,93,96,100,103][t],.35));return s(56,t=>v.bell(t,76,1)),s(58,t=>v.pop(t,.5)),s(63,t=>v.reverse(t,H,.9)),s(64,t=>{v.impact(t,.9),v.bass(t,33,H*4,1,.3),v.bell(t,69,.8)}),e.sort((t,g)=>t.t-g.t),e}return{ctx:n,master:M,score:qe,I:v,now0:p}}var _e=class{constructor(){let r=window.AudioContext||window.webkitAudioContext;this.ctx=new r({latencyHint:"interactive"}),this.engine=Ht(this.ctx),this.events=this.engine.score(),this.i=0,this.t0=0,this.timer=0,this.muted=!1}get latency(){return(this.ctx.outputLatency||0)+(this.ctx.baseLatency||0)}start(r=0,p=.08){this.t0=this.ctx.currentTime+p-r,this.i=this.events.findIndex(L=>L.t>=r-.02),this.i<0&&(this.i=this.events.length);let M=this.engine.master.gain;M.cancelScheduledValues(this.ctx.currentTime),M.setValueAtTime(this.muted?0:.82,this.ctx.currentTime),this.tick(),this.timer=setInterval(()=>this.tick(),25)}tick(){let r=this.ctx.currentTime+.18;for(;this.i<this.events.length&&this.t0+this.events[this.i].t<r;){let p=this.events[this.i++],M=Math.max(this.t0+p.t,this.ctx.currentTime+.005);try{p.run(M)}catch{}}}time(){return this.ctx.currentTime-this.t0-this.latency}setMuted(r){this.muted=r;let p=this.engine.master.gain,M=this.ctx.currentTime;p.cancelScheduledValues(M),p.setTargetAtTime(r?0:.82,M,.06)}fadeOut(r=.8){let p=this.engine.master.gain,M=this.ctx.currentTime;p.cancelScheduledValues(M),p.setValueAtTime(p.value,M),p.linearRampToValueAtTime(0,M+r),setTimeout(()=>this.close(),r*1e3+100)}close(){clearInterval(this.timer),this.ctx.close?.().catch(()=>{})}};var Wt=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,Et=`
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
.grain{position:absolute;inset:-60px;background-image:${Wt};background-size:220px 220px;opacity:.085;mix-blend-mode:overlay;pointer-events:none}
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
`;var ue=n=>String(n).replace(/[&<>"]/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[r]),ct=(n="")=>`
<svg class="logo" viewBox="0 0 480 148" aria-hidden="true" ${n}>
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
</svg>`,rt=(n,r)=>`<span class="w ${r}"><span class="grad">${ue(n)}</span><span class="shine" aria-hidden="true">${ue(n)}</span></span>`,lt=(n,r)=>`<span class="w tw ${r}"><span class="tube">${ue(n)}</span><span class="neon">${ue(n)}</span></span>`,Xt=['<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9s-1.3 6.3-3.9 9c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3z"/></svg>','<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="6.5" rx="2"/><rect x="4" y="13.5" width="16" height="6.5" rx="2"/><path d="M8 7.25h.01M8 16.75h.01M12 7.25h4M12 16.75h4"/></svg>','<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/></svg>'];function Mt(n){let r=n.services,p=['<span class="kw">const</span> site = cliko.<span class="kw">create</span><span class="p">({</span>',`  commerce<span class="p">:</span> <span class="s">"${ue(n.yours)}"</span><span class="p">,</span>`,'  langues<span class="p">: [</span><span class="s">"fr"</span><span class="p">,</span> <span class="s">"nl"</span><span class="p">,</span> <span class="s">"en"</span><span class="p">],</span>','  design<span class="p">:</span> <span class="s">"sur-mesure"</span><span class="p">,</span>','  hosting<span class="p">:</span> <span class="kw">true</span><span class="p">,</span>','<span class="p">});</span>','site.<span class="kw">launch</span><span class="p">();</span> <span class="cm">// </span><span class="ok">\u2713 live</span>'],M="THE FUTURE IS DIGITAL.",L="",E=0;for(let l of M)l===" "?(E++,L+=`<span class="sp b${E*2}"></span>`,E===2&&(L+='<span class="br"></span>')):L+=`<span class="ch grad">${ue(l)}</span>`;let ee=l=>{let[T,_]=r[l];return`<div class="m m${l+1}">
      <div class="ml mono"><i></i><span>Mission 0${l+1}</span><em>/ 04</em></div>
      <div class="mt"><span class="ln"><span>${ue(T)}</span></span><span class="ln g"><span>${ue(_)}</span></span>${l===3?'<span class="car"></span>':""}</div>
      <p class="md">${ue(n.desc[l])}</p>
    </div>`};return`
<div class="ck" role="dialog" aria-modal="true" aria-label="${ue(n.label)}">
  <canvas class="gl" aria-hidden="true"></canvas>
  <canvas class="sil" aria-hidden="true"></canvas>
  <div class="stage" aria-hidden="true">
    <div class="sc s1"><div class="a s1w"><div class="s1l"><span class="grp"><span class="w">The</span> <span class="w">wait</span></span> <span class="grp"><span class="w">is</span> <span class="w">over.</span></span></div></div><div class="flare"></div></div>

    <div class="sc s2a"><div class="a"><div class="row big glowP">${rt("GTA","gta")}${rt("VI","vi")}</div></div></div>
    <div class="sc s2b"><div class="a"><div class="row">${lt("IS","is")}${lt("HERE.","here")}</div></div></div>
    <div class="sc s2c"><div class="a"><div class="lk">
      <div class="k mono">The wait is over</div>
      <div class="big glowP l1">${rt("GTA VI","l1w")}</div>
      <div class="l2">${lt("IS HERE.","l2w")}</div>
    </div></div></div>
    <div class="loc mono"><i></i><span class="lt"></span><b></b></div>

    <div class="sc s3">
      <div class="lw l3">${ct()}</div>
      <div class="row big s3t glowP"><span class="w chrome">We</span><span class="w chrome">are</span><span class="w chrome">too.</span></div>
    </div>

    <div class="sc s4">
      <div class="g4">
        <div class="tx">${[0,1,2,3].map(ee).join("")}</div>
        <div class="vs">
          <div class="v v1"><div class="bw">
            <div class="bg"></div>
            <svg viewBox="0 0 400 270" preserveAspectRatio="none"><rect class="fr" x="1" y="1" width="398" height="268" rx="14" pathLength="1"/><line class="tb" x1="1" y1="30" x2="399" y2="30" pathLength="1"/></svg>
            <i class="d d1"></i><i class="d d2"></i><i class="d d3"></i><i class="url"></i>
            <i class="hero"></i><i class="h1"></i><i class="h2"></i><i class="bt"></i>
            <i class="cd c1"></i><i class="cd c2"></i><i class="cd c3"></i>
            <i class="rip"></i><i class="cur"></i>
          </div></div>
          <div class="v v2"><div class="ph"><div class="scr"><i class="sg"></i>${n.chips.map((l,T)=>`<i class="chip k${T+1}">${ue(l)}</i>`).join("")}</div><i class="notch"></i></div><i class="ring r1"></i><i class="ring r2"></i><i class="ring r3"></i></div>
          <div class="v v3"><div class="cds">${n.cards.map(([l,T],_)=>`<div class="cd3 q${_+1}">${Xt[_]}<b>${ue(l)}</b><span>${ue(T)}</span></div>`).join("")}</div></div>
          <div class="v v4"><div class="cw"><div class="code"><div class="cbar"><i></i><i></i><i></i><span class="mono">cliko.config.js</span></div><div class="cl mono">${p.map(l=>`<span><span>${l}</span></span>`).join("")}</div><i class="ccar"></i><i class="scan"></i></div><div class="tag neon">&lt;/&gt;</div></div></div>
        </div>
      </div>
      <div class="pb"><i><b></b></i><i><b></b></i><i><b></b></i><i><b></b></i></div>
    </div>

    <div class="sc s5">
      <div class="pk mono">GTA VI is here. We are too.</div>
      <div class="lw l5">${ct()}</div>
      <div class="t5 glowP">${L}</div>
      <div class="u5 mono"><i></i><span>cliko.be</span></div>
    </div>
  </div>
  <div class="grain" aria-hidden="true"></div>
  <div class="bar t" aria-hidden="true"></div><div class="bar b" aria-hidden="true"></div>
  <div class="fade" aria-hidden="true"></div>
  <div class="ui">
    <div class="cta" hidden><button class="btn pri go-site">${ue(n.site)}</button><button class="btn sec go-quote">${ue(n.quote)}</button></div>
    <div class="gate" hidden>
      <div class="lw">${ct()}</div>
      <div class="gk mono">${ue(n.prod)}</div>
      <button class="btn pri play"><span class="pi"><svg viewBox="0 0 14 16"><path d="M0 0l14 8-14 8z"/></svg></span><span>${ue(n.play)}</span></button>
      <div class="gh mono">${ue(n.hint)}</div>
      <button class="enter">${ue(n.enter)} \u2192</button>
    </div>
    <button class="ctl snd mono" aria-pressed="true" hidden><svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="wv" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/><path class="x" d="M17 9.5l5 5M22 9.5l-5 5"/></svg><span class="sl"></span></button>
    <button class="ctl skip mono" hidden>${ue(n.skip)} \u203A</button>
    <div class="prog" hidden><b></b></div>
  </div>
  <p class="sr" aria-live="polite"></p>
</div>`}var Rt=n=>["const site = cliko.create({",`  commerce: "${n.yours}",`,'  langues: ["fr", "nl", "en"],','  design: "sur-mesure",',"  hosting: true,","});","site.launch(); // \u2713 live"].map(r=>r.length);var pt={fr:{label:"Trailer Cliko : GTA VI is here. We are too. Cr\xE9ation de sites web, exp\xE9riences digitales, solutions modernes, d\xE9veloppement sur mesure. The future is digital.",prod:"Une production Cliko \xB7 Bruxelles",play:"Lancer le trailer",hint:"Son recommand\xE9 \xB7 35 s",enter:"Entrer directement sur le site",skip:"Passer l\u2019intro",soundOn:"Son activ\xE9",soundOff:"Son coup\xE9",site:"Entrer sur le site",quote:"Demander un devis",replay:"Lire le trailer",loc1:"Bruxelles \u2014 19:47",loc2:"En direct \xB7 cliko.be",services:[["Cr\xE9ation de","sites web"],["Exp\xE9riences","digitales"],["Solutions","modernes"],["D\xE9veloppement","sur mesure"]],desc:["Des sites vitrines sur mesure, pens\xE9s pour votre commerce.","Animations, interactions : une marque dont on se souvient.","H\xE9bergement, nom de domaine, mises \xE0 jour : on s\u2019occupe de tout.","Du code \xE9crit \xE0 la main \xE0 Bruxelles, rapide sur tous les \xE9crans."],chips:["R\xE9server","Menu","Contact"],cards:[["FR \xB7 NL \xB7 EN","Trois langues"],["H\xE9bergement","et nom de domaine inclus"],["24 h","pour vous r\xE9pondre"]],yours:"le v\xF4tre"},nl:{label:"Cliko-trailer: GTA VI is here. We are too. Websitecreatie, digitale ervaringen, moderne oplossingen, ontwikkeling op maat. The future is digital.",prod:"Een Cliko-productie \xB7 Brussel",play:"Trailer starten",hint:"Met geluid \xB7 35 s",enter:"Meteen naar de site",skip:"Intro overslaan",soundOn:"Geluid aan",soundOff:"Geluid uit",site:"Naar de site",quote:"Offerte aanvragen",replay:"Trailer afspelen",loc1:"Brussel \u2014 19:47",loc2:"Live \xB7 cliko.be",services:[["Website-","creatie"],["Digitale","ervaringen"],["Moderne","oplossingen"],["Ontwikkeling","op maat"]],desc:["Websites op maat, ontworpen voor uw zaak.","Animaties, interacties: een merk dat men onthoudt.","Hosting, domeinnaam en updates: wij regelen alles.","Handgeschreven code uit Brussel, snel op elk scherm."],chips:["Reserveren","Menu","Contact"],cards:[["FR \xB7 NL \xB7 EN","Drie talen"],["Hosting","en domeinnaam inbegrepen"],["24 u","om u te antwoorden"]],yours:"de uwe"},en:{label:"Cliko trailer: GTA VI is here. We are too. Website creation, digital experiences, modern solutions, custom development. The future is digital.",prod:"A Cliko production \xB7 Brussels",play:"Play the trailer",hint:"Sound on \xB7 35 s",enter:"Go straight to the site",skip:"Skip intro",soundOn:"Sound on",soundOff:"Sound off",site:"Enter the site",quote:"Get a quote",replay:"Play the trailer",loc1:"Brussels \u2014 7:47 pm",loc2:"Live \xB7 cliko.be",services:[["Website","creation"],["Digital","experiences"],["Modern","solutions"],["Custom","development"]],desc:["Bespoke websites, designed around your business.","Motion and interaction: a brand people remember.","Hosting, domain and updates: we handle everything.","Hand-written code from Brussels, fast on every screen."],chips:["Book","Menu","Contact"],cards:[["FR \xB7 NL \xB7 EN","Three languages"],["Hosting","and domain included"],["24 h","to answer you"]],yours:"yours"}},zt=n=>{let r=String(n||"fr").slice(0,2).toLowerCase();return pt[r]?r:"fr"};var St="cliko-intro:v1",Be=n=>n*n*(3-2*n),A=(n,r,p)=>{let M=n.__c||(n.__c={});M[r]!==p&&(M[r]=p,n.style.setProperty(r,p))},$=(n,r)=>A(n,"opacity",r<=.002?"0":r>=.998?"1":r.toFixed(3)),Ze=(n,r)=>A(n,"filter",r>.25?`blur(${r.toFixed(1)}px)`:"none"),Ge=(n,r,p=1,M="")=>`translate3d(${n.toFixed(1)}px,${r.toFixed(1)}px,0) scale(${p.toFixed(4)})${M}`,ge=(n,r=0,p=0,M=1,L="")=>A(n,"transform",Ge(r,p,M,L)),Pe=(n,r=0,p=0,M=1,L="")=>A(n,"transform","translate(-50%,-50%) "+Ge(r,p,M,L)),Re=(n,r,p="flex")=>A(n,"display",r?p:"none"),Ke=(n,r,p="")=>{if(r<.3)return A(n,"filter",p||"none");let M=r.toFixed(1);A(n,"filter",`${p} drop-shadow(${M}px 0 0 rgba(255,40,140,.75)) drop-shadow(-${M}px 0 0 rgba(40,220,255,.6))`)};function et(n,r){let p=n-r;if(p<0)return 0;let M=[[0,1],[.05,0],[.11,.9],[.15,0],[.27,1],[.31,.15],[.37,1]],L=0;for(let[E,ee]of M)p>=E&&(L=ee);return p>1.6&&p<1.66&&(L=.35),p>3.1&&p<3.14&&(L=.5),L}var Ie=[{from:-99,id:0,sil:null},{from:8,id:1,sil:"sunset"},{from:12,id:2,sil:null},{from:16,id:3,sil:"city"},{from:23,id:5,sil:null},{from:36,id:2,sil:null},{from:40,id:4,sil:null},{from:44,id:3,sil:"city"},{from:48,id:1,sil:"sunset",dusk:1},{from:52,id:1,sil:"sunset",fin:1}],_t=[{at:7.75,to:8.1,seg:1,type:2},{at:11.7,to:12.25,seg:2,type:1},{at:15.8,to:16.2,seg:3,type:2},{at:35.6,to:36.2,seg:5,type:1},{at:39.7,to:40.2,seg:6,type:1},{at:43.7,to:44.2,seg:7,type:1},{at:47.7,to:48.2,seg:8,type:1},{at:51.6,to:52.1,seg:9,type:2}];function ft(n,r,p){let M=Ie[n];switch(n){case 0:{let L=.22*bt(r,.6,4.2)+Math.pow(h(r,6,7.95),2)*1.3+(p.gate?.12:0);return[p.gate?.34:r<0?C(0,.34,p.preroll):z.out(h(r,-.2,6)),1+.2*z.io(h(r,0,8)),L,0]}case 1:return M.fin?[C(.07,.025,z.io(h(r,52,64))),C(1.2,1,z.out(h(r,52,62))),.24,0]:M.dusk?[.012,C(1.12,1.04,h(r,48,52)),.62,C(.03,-.03,h(r,48,52))]:[.05,C(1.32,1,z.out(h(r,8,11.9))),0,C(-.06,.04,h(r,8,12))];case 2:return[2.4,C(1,1.12,h(r,12,16)),1,1];case 3:return[C(-.04,.03,z.io(h(r,16,23))),C(1.14,1,z.out(h(r,16,20))),C(0,.16,h(r,16,23)),1];case 4:{if(r<24)return[0,0,.5*Math.pow(h(r,23,24),2),0];let L=z.io(h(r,24,26.1)),E=C(1.1,.55,z.out(h(r,24,27)))*(1+.25*U(r,Math.floor(r),.5)*(r>28?1:0));return[C(.6,0,L),E,C(1,.38,z.out(h(r,24,28))),1]}case 5:return[1,C(1,1.08,h(r,36,40)),.85,.72];case 6:return[1.7,.3,.95,0];case 7:return[.02,1.04,C(.3,.5,h(r,44,48)),.85];default:return[0,1,0,0]}}function Kt(n={}){let r=zt(n.lang||document.documentElement.lang),p=pt[r],M=!!n.renderMode,L=!M&&(n.reducedMotion??matchMedia("(prefers-reduced-motion: reduce)").matches),E=document.createElement("div");E.setAttribute("data-cliko-intro",""),E.style.cssText="position:fixed;inset:0;z-index:2147483647;";let ee=E.attachShadow?E.attachShadow({mode:"open"}):E;ee.innerHTML=`<style>${Et}</style>${Mt(p)}`;let l=(o,c=ee)=>c.querySelector(o),T=(o,c=ee)=>[...c.querySelectorAll(o)],_=l(".ck"),Z=l("canvas.gl"),ce=l("canvas.sil"),G=l(".stage"),N={s1:l(".s1"),s2a:l(".s2a"),s2b:l(".s2b"),s2c:l(".s2c"),s3:l(".s3"),s4:l(".s4"),s5:l(".s5")},a={s1w:l(".s1w"),s1words:T(".s1l .w"),s1l:l(".s1l"),flare:l(".flare"),gta:l(".s2a .gta"),vi:l(".s2a .vi"),s2row:l(".s2a .row"),s2aa:l(".s2a .a"),is:l(".s2b .is"),here:l(".s2b .here"),s2brow:l(".s2b .row"),s2c:l(".s2c .a"),k:l(".s2c .k"),l1:l(".s2c .l1"),l2:l(".s2c .l2"),l2w:l(".s2c .l2w"),loc:l(".loc"),lt:l(".loc .lt"),l3:l(".l3"),s3t:l(".s3t"),s3w:T(".s3t .w"),ms:T(".m"),vis:T(".v"),pb:T(".pb b"),pbw:l(".pb"),l5:l(".l5"),t5:l(".t5"),t5c:T(".t5 .ch"),u5:l(".u5"),pk:l(".pk"),bars:T(".bar"),grain:l(".grain"),fade:l(".fade"),cta:l(".cta"),gate:l(".gate"),play:l(".play"),enter:l(".enter"),snd:l(".snd"),sl:l(".snd .sl"),skip:l(".skip"),prog:l(".prog"),progb:l(".prog b"),sr:l(".sr")},J=o=>({svg:l("svg",o),paths:T(".st path",o),dot:l(".dt",o),o:l(".o",o),spk:l(".spk",o)}),we=J(a.l3),ye=J(a.l5),S=a.ms.map(o=>({m:o,lab:l(".ml",o),lines:T(".ln>span",o),md:l(".md",o),car:l(".car",o)})),K={fr:l(".fr",a.vis[0]),tb:l(".tb",a.vis[0]),d:T(".d",a.vis[0]),url:l(".url",a.vis[0]),hero:l(".hero",a.vis[0]),h1:l(".h1",a.vis[0]),h2:l(".h2",a.vis[0]),bt:l(".bt",a.vis[0]),cd:T(".cd",a.vis[0]),cur:l(".cur",a.vis[0]),rip:l(".rip",a.vis[0]),bw:l(".bw",a.vis[0])},de={ph:l(".ph",a.vis[1]),scr:l(".scr",a.vis[1]),chips:T(".chip",a.vis[1]),rings:T(".ring",a.vis[1])},ze={cards:T(".cd3",a.vis[2])},le={cw:l(".cw",a.vis[3]),lines:T(".cl>span>span",a.vis[3]),car:l(".ccar",a.vis[3]),scan:l(".scan",a.vis[3]),tag:l(".tag",a.vis[3]),code:l(".code",a.vis[3])},Se=Rt(p),ve=Se.reduce((o,c)=>o+c,0),j=0,O=0,F=10,ie=!1,V=0,Y=1,se=1,te={},W=null,ae=null;function Fe(){j=_.clientWidth||innerWidth,O=_.clientHeight||innerHeight,ie=j/O<.82,F=ie?Math.min(j*.0116,O*.0098):Math.min(j*.01,O*.0178),V=!ie&&j/O>1.25?Math.max(0,Math.round((O-j/2.39)/2)):0,_.classList.toggle("pt",ie),A(_,"--u",F.toFixed(2)+"px"),Y=M?1:Math.min(devicePixelRatio||1,2);let o=M?n.glPixels||1e9:j*O>9e5&&!ie?135e4:62e4,c=Math.min(Y,Math.sqrt(o/(j*O)))*se;Z.width=Math.max(2,Math.round(j*c)),Z.height=Math.max(2,Math.round(O*c)),ce.width=Math.round(j*Y),ce.height=Math.round(O*Y),te.s2=te.s2b=te.s3=null,te.len=[we,ye].map(u=>u.paths.map(y=>y.getTotalLength?.()||100));for(let u of[we,ye])u.paths.forEach(y=>A(y,"stroke-dasharray","1 2"))}function Le(o){if(!te[o]){if(o==="s2"&&a.s2row.offsetWidth){let c=a.s2row;te.s2=[c.offsetWidth/2-(a.gta.offsetLeft+a.gta.offsetWidth/2),c.offsetHeight/2-(a.gta.offsetTop+a.gta.offsetHeight/2)]}else if(o==="s2b"&&a.s2brow.offsetWidth){let c=a.s2brow;te.s2b=[c.offsetWidth/2-(a.is.offsetLeft+a.is.offsetWidth/2),c.offsetHeight/2-(a.is.offsetTop+a.is.offsetHeight/2)]}else if(o==="s3"&&a.s3t.offsetWidth){let c=a.s3t.offsetWidth;te.s3=[0,...a.s3w.map(u=>(c-(u.offsetLeft+u.offsetWidth))/2)]}}}let v=[[25,25.9],[25.6,26.15],[26,26.45],[26.6,27],[27,27.35],[27.2,27.6]];function qe(o,c,u,y){let w=null;if(o.paths.forEach((I,Q)=>{let P=1;u==="reveal"&&(P=z.io(h(c,v[Q][0],v[Q][1]))),A(I,"stroke-dashoffset",(1-P).toFixed(4)),$(I,P>.002?1:0),u==="reveal"&&P>.01&&P<.99&&(w=[I,P,te.len[y][Q]])}),w){let I=w[0].getPointAtLength(w[1]*w[2]);o.spk.setAttribute("cx",I.x.toFixed(1)),o.spk.setAttribute("cy",I.y.toFixed(1)),o.spk.setAttribute("r",(11+4*Math.sin(c*40)).toFixed(1)),$(o.spk,1)}else $(o.spk,0);let x=u==="reveal"?z.back(h(c,26.5,26.85)):1;A(o.dot,"transform",`scale(${Math.max(0,x).toFixed(3)})`),A(o.dot,"transform-origin","179px 16px");let k=u==="reveal"?h(c,25.5,26.15):1;$(o.o,k);let B=u==="reveal"?C(1.3,1,z.out(h(c,25.5,26.7))):1;A(o.o,"transform",`scale(${B.toFixed(3)})`),A(o.o,"transform-origin","400px 96px")}let e=(o,c,u=1)=>{let y=(.35*c*F).toFixed(1),w=(1.5*c*F).toFixed(1),x=(.9*c*F).toFixed(1);return`drop-shadow(0 0 ${y}px rgba(255,${Math.round(C(220,111,u))},${Math.round(C(235,181,u))},.95)) drop-shadow(0 0 ${w}px rgba(255,46,136,${(.7*u+.25).toFixed(2)})) drop-shadow(0 0 ${x}px rgba(255,170,80,.35))`};function s(o,c,u){let y=0;for(let k=0;k<Ie.length;k++)c>=Ie[k].from&&(y=k);let w=null;for(let k of _t)c>=k.at&&c<k.to&&(w=k);let x={a:Ie[y].id,b:Ie[y].id,mix:0,tr:0,pa:ft(y,c,u),pb:[0,0,0,0],sa:y,sb:y};if(w){let k=w.seg-1,B=w.seg;x.sa=k,x.sb=B,x.a=Ie[k].id,x.b=Ie[B].id,x.pa=ft(k,c,u),x.pb=ft(B,c,u),x.mix=h(c,w.at,w.to),x.tr=w.type}return x}function f(o,c,u,y){let w=Ie[o];if(!w.sil)return null;let x=j/O,k=1,B=0,I=0,Q=0,P=1;if(w.id===1?(k=c[1],B=c[3]):w.id===3&&(k=c[1],B=-c[2]*k*.25,I=-c[0]*k),y.mix>0&&y.mix<1){let X=y.mix;if(y.tr===1){let D=Be(X);Q=u==="a"?D*x:D*x-x}else if(y.tr===2){k*=u==="a"?1/(1-.65*X):1/(1+.9*(1-X));let D=Be(he((X-.35)/.3));P=u==="a"?1-D:D}else P=u==="a"?1-X:X}return{layout:w.sil,zoom:k,panX:B,offX:Q,offY:I,alpha:P,fg:1.35,birds:w.fin?1:0,small:w.fin?.82:w.dusk?.9:1,color:w.dusk?"#06020a":"#0a0410"}}let i={gate:!1,preroll:0,exitK:0,exitFly:null};function d(o){let c=o/H,u={gate:i.gate,preroll:i.preroll},y=s(o,c,u),w=.011*U(c,8,.5)+.008*U(c,9,.45)+.018*U(c,24,.7)+.005*(U(c,28,.4)+U(c,29,.4)+U(c,30,.4))+.007*U(c,52,.6)+.004*U(c,64,.6),x=w*Math.sin(o*93),k=w*Math.cos(o*71),B=.55*U(c,8,.45)+.2*U(c,9,.35)+1*U(c,24,.8)+.12*(U(c,28,.3)+U(c,29,.3)+U(c,30,.3))+.5*U(c,52,.6)+.25*U(c,64,.6),I=.3;c<8?I=.28*h(c,1,7):c<23?I=.45:c<24?I=0:c<36?I=.32+.3*U(c,24,1.5):c<52?I=.22:I=.55;let Q=i.gate?.85:c<0?C(.85,.2,i.preroll):1,P=i.exitK>0?z.io(h(i.exitK,0,.6)):0;if(W&&W.draw({time:o+40,a:y.a,b:y.b,mix:y.mix,tr:y.tr,pa:y.pa,pb:y.pb,fx:[B,I,.62,Q],fx2:[P,.035,x,k],cen:m(c)}),ae){let D=[f(y.sa,y.pa,"a",y),y.sb!==y.sa?f(y.sb,y.pb,"b",y):null];if(D[0]||D[1]){for(let re of D)re&&(re.alpha*=1-P);ae.draw(o,D),i.silDirty=!0}else i.silDirty&&(ae.clear(),i.silDirty=!1)}A(G,"transform",`translate3d(${(-x*O).toFixed(1)}px,${(k*O).toFixed(1)}px,0)`);let X=Math.round(V*(1-z.io(h(c,52,54.5))));if(A(_,"--bh",X+"px"),A(_,"--ub",Math.max(14,Math.round(X/2-22))+"px"),A(a.grain,"transform",`translate3d(${Math.round(Ve(Math.floor(o*24))*60-30)}px,${Math.round(Ve(Math.floor(o*24)+7)*60-30)}px,0)`),i.gate){for(let D in N)Re(N[D],!1);Re(a.loc,!1);return}t(c),R(c),oe(c),ne(c),$e(c),M||A(a.progb,"transform",`scaleX(${he(o/(64*H)).toFixed(4)})`)}function m(o){let c=(ie?66:54)*F,u=c*148/480,y=b(o),w=(400/480-.5)*c,x=(96/148-.5)*u+y,k=z.io(h(o,24.4,26));return[C(0,w/O,k),C(.03,-x/O,k)]}let b=o=>C(0,-(ie?8:5.6)*F,z.io(h(o,27.6,28.4)));function t(o){let c=o<8.1;if(Re(N.s1,c),!c)return;let u=[2,2.75,3.75,4.5];a.s1words.forEach((x,k)=>{let B=z.out(h(o,u[k]-.15,u[k]+.95));$(x,B),ge(x,0,(1-B)*F*1.4,1+(1-B)*.08),Ze(x,(1-B)*16)});let y=1+.07*h(o,2,7.2)+.9*z.inExpo(h(o,7.1,8.05));Pe(a.s1w,0,0,y),A(a.s1l,"letter-spacing",C(.3,.05,z.out(h(o,1.6,7))).toFixed(3)+"em"),$(a.s1w,1-h(o,7.7,8.05)),Ke(a.s1w,(h(o,5.8,8)*1.2+U(o,4.5,.4)*.5)*F*.6);let w=z.out(h(o,.7,2.8));A(a.flare,"transform",`scaleX(${(w*(1+.25*U(o,4.5,.6))).toFixed(3)})`),$(a.flare,w*(1-h(o,6.8,7.8))*(.75+.25*Math.sin(o*3)))}let g=(o,c,u,y=2.6,w=20)=>{let x=z.expo(h(c,u,u+.42));return $(o,c<u?0:he(x*3)),Ze(o,c<u?0:(1-x)*w),{k:x,s:C(y,1,x)}};function R(o){let c=o>=7.9&&o<12.3;if(Re(N.s2a,c),c){Le("s2");let x=g(a.gta,o,8),k=g(a.vi,o,9),B=z.expo(h(o,9,9.4)),I=te.s2||[0,0];ge(a.gta,I[0]*(1-B),I[1]*(1-B),x.s),ge(a.vi,0,0,k.s);let Q=1+.05*h(o,8,11.7),P=z.inExpo(h(o,11.55,12.2));Pe(a.s2aa,-Be(h(o,11.7,12.25))*j*.35,0,Q*(1+2.6*P)),$(a.s2aa,1-h(o,11.85,12.2)),Ke(a.s2row,(U(o,8,.7)+U(o,9,.7)+1.4*P)*F*.7,"drop-shadow(0 0 "+(1.4*F).toFixed(1)+"px rgba(255,61,139,.5))");let X=h(o,10,11.4);for(let D of[a.gta,a.vi])A(D.lastChild,"background-position",C(130,-30,X).toFixed(1)+"% 0")}let u=o>=12.15&&o<16.25;if(Re(N.s2b,u),u){let x=et(o,12.5),k=et(o,13);$(a.is.lastChild,x),$(a.here.lastChild,k),Le("s2b");let B=z.expo(h(o,13,13.35)),I=te.s2b||[0,0];ge(a.is,I[0]*(1-B),I[1]*(1-B),1),$(a.here.firstChild,h(o,12.6,13)),$(a.is.firstChild,h(o,12.2,12.5));let Q=z.inExpo(h(o,15.6,16.2));Pe(a.s2brow.parentNode,0,0,(1+.05*h(o,12.3,15.8))*(1+3*Q)),$(a.s2brow.parentNode,1-h(o,15.95,16.2))}let y=o>=16&&o<23;if(Re(N.s2c,y),y){let x=z.out(h(o,16.3,17.2));$(a.k,x),A(a.k,"letter-spacing",C(.8,.42,x).toFixed(3)+"em");let k=z.reveal(h(o,16.05,16.9));ge(a.l1,0,(1-k)*F*6,C(.86,1,k)),$(a.l1,k),Ze(a.l1,(1-k)*14),$(a.l2w.lastChild,et(o,16.6)),$(a.l2w.firstChild,h(o,16.3,16.6));let B=(h(o,18,19.4)+h(o,20,21.4))%1.0001;A(a.l1.querySelector(".shine"),"background-position",C(130,-30,B).toFixed(1)+"% 0");let I=U(o,22,.25)+U(o,22.25,.25)+U(o,22.5,.25)+U(o,22.75,.25);Pe(a.s2c,0,0,(1+.06*h(o,16,22))*(1+.045*I)),Ke(a.l1,I*F*.8,"drop-shadow(0 0 "+(1.4*F).toFixed(1)+"px rgba(255,61,139,.5))")}let w=o>=8.4&&o<23;if(Re(a.loc,w),w){let x=o<15.8?p.loc1:p.loc2,k=o<15.8?8.6:16.6,B=Math.floor(he((o-k)/1.1)*x.length);a.lt.__t!==B+x&&(a.lt.__t=B+x,a.lt.textContent=x.slice(0,B)),$(a.loc,(1-h(o,15.2,15.8))*h(o,8.4,8.8)+h(o,16.3,16.6)*(1-h(o,22.6,23))),$(a.loc.firstChild,Math.floor(o*2)%2?1:.25)}}function oe(o){let c=o>=24&&o<36.3;if(Re(N.s3,c),!c)return;qe(we,o,"reveal",0);let u=b(o),y=1+.05*h(o,28,35.6),w=Be(h(o,35.6,36.2)),x=-w*j;Pe(a.l3,x,u,y);let k=1+.9*U(o,27.65,1.2)+.25*(o>28?U(o,Math.floor(o),.5):0)+.6*h(o,24.8,25.6)*(1-h(o,27.6,28.5)),B=1-.55*h(o,27.6,28.6);A(a.l3,"filter",e(a.l3,k,B)+(w>.02?` blur(${(Math.sin(w*Math.PI)*14).toFixed(1)}px)`:""));let I=(ie?13:9.6)*F,Q=0;Le("s3"),te.s3&&(Q=te.s3[1],[29,30].forEach((P,X)=>Q=C(Q,te.s3[X+2],z.expo(h(o,P,P+.4))))),Pe(a.s3t,x+Q,I,y),[28,29,30].forEach((P,X)=>{let D=g(a.s3w[X],o,P,1.7,12);ge(a.s3w[X],0,0,D.s)}),Ke(a.s3t,(U(o,28,.5)+U(o,29,.5)+U(o,30,.5))*F*.6+Math.sin(w*Math.PI)*F,"drop-shadow(0 0 "+(1.4*F).toFixed(1)+"px rgba(255,61,139,.5))")}function ne(o){let c=o>=35.6&&o<52.15;if(Re(N.s4,c),!c)return;let u=h(o,51.6,52.1);for(let y=0;y<4;y++){let w=36+4*y,x=S[y],k=a.vis[y],B=o>=w-.45&&o<w+4.25;if(Re(x.m,B,"block"),Re(k,B,"block"),!B)continue;let I=1-Be(h(o,w-.4,w+.2)),Q=y<3?Be(h(o,w+3.7,w+4.2)):0,P=(I-Q)*j,X=1+1.6*z.inExpo(u),D=1-h(o,51.75,52.1);A(x.m,"transform",(ie?"":"translateY(-50%) ")+Ge(P,0,X)),$(x.m,D),$(k,D);let re=Math.sin(Math.PI*Math.max(I,Q))*10;Ze(x.m,re);let ke=z.out(h(o,w+.05,w+.6));$(x.lab,ke),ge(x.lab,(1-ke)*-F*3,0),x.lines.forEach((fe,me)=>{if(y===0){let xe=z.reveal(h(o,w+.15+me*.22,w+1+me*.22));ge(fe,0,(1-xe)*fe.offsetHeight*1.1),$(fe,1)}else if(y===1){let xe=h(o,w+me*.2,w+1.1+me*.2),Te=Math.floor(o*8+me*3),Me=(1-xe)*(xe>0?1:0),Ce=(Ve(Te)-.5)*F*3*Me,st=(Ve(Te+9)-.5)*24*Me;$(fe,xe<=0?0:Ve(Te+4)<.25*Me?.2:1),ge(fe,Ce,0,1,` skewX(${st.toFixed(1)}deg)`),Ke(fe,Me*F*1.4+U(o,w+1+me,.3)*F*.6,me===1?`drop-shadow(0 0 ${(.9*F).toFixed(1)}px rgba(255,61,139,.35))`:"")}else if(y===2){let xe=z.out(h(o,w+.2+me*.25,w+1.1+me*.25));$(fe,xe>0?1:0),A(fe,"transform",`rotateX(${((1-xe)*-100).toFixed(1)}deg) translateZ(0)`)}else{let xe=fe.textContent.length,Te=h(o,w+.15+me*.65,w+.75+me*.65),Me=Math.floor(Te*xe)/xe;if(A(fe,"clip-path",`inset(-10% ${((1-Me)*100).toFixed(1)}% -20% 0)`),$(fe,1),(me===0&&Te<1||me===1&&Te>0||me===1&&Te>=1)&&x.car){let Ce=fe.offsetLeft+fe.offsetWidth*Me,st=fe.parentNode.offsetTop;A(x.car,"left",Ce.toFixed(1)+"px"),A(x.car,"top",st.toFixed(1)+"px"),A(x.car,"height",fe.offsetHeight+"px"),$(x.car,me===1&&Te>=1?Math.floor(o*2)%2?1:0:1)}}});let Ee=z.out(h(o,w+1.1,w+1.9));$(x.md,Ee),ge(x.md,0,(1-Ee)*F*1.5),q(y,o,w,P*(ie?1:1.15),X,re)}$(a.pbw,h(o,36,36.6)*(1-h(o,51.4,51.9))),a.pb.forEach((y,w)=>A(y,"transform",`scaleX(${he(h(o,36+4*w,40+4*w)).toFixed(3)})`))}function q(o,c,u,y=0,w=1,x=0){let k=a.vis[o],B=`translate(-50%,-50%) translate3d(${y.toFixed(1)}px,0,0) scale(${w.toFixed(4)}) `;if(o!==1&&Ze(k,x),o===0){let I=C(-24,-10,z.out(h(c,u,u+4)));A(K.bw,"transform",`rotateY(${I.toFixed(2)}deg) rotateX(${C(14,7,h(c,u,u+4)).toFixed(2)}deg)`),A(k,"transform",B+Ge(0,0,C(.92,1,z.out(h(c,u,u+1.5))))),A(K.fr,"stroke-dashoffset",(1-z.io(h(c,u,u+.8))).toFixed(4)),A(K.tb,"stroke-dashoffset",(1-z.io(h(c,u+.5,u+.8))).toFixed(4)),$(l(".bg",k),h(c,u+.3,u+.9)),K.d.forEach((Te,Me)=>{let Ce=z.back(h(c,u+.8+Me*.1,u+1.05+Me*.1));ge(Te,0,0,Math.max(0,Ce))});let Q=z.out(h(c,u+.9,u+1.3));A(K.url,"transform",`scaleX(${Q.toFixed(3)})`);let P=z.out(h(c,u+1.25,u+1.6));A(K.hero,"transform",`scaleY(${P.toFixed(3)})`),$(K.hero,P>0?1:0),A(K.h1,"transform",`scaleX(${z.out(h(c,u+1.5,u+1.85)).toFixed(3)})`),A(K.h2,"transform",`scaleX(${z.out(h(c,u+1.6,u+1.95)).toFixed(3)})`);let X=z.back(h(c,u+2,u+2.3));ge(K.bt,0,0,Math.max(0,X));let D=U(c,u+3.5,.5);A(K.bt,"background",D>.05?"#ffc46b":"#0b1020"),K.cd.forEach((Te,Me)=>{let Ce=z.back(h(c,u+2.5+Me*.25,u+2.85+Me*.25));$(Te,he(Ce*2)),ge(Te,0,(1-he(Ce))*F*3,C(.85,1,he(Ce)))});let re=z.io(h(c,u+2.3,u+3.4)),ke=K.bw.offsetWidth,Ee=K.bw.offsetHeight,fe=C(ke*.92,ke*.2,re),me=C(Ee*1.05,Ee*.47,re);$(K.cur,h(c,u+2.2,u+2.5)),ge(K.cur,fe,me,1-.15*U(c,u+3.5,.3));let xe=h(c,u+3.5,u+4.1);$(K.rip,xe>0?1-xe:0),ge(K.rip,0,0,.2+xe*2.6)}else if(o===1){let I=z.out(h(c,u,u+1.2)),Q=Math.floor(c*8),P=(1-h(c,u,u+.8))*(c>=u?1:0);A(k,"transform",B+Ge((Ve(Q)-.5)*F*2.5*P,0,C(.9,1,I))),A(de.ph,"transform",`rotateY(${C(38,-10,I).toFixed(1)}deg) rotateZ(${C(-8,4,I).toFixed(1)}deg)`),Ke(de.ph,P*F*1.6),A(de.scr,"background-position",`0 ${(50+50*Math.sin(c*.9)).toFixed(1)}%`),de.chips.forEach((X,D)=>{let re=z.back(h(c,u+1+D,u+1.35+D));$(X,he(re*3)),ge(X,0,(1-he(re))*F*2,C(.6,1,re))}),de.rings.forEach((X,D)=>{let re=h(c,u+1+D,u+1.9+D),ke=de.ph,Ee=ke.offsetLeft+ke.offsetWidth*.5,fe=ke.offsetTop+ke.offsetHeight*(.53+D*.12);A(X,"left",Ee.toFixed(0)+"px"),A(X,"top",fe.toFixed(0)+"px"),$(X,re>0&&re<1?1-re:0),ge(X,0,0,.2+re*2.4)})}else if(o===2){A(k,"transform",B+Ge(0,Math.sin(c*.8)*F*.4,1));let I=ie?22:16.5;ze.cards.forEach((Q,P)=>{let X=z.back(h(c,u+.5+P*.5,u+1.1+P*.5)),D=he(X),re=(P-1)*I*F*D,ke=C(110,(P-1)*-16,X),Ee=Math.sin(c*1.1+P*1.7)*F*.5*D;A(Q,"transform",`translate3d(${re.toFixed(1)}px,${(Ee+(P===1?-F*1.2:0)).toFixed(1)}px,${(P===1?F*4:0).toFixed(1)}px) rotateY(${ke.toFixed(1)}deg)`),$(Q,he(X*2))})}else{let I=z.out(h(c,u,u+.6));A(k,"transform",B+Ge(0,(1-I)*F*3,C(.94,1,I))),A(le.cw,"transform",`rotateX(${C(22,6,I).toFixed(1)}deg) rotateY(${C(-14,-6,h(c,u,u+4)).toFixed(1)}deg)`),$(k,I);let Q=Math.floor(h(c,u+.3,u+2.95)*ve),P=0,X=0;le.lines.forEach((ke,Ee)=>{let fe=he(Q-P,0,Se[Ee]);A(ke,"width",fe+"ch"),Q>=P&&(X=Ee),P+=Se[Ee]});let D=le.lines[X];D&&(A(le.car,"left",(D.offsetLeft+D.offsetWidth).toFixed(0)+"px"),A(le.car,"top",(D.parentNode.offsetTop+D.offsetTop+2).toFixed(0)+"px"),$(le.car,Q>=ve?Math.floor(c*2)%2?1:0:1)),$(le.tag,et(c,u+.6)),ge(le.tag,0,0,1+.08*U(c,Math.floor(c),.4));let re=h(c,u+3,u+3.7);$(le.scan,re>0&&re<1?1:0),ge(le.scan,0,re*le.code.offsetHeight)}}function $e(o){let c=o>=51.8;if(Re(N.s5,c),!c)return;let u=h(o,51.6,52.1),y=1/(1+.9*(1-Be(u))),w=Be(he((u-.35)/.3)),x=1+.035*h(o,56,70),k=ie?{lg:-25,t5:1,u5:17,cta:i.poster?39:34,pk:-42}:{lg:-13,t5:3.6,u5:10.4,cta:16.8,pk:-23.5};qe(ye,o,"full",1);let B=z.out(h(o,52,54.5)),I=.75+.5*U(o,52,1.5)+.15*(o>52&&o<64?U(o,Math.floor(o),.5):0)-.35*i.exitK;Pe(a.l5,0,k.lg*F*x,y*C(.9,1,B)*x),$(a.l5,w),A(a.l5,"filter",e(a.l5,Math.max(0,I),.55)+(B<.95?` blur(${((1-z.out(h(o,52,53)))*10).toFixed(1)}px)`:"")),Pe(a.t5,0,k.t5*F*x,y*x),$(a.t5,w),a.t5c.forEach((P,X)=>{let D=z.out(h(o,54+X*.07,54.9+X*.07));$(P,D),A(P,"transform",`translate3d(0,${((1-D)*.5).toFixed(3)}em,0) rotateX(${((1-D)*-70).toFixed(1)}deg)`)});let Q=z.out(h(o,56,57.2));if(Pe(a.u5,0,k.u5*F*x,y*x),$(a.u5,Q*w),A(a.u5,"letter-spacing",C(.7,.24,Q).toFixed(3)+"em"),i.poster&&(A(a.pk,"display","block"),Pe(a.pk,0,k.pk*F,1)),!M){let P=i.poster?1:z.out(h(o,58,59.2));Re(a.cta,P>.001,"flex"),a.cta.hidden=!1,A(a.cta,"transform","translate(-50%,-50%) "+Ge(0,k.cta*F+(1-P)*F*2,1)),$(a.cta,P*(1-i.exitK*3)),A(a.cta,"pointer-events",P>.5?"auto":"none")}}let pe=null,Ye=0,Ae=0,Xe=0,Ue=!1,ot=!1,Ne=n.sound!==!1,nt=!1,Oe={acc:0,n:0,slow:0};function De(){return performance.now()/1e3}function Ft(){if(pe&&!pe.muted){let o=pe.time();Math.abs(o-Ae)>.08?Ae=o:Ae+=(o-Ae)*.2}return Ae}function Qe(){Ye=requestAnimationFrame(Qe);let o=De(),c=o-Xe;if(Xe=o,c>.1&&(c=.1),ot)return;if(i.gate){Ae+=c*.35,d(Ae);return}if(i.prerollStart!=null)if(i.preroll=he((o-i.prerollStart)/.6),i.preroll>=1)i.prerollStart=null,Ae=0;else{d(-.6+i.preroll*.6);return}Ae+=c;let u=Ft();if(Oe.acc+=c,Oe.n++,Oe.n>=45&&(Oe.acc/Oe.n>.026&&se>.45&&(se*=.8,Fe()),Oe.acc=0,Oe.n=0),i.exitStart!=null){i.exitK=he((o-i.exitStart)/i.exitDur),Vt(u),i.exitK>=1&&Ct();return}d(u),u>xt&&!n.loop&&We("auto")}function Vt(o){d(o);let c=i.exitK;if(i.exitFly){let u=i.exitFly,y=z.io(h(c,.08,.82)),w=C(0,u.dx,y),x=C(0,u.dy,y),k=C(1,u.s,y);A(a.l5,"transform",`translate(-50%,-50%) translate3d(${(u.x0+w).toFixed(1)}px,${(u.y0+x).toFixed(1)}px,0) scale(${(u.s0*k).toFixed(4)})`),A(a.l5,"filter",e(a.l5,C(.7,0,y),.55)),$(a.l5,1-h(c,.88,1));for(let B of[a.t5,a.u5,a.cta,a.pk])$(B,1-h(c,0,.3))}else $(G,1-h(c,0,.45));$(a.grain,1-c);for(let u of a.bars)$(u,1-h(c,0,.5));A(E,"opacity",(1-h(c,i.exitFly?.72:.55,1)).toFixed(3))}let He={inert:[],overflow:"",focus:null},qt=o=>{o.stopPropagation(),o.cancelable&&o.type!=="keydown"&&o.preventDefault()},dt=o=>{if(!E.isConnected)return;let c=o.key;c==="Escape"?(o.preventDefault(),We("skip")):(c==="Enter"||c===" ")&&i.gate&&!ee.activeElement?(o.preventDefault(),Je(!0)):c==="m"||c==="M"?mt():[" ","ArrowDown","ArrowUp","PageDown","PageUp","Home","End"].includes(c)&&!(ee.activeElement&&ee.activeElement.tagName==="BUTTON"&&(c===" "||c==="Enter"))&&o.preventDefault()};function Pt(){He.focus=document.activeElement,He.overflow=document.documentElement.style.overflow,document.documentElement.style.overflow="hidden";for(let o of document.body.children)o===E||o.tagName==="SCRIPT"||o.tagName==="STYLE"||(He.inert.push([o,o.inert]),o.inert=!0);for(let o of["wheel","touchmove","touchstart","pointerdown","mousedown"])E.addEventListener(o,qt,{passive:!1});addEventListener("keydown",dt,!0)}function $t(){document.documentElement.style.overflow=He.overflow;for(let[o,c]of He.inert)o.inert=c;He.inert=[],removeEventListener("keydown",dt,!0);try{He.focus?.focus?.({preventScroll:!0})}catch{}}let ut=()=>{Fe(),i.poster&&d(i.posterT)},ht=()=>{pe&&(document.hidden?(ot=!0,pe.ctx.suspend?.()):(pe.ctx.resume?.(),ot=!1,Xe=De()))};function gt(){a.snd.setAttribute("aria-pressed",String(Ne)),a.sl.textContent=Ne?p.soundOn:p.soundOff}function mt(){if(!(i.gate||nt)){if(Ne=!Ne,Ne&&!pe)try{pe=new _e,pe.start(Math.max(0,Ae))}catch{pe=null}else pe&&pe.setMuted(!Ne);gt()}}function Je(o){if(!i.gate)return;i.gate=!1,Ne=o,a.gate.classList.add("off"),setTimeout(()=>a.gate.hidden=!0,600);for(let u of[a.snd,a.skip,a.prog])u.hidden=!1;if(gt(),a.skip.focus({preventScroll:!0}),a.sr.textContent=p.label,o)try{pe=new _e,pe.ctx.resume?.(),pe.start(0,.6)}catch(u){console.warn("[cliko-intro] audio indisponible",u),pe=null}let c=Math.max(0,+n.startAt||0);if(c>0){Ae=c,i.prerollStart=null,pe&&(pe.close(),pe=new _e,pe.start(c));return}i.prerollStart=De(),i.preroll=0}function We(o="skip",c){if(nt)return;nt=!0,Lt(),pe?.fadeOut(.9);let u=Ae,y=u/H,w=[...document.querySelectorAll('svg[aria-label="Cliko"], [data-cliko-logo]')].find(x=>{let k=x.getBoundingClientRect();return k.width>10&&k.top>=-2&&k.top<innerHeight/2});if(i.exitFly=null,w&&y>=54&&!i.gate){let x=w.getBoundingClientRect(),k=a.l5.getBoundingClientRect(),B=/translate3d\(([-\d.]+)px,\s*([-\d.]+)px,0\) scale\(([-\d.]+)\)/.exec(a.l5.style.transform)||[0,0,0,1],I=+B[1],Q=+B[2],P=+B[3];i.exitFly={x0:I,y0:Q,s0:P,dx:x.left+x.width/2-(k.left+k.width/2),dy:x.top+x.height/2-(k.top+k.height/2),s:x.width/k.width}}i.exitDur=i.exitFly?1.25:o==="enter"?.55:.8,i.exitStart=De(),i.then=c,i.gate&&a.gate.classList.add("off"),a.cta.style.pointerEvents="none",(i.poster||!Ue)&&(Ue=!0,Xe=De(),Ye=requestAnimationFrame(Qe))}function Ct(){cancelAnimationFrame(Ye),Ue=!1,removeEventListener("resize",ut),document.removeEventListener("visibilitychange",ht),E.remove(),$t(),document.documentElement.classList.remove("ck-intro-pending"),dispatchEvent(new CustomEvent("cliko-intro:exit")),n.onExit?.(),i.then?.()}function Lt(){try{(n.frequency==="once"?localStorage:sessionStorage).setItem(St,String(Date.now()))}catch{}}let Bt=()=>We("quote",()=>{let o=n.contactHref||"#contact",c=o.startsWith("#")?document.querySelector(o):null;c?c.scrollIntoView({behavior:"smooth",block:"start"}):location.href=o});function It(){document.body.appendChild(E),document.documentElement.classList.remove("ck-intro-pending");try{W=yt(Z,M)}catch{W=null}if(W||_.classList.add("nogl"),ae=kt(ce),Fe(),addEventListener("resize",ut),M){for(let o of[a.gate,a.snd,a.skip,a.prog,a.cta])o.hidden=!0;return je}if(Pt(),document.addEventListener("visibilitychange",ht),a.play.addEventListener("click",()=>Je(!0)),a.enter.addEventListener("click",()=>We("enter")),a.skip.addEventListener("click",()=>We("skip")),a.snd.addEventListener("click",mt),l(".go-site").addEventListener("click",()=>We("site")),l(".go-quote").addEventListener("click",Bt),L){i.poster=!0,i.posterT=66*H,a.gate.hidden=!0,a.cta.hidden=!1;let o=document.createElement("button");return o.className="btn sec",o.textContent=p.replay,o.addEventListener("click",()=>{i.poster=!1,A(a.pk,"display","none"),o.remove(),i.gate=!0,a.cta.hidden=!0,Je(!0),Ue=!0,Xe=De(),Ye=requestAnimationFrame(Qe)}),a.cta.appendChild(o),d(i.posterT),l(".go-site").focus({preventScroll:!0}),je}return n.autoplay==="muted"?(i.gate=!0,Je(!1)):(i.gate=!0,a.gate.hidden=!1,a.play.focus({preventScroll:!0})),Ue=!0,Xe=De(),Ye=requestAnimationFrame(Qe),je}let je={mount:It,exit:We,seek(o){i.gate=!1,d(o)},gate(){i.gate=!0,d(0)},host:E,get time(){return Ae}};return je}function Yt(n={}){let r=location.search;if(/[?&]nointro\b/.test(r))return!1;if(/[?&]intro\b/.test(r)||n.frequency==="always"||n.force)return!0;if(navigator.connection?.saveData||/bot|crawl|spider|slurp/i.test(navigator.userAgent)&&!n.allowBots)return!1;try{return!(n.frequency==="once"?localStorage:sessionStorage).getItem(St)}catch{return!0}}var tt=null;function Ut(n={}){return tt?.host?.isConnected?tt:!n.renderMode&&!Yt(n)?(document.documentElement.classList.remove("ck-intro-pending"),null):(tt=Kt(n).mount(),tt)}function go(n={}){return Ut({...n,force:!0})}export{Kt as createIntro,Ut as mountClikoIntro,go as play,Yt as shouldShow};
