// Feuille de style de l'intro, isolée dans un Shadow DOM : rien ne fuit vers le site, rien du site ne la casse.
// Polices : celles déjà chargées par cliko.be (variables next/font), avec repli sur les noms de famille.
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export const CSS = /* css */ `
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

/* ——— Matières typographiques ——— */
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

/* ——— Scène 1 ——— */
.s1l{display:flex;flex-wrap:wrap;justify-content:center;gap:0 .3em;font-weight:800;text-transform:uppercase;font-size:calc(var(--u)*7.2);letter-spacing:.04em;line-height:1;
  color:#fff;text-shadow:0 0 .25em rgba(255,80,160,.6),0 0 .9em rgba(255,120,60,.35);white-space:nowrap}
.flare{position:absolute;left:50%;top:calc(50% + var(--u)*6.4);width:calc(var(--u)*86);height:2px;margin-left:calc(var(--u)*-43);
  background:linear-gradient(90deg,transparent,rgba(255,120,190,.85) 30%,#fff 50%,rgba(255,170,90,.85) 70%,transparent);box-shadow:0 0 14px rgba(255,90,160,.9),0 0 40px rgba(255,140,60,.5)}

/* ——— Scène 2 ——— */
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

/* ——— Logo ——— */
.logo{display:block;width:100%;height:auto;overflow:visible}
.logo .st path{fill:none;stroke-width:22;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 2}
.logo .o{fill:#ffc46b}
.logo .dt{fill:#fff}
.logo .spk{fill:#fff}
.lw{position:absolute;left:50%;top:50%;will-change:transform,opacity,filter}
.s3 .lw{width:calc(var(--u)*54)}
.s3t{position:absolute;left:50%;top:50%;width:max-content;font-size:calc(var(--u)*9.4);gap:.24em}

/* ——— Scène 4 ——— */
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

/* v2 téléphone */
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

/* ——— Scène 5 ——— */
.s5 .lw{width:calc(var(--u)*40)}
.t5{position:absolute;left:50%;top:50%;width:max-content;display:flex;flex-wrap:wrap;justify-content:center;font-size:calc(var(--u)*6.2);font-weight:900;text-transform:uppercase;letter-spacing:-.03em;line-height:.95;white-space:nowrap}
.t5 .ch{display:inline-block;will-change:transform,opacity}
.t5 .sp{display:inline-block;width:.26em}
.t5 .br{display:none;flex-basis:100%;height:0}
.u5{position:absolute;left:50%;top:50%;width:max-content;text-shadow:0 1px 14px rgba(20,0,30,.9);display:flex;align-items:center;gap:.7em;font-size:max(13px,calc(var(--u)*1.9));color:#f2f3fa;letter-spacing:.24em;text-transform:lowercase}
.u5 i{width:.55em;height:.55em;border-radius:50%;background:#ffc46b;box-shadow:0 0 14px rgba(255,196,107,.95)}
.pk{position:absolute;left:50%;top:50%;width:max-content;font-size:max(11px,calc(var(--u)*1.35));color:#ffd48f;letter-spacing:.34em;white-space:nowrap;display:none}
.cta{position:absolute;left:50%;top:50%;width:max-content;display:flex;gap:12px;flex-wrap:wrap;justify-content:center}

/* ——— Boutons (mêmes codes que cliko.be) ——— */
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;-webkit-appearance:none;appearance:none}
button:focus-visible{outline:2px solid #ffc46b;outline-offset:3px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.6em;min-height:48px;padding:0 1.6em;border-radius:999px;font-weight:600;font-size:max(15px,calc(var(--u)*1.25));letter-spacing:-.005em;white-space:nowrap;
  transition:transform .3s cubic-bezier(.4,0,.2,1),background-color .3s,box-shadow .3s}
.btn:active{transform:translateY(1px) scale(.985)}
.btn.pri{background:#ffc46b;color:#0b1020;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 10px 34px -10px rgba(255,196,107,.85)}
.btn.pri:hover{background:#ffd48f}
.btn.sec{background:rgba(242,243,250,.07);color:#f2f3fa;border:1px solid rgba(185,196,240,.24);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.btn.sec:hover{background:rgba(242,243,250,.12)}

/* ——— Interface pendant la lecture ——— */
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

/* ——— Écran de lancement ——— */
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

/* ——— Portrait (smartphones) ——— */
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
`;
