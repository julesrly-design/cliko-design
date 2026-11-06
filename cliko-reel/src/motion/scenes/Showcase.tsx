import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { B, EASE, FONT } from "../../brand";
import { CL, EXPO, Tag, ramp } from "../kit";
import { ComposerBar, Typed } from "./Brief";
import { M } from "../timeline";
import { SoberSite } from "./SoberSite";

// ------------------------------------------------------------------------------------------------
// Tunnel de code : des lignes filent vers la caméra en profondeur (flou de profondeur de champ).
const CODE = [
  `<Site commerce="Forno Nero" />`,
  `const langues = ["fr", "nl", "en"];`,
  `hebergement: "inclus",`,
  `<Hero titre="Le feu fait tout le travail." />`,
  `mobile: { parfait: true },`,
  `--accent: #ffc46b;`,
  `<Bouton action="commander" />`,
  `export default function Accueil() {`,
  `seo: { ville: "Bruxelles" },`,
  `miseAJour: "continue",`,
  `<Carte plats={menu} />`,
  `return <Page style={vous} />;`,
  `fait: "sur-mesure",`,
  `<Reservation jours={7} />`,
  `contact: "Jules & Louis",`,
  `import { Cliko } from "cliko.be";`,
  `<Galerie photos={vraies} />`,
  `vitesse: "instantanee",`,
];

const tokenize = (s: string) => {
  const out: [string, string][] = [];
  const re = /("[^"]*"|#[0-9a-f]{6}|<\/?[A-Z]\w*|\/>|\b(?:const|export|default|function|return|import|from|true)\b|[{}()[\];,=<>:.])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push([s.slice(last, m.index), B.text]);
    const t = m[0];
    const c = t.startsWith('"') || t.startsWith("#") ? B.accent : t.startsWith("<") || t === "/>" ? "#9db4ff" : /^[a-z]/.test(t) ? "#ff9f6e" : "rgba(242,243,250,.45)";
    out.push([t, c]);
    last = m.index + t.length;
  }
  if (last < s.length) out.push([s.slice(last), B.text]);
  return out;
};

const CodeTunnel: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const f = useCurrentFrame();
  if (f < from - 2 || f > to + 4) return null;
  const fade = ramp(f, to - 10, to + 2, (t) => t);
  return (
    <AbsoluteFill style={{ perspective: 900, perspectiveOrigin: "50% 45%" }}>
      {CODE.map((line, i) => {
        const z0 = -2600 - random(`z${i}`) * 2200;
        const speed = 95 + random(`v${i}`) * 50;
        const z = z0 + (f - from + 10) * speed;
        if (z > 850 || z < -4800) return null;
        const x = 60 + random(`x${i}`) * 700 - (random(`s${i}`) > 0.5 ? 380 : 0);
        const y = 260 + random(`y${i}`) * 1400;
        const near = Math.max(0, z) / 140;
        const far = Math.max(0, -z - 2400) / 600;
        const op = Math.min(1, (z + 4400) / 900) * (1 - Math.max(0, (z - 500) / 350)) * (1 - fade);
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, whiteSpace: "nowrap", fontFamily: FONT.mono, fontSize: 48, fontWeight: 600,
            transform: `translateZ(${z}px) rotateY(${(x - 300) * -0.02}deg)`, opacity: op, filter: `blur(${near + far}px)`,
            textShadow: "0 0 22px rgba(255,170,90,.55), 0 2px 8px rgba(0,0,0,.6)",
          }}>
            {tokenize(line).map(([t, c], k) => <span key={k} style={{ color: c }}>{t}</span>)}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------------------------------------
// Carte « site » en 3D : maquette fil de fer qui s'assemble, balayage qui révèle la vraie capture,
// puis bascule d'un style à l'autre.
export const CARD = { w: 560, h: 876, x: 540, y: 790, r: 54 };
const BLOCKS = [
  { x: 36, y: 44, w: 190, h: 34, r: 10 },
  { x: 380, y: 40, w: 144, h: 42, r: 21 },
  { x: 36, y: 128, w: 460, h: 46, r: 12 },
  { x: 36, y: 188, w: 320, h: 46, r: 12 },
  { x: 70, y: 290, w: 420, h: 300, r: 28, img: true },
  { x: 36, y: 630, w: 488, h: 96, r: 22 },
  { x: 36, y: 760, w: 230, h: 70, r: 35, fill: true },
];
const SCREENS = [
  { src: "motion/forno-nero.png", name: "Forno Nero", scroll: 0 },
  { src: "", name: "Forno Nero, version sobre", scroll: 0 },
  { src: "motion/maison-celest.png", name: "Maison Célest", scroll: 220 },
];

const flipAngle = (f: number, at: number) => {
  const p = (f - at) / 14;
  if (p <= 0 || p >= 1) return 0;
  return p < 0.5 ? 90 * EXPO.in(p / 0.5) : -90 * (1 - EXPO.out((p - 0.5) / 0.5));
};

export const Showcase: React.FC = () => {
  const f = useCurrentFrame();
  const { drop, scan } = M;
  const S = M.styles;

  const screen = f < S.flip1 + 7 ? 0 : f < S.flip2 + 7 ? 1 : 2;
  const flip = flipAngle(f, S.flip1) + flipAngle(f, S.flip2);
  const flipBlur = Math.abs(flip) / 90 * 18;

  const cardIn = EXPO.out(ramp(f, drop + 4, drop + 26, (t) => t));
  const exit = ramp(f, S.out, M.light.from, EXPO.in);
  const rotY = interpolate(f, [drop, M.light.from], [-26, 16], CL) + flip;
  const rotX = 9 + Math.sin(f / 28) * 2.5 - exit * 20;
  const floatY = Math.sin(f / 24) * 10;
  const scale = (0.55 + 0.45 * cardIn) * (1 + exit * 2.2);
  const frameDraw = ramp(f, drop + 2, drop + 20, EASE.out);
  const scanP = ramp(f, scan, scan + 16, EASE.io);
  const glare = 30 + rotY * 2.4;

  // composeur du bas : « Plus sobre ? », « Plus chic ? »
  const compIn = ramp(f, S.from + 2, S.from + 14, EXPO.out);
  const send1 = S.flip1 - 5;
  const send2 = S.flip2 - 5;
  const press = Math.max(0, 1 - Math.abs(f - send1) / 3, 1 - Math.abs(f - send2) / 3);
  const glow = Math.max(0, 1 - Math.abs(f - send1 - 2) / 8, 1 - Math.abs(f - send2 - 2) / 8);

  const tagSwap = (at: number) => Math.max(0, 1 - Math.abs(f - at - 7) / 6);
  const tagBlur = (tagSwap(S.flip1) + tagSwap(S.flip2)) * 10;

  return (
    <AbsoluteFill>
      <CodeTunnel from={drop} to={scan + 4} />

      {/* carte */}
      <AbsoluteFill style={{ perspective: 1500, perspectiveOrigin: `${CARD.x}px ${CARD.y}px` }}>
        <div style={{
          position: "absolute", left: CARD.x - CARD.w / 2, top: CARD.y - CARD.h / 2 + floatY, width: CARD.w, height: CARD.h,
          transform: `translateZ(${(1 - cardIn) * -900}px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${scale})`,
          transformStyle: "preserve-3d", opacity: Math.min(1, cardIn * 1.4) * (1 - EXPO.in(exit)), filter: `blur(${flipBlur + exit * 26}px)`,
        }}>
          {/* halo coloré derrière la carte */}
          <div style={{ position: "absolute", inset: -60, borderRadius: CARD.r + 60, background: "radial-gradient(closest-side, rgba(255,190,110,.45), transparent)", filter: "blur(40px)", opacity: scanP, transform: "translateZ(-40px)" }} />
          <div style={{
            position: "absolute", inset: 0, borderRadius: CARD.r, overflow: "hidden",
            background: "rgba(10,10,18,.55)", backdropFilter: "blur(10px)",
            boxShadow: `0 60px 140px -30px rgba(0,0,0,.85), 0 0 0 2px rgba(255,230,200,${0.18 + 0.2 * (1 - scanP)})`,
          }}>
            {/* capture réelle (révélée par le balayage) */}
            <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 ${(1 - scanP) * 100}% 0)` }}>
              {screen === 1 && <SoberSite w={CARD.w} h={CARD.h} at={S.flip1 + 6} />}
              {SCREENS.map((s, i) => s.src && (
                <Img key={s.src} src={staticFile(s.src)} style={{
                  position: "absolute", left: 0, top: 0, width: "100%", display: i === screen ? "block" : "none",
                  transform: `translateY(${-s.scroll * ramp(f, i === 0 ? scan : i === 1 ? S.flip1 + 7 : S.flip2 + 7, S.out + 10, (t) => t)}px)`,
                }} />
              ))}
            </div>
            {/* maquette fil de fer */}
            <div style={{ position: "absolute", inset: 0, opacity: 1 - ramp(scanP, 0.4, 1, (t) => t) }}>
              {BLOCKS.map((b, i) => {
                const p = EXPO.out(ramp(f, drop + 8 + i * 4, drop + 22 + i * 4, (t) => t));
                const dx = (random(`bx${i}`) - 0.5) * 1100 * (1 - p);
                const dy = (random(`by${i}`) - 0.5) * 900 * (1 - p);
                const rot = (random(`br${i}`) - 0.5) * 120 * (1 - p);
                return (
                  <div key={i} style={{
                    position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: b.r,
                    border: `2.5px solid rgba(255,196,107,.9)`, background: b.fill ? "rgba(255,196,107,.55)" : "rgba(255,196,107,.08)",
                    boxShadow: "0 0 18px rgba(255,170,80,.45), inset 0 0 14px rgba(255,170,80,.18)",
                    transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${0.4 + 0.6 * p})`, opacity: p,
                    filter: `blur(${(1 - p) * 12}px)`, overflow: "hidden",
                  }}>
                    {b.img && (
                      <svg width={b.w} height={b.h} style={{ position: "absolute", inset: 0 }}>
                        <line x1={0} y1={0} x2={b.w} y2={b.h} stroke="rgba(255,196,107,.5)" strokeWidth={2} />
                        <line x1={b.w} y1={0} x2={0} y2={b.h} stroke="rgba(255,196,107,.5)" strokeWidth={2} />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
            {/* reflet de vitre */}
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${glare - 26}%, rgba(255,255,255,.2) ${glare - 6}%, rgba(255,255,255,.04) ${glare}%, transparent ${glare + 16}%)`, mixBlendMode: "screen" }} />
          </div>
          {/* contour qui se trace */}
          <svg width={CARD.w} height={CARD.h} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: 1 - scanP * 0.7 }}>
            <rect x={1.5} y={1.5} width={CARD.w - 3} height={CARD.h - 3} rx={CARD.r} fill="none" stroke={B.accentBright} strokeWidth={3}
              pathLength={1} strokeDasharray={`${frameDraw} 1`} style={{ filter: `drop-shadow(0 0 10px ${B.accent})` }} />
          </svg>
          {/* ligne de balayage */}
          {scanP > 0 && scanP < 1 && (
            <div style={{ position: "absolute", left: -20, right: -20, top: scanP * CARD.h - 3, height: 6, borderRadius: 3, background: "#fff6e3", boxShadow: `0 0 30px 8px ${B.accent}, 0 0 90px 20px rgba(255,170,80,.6)` }} />
          )}
        </div>
      </AbsoluteFill>

      {/* étiquette « Exemple de style » */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: CARD.y + CARD.h / 2 + 40, display: "flex", justifyContent: "center",
        opacity: ramp(f, scan + 10, scan + 20) * (1 - exit), filter: `blur(${tagBlur}px)`, transform: `translateY(${(1 - ramp(f, scan + 10, scan + 22, EXPO.out)) * 30}px)`,
      }}>
        <Tag>Exemple de style · {SCREENS[screen].name}</Tag>
      </div>

      {/* composeur du bas */}
      <div style={{
        position: "absolute", left: 110, width: 860, top: 1330, height: 118,
        transform: `translateY(${(1 - compIn) * 160 + exit * 240}px)`, opacity: compIn * (1 - exit), filter: `blur(${(1 - compIn) * 16 + exit * 20}px)`,
      }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 59, background: "rgba(13,14,24,.74)", border: "2px solid rgba(255,236,210,.18)", backdropFilter: "blur(20px)", boxShadow: "0 30px 80px -20px rgba(0,0,0,.8), 0 0 40px rgba(255,170,80,.18)" }} />
        <div style={{ position: "absolute", left: 104, top: 30 }}>
          {f < S.flip1 + 2 ? (
            <Typed text="Plus sobre ?" accents={["sobre"]} from={S.ask1} to={S.ask1 + 14} size={46} clearAt={send1 + 3} />
          ) : (
            <Typed text="Plus chic ?" accents={["chic"]} from={S.ask2} to={S.ask2 + 12} size={46} clearAt={send2 + 3} />
          )}
        </div>
        <div style={{ position: "absolute", inset: 0, transform: "translateY(-4px)" }}>
          <ComposerBar scale={0.82} press={press} sendGlow={glow} showTo={false} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
