import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { B, EASE, FONT } from "../../brand";
import { CL, Cursor, EXPO, Ripple, ramp, speedBlur } from "../kit";
import { Icon } from "../icons";
import { M } from "../timeline";
import { BRIEF_TEXT } from "../copy";

// ------------------------------------------------------------------------------------------------
// Puces de métiers (verre + lueur), en trois rangées qui dérivent en sens opposés, inclinées en 3D.
type ChipDef = [label: string, icon: string];
const ROWS: { y: number; dir: number; base: number; chips: ChipDef[]; target?: number }[] = [
  { y: -150, dir: 1, base: -150, chips: [["Fleuriste", "flower"], ["Café", "cup"], ["Hôtel", "bed"], ["Garage", "wrench"], ["Traiteur", "cloche"], ["Opticien", "glasses"]] },
  { y: 0, dir: -1, base: 0, target: 2, chips: [["Coiffeur", "scissors"], ["Boulangerie", "bread"], ["Pizzeria", "pizza"], ["Boutique", "bag"], ["Artisan", "hammer"]] },
  { y: 150, dir: 1, base: 170, chips: [["Fitness", "dumbbell"], ["Opticien", "glasses"], ["Fleuriste", "flower"], ["Café", "cup"], ["Garage", "wrench"], ["Hôtel", "bed"]] },
];
const CHIP_H = 100;
const GAP = 22;
const chipW = (label: string) => Math.round(36 * 2 + 40 + 16 + label.length * 22.5);
const CX = 540;
const CY = 900;
const TILT = (k: number) => `perspective(1600px) rotateX(${16 * k}deg) rotateY(${-9 * k}deg) rotateZ(${-4 * k}deg)`;

export const Chip: React.FC<{ label: string; icon: string; hover?: number; style?: React.CSSProperties; content?: number }> = ({ label, icon, hover = 0, style, content = 1 }) => (
  <div style={{
    position: "absolute", height: CHIP_H, width: chipW(label), borderRadius: CHIP_H / 2,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
    background: interpolateColors(hover, [0, 1], ["rgba(255,255,255,0.07)", "rgba(255,196,107,0.2)"]),
    border: `2px solid ${interpolateColors(hover, [0, 1], ["rgba(255,236,210,0.28)", "rgba(255,212,143,1)"])}`,
    boxShadow: `0 0 ${20 + 50 * hover}px rgba(255,170,80,${0.18 + 0.5 * hover}), inset 0 1px 0 rgba(255,255,255,.25), inset 0 0 24px rgba(255,200,140,${0.08 + 0.2 * hover})`,
    backdropFilter: "blur(16px)",
    color: interpolateColors(hover, [0, 1], ["#f6efe6", "#fff4dc"]), fontFamily: FONT.display, fontWeight: 600, fontSize: 42, letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
    ...style,
  }}>
    <span style={{ display: "flex", alignItems: "center", gap: 16, opacity: content }}>
      <Icon name={icon} size={40} stroke={1.9} />
      {label}
    </span>
  </div>
);

// Position x (centre) de chaque puce d'une rangée, la puce cible étant centrée sur x = 0.
const layoutRow = (chips: ChipDef[], target = Math.floor(chips.length / 2)) => {
  const w = chips.map(([l]) => chipW(l));
  const xs: number[] = [];
  let x = 0;
  for (let i = 0; i < chips.length; i++) {
    xs.push(x + w[i] / 2);
    x += w[i] + GAP;
  }
  const shift = xs[target];
  return xs.map((v) => v - shift);
};

// ------------------------------------------------------------------------------------------------
// Texte tapé : les derniers caractères arrivent en ambre puis blanchissent ; les mots-clés restent ambrés.
export const Typed: React.FC<{ text: string; accents: string[]; from: number; to: number; size: number; caret?: boolean; clearAt?: number }> = ({
  text, accents, from, to, size, caret = true, clearAt,
}) => {
  const f = useCurrentFrame();
  const cps = text.length / Math.max(1, to - from);
  const n = Math.floor(interpolate(f, [from, to], [0, text.length], CL));
  const accentMask = new Array(text.length).fill(false);
  for (const a of accents) {
    const i = text.indexOf(a);
    if (i >= 0) for (let k = i; k < i + a.length; k++) accentMask[k] = true;
  }
  const cleared = clearAt !== undefined && f >= clearAt;
  const clearP = clearAt !== undefined ? ramp(f, clearAt - 2, clearAt + 6, EXPO.in) : 0;
  const blink = f < to + 2 || Math.floor((f - to) / 9) % 2 === 0;
  return (
    <span style={{ fontFamily: FONT.display, fontWeight: 500, fontSize: size, lineHeight: 1.22, letterSpacing: "-0.015em", color: B.text,
      opacity: 1 - clearP, filter: `blur(${clearP * 10}px)`, transform: `translateY(${-clearP * 30}px)`, display: "inline-block" }}>
      {text.slice(0, cleared ? 0 : n).split("").map((ch, i) => {
        const age = (f - (from + i / cps)) / 6;
        const c = accentMask[i] ? B.accent : interpolateColors(Math.min(1, Math.max(0, age)), [0, 1], [B.accentBright, B.text]);
        return <span key={i} style={{ color: c, textShadow: accentMask[i] ? "0 0 24px rgba(255,196,107,.45)" : undefined }}>{ch}</span>;
      })}
      {caret && !cleared && f >= from - 6 && (
        <span style={{ display: "inline-block", width: size * 0.07, height: size * 1.05, marginLeft: 4, verticalAlign: "-0.16em", borderRadius: 3, background: B.accent, opacity: blink ? 1 : 0, boxShadow: `0 0 14px ${B.accent}` }} />
      )}
    </span>
  );
};

// Barre d'outils du composeur : « + », destinataire « Jules & Louis », micro, bouton d'envoi ambre.
export const ComposerBar: React.FC<{ scale?: number; press?: number; sendGlow?: number; showTo?: boolean }> = ({ scale = 1, press = 0, sendGlow = 0, showTo = true }) => {
  const s = scale;
  return (
    <div style={{ position: "absolute", left: 40 * s, right: 36 * s, bottom: 32 * s, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ width: 66 * s, height: 66 * s, borderRadius: "50%", border: "2px solid rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", color: B.mist }}>
        <Icon name="plus" size={34 * s} stroke={2} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 22 * s }}>
        {showTo && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 * s, fontFamily: FONT.display, fontWeight: 500, fontSize: 32 * s, color: B.mist }}>
            <div style={{ display: "flex" }}>
              {["J", "L"].map((l, i) => (
                <div key={l} style={{
                  width: 50 * s, height: 50 * s, borderRadius: "50%", marginLeft: i ? -14 * s : 0, display: "flex", alignItems: "center", justifyContent: "center",
                  background: i ? `linear-gradient(135deg, ${B.royal}, ${B.horizon})` : `linear-gradient(135deg, ${B.accentBright}, ${B.accentDeep})`,
                  color: i ? B.text : B.night, fontWeight: 700, fontSize: 24 * s, border: `3px solid #11131f`,
                }}>{l}</div>
              ))}
            </div>
            Jules & Louis
            <Icon name="chevron" size={26 * s} stroke={2.2} />
          </div>
        )}
        <Icon name="mic" size={36 * s} color={B.mist} />
        <div style={{
          width: 72 * s, height: 72 * s, borderRadius: 22 * s, display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
          background: `linear-gradient(180deg, ${B.accentBright}, ${B.accentDeep})`, color: B.night,
          transform: `scale(${1 - press * 0.14 + sendGlow * 0.08})`, boxShadow: `0 0 ${24 + sendGlow * 60}px rgba(255,180,90,${0.45 + sendGlow * 0.5})`,
        }}>
          <Icon name="up" size={38 * s} stroke={2.6} />
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------------------------
export const Brief: React.FC = () => {
  const f = useCurrentFrame();
  const { from, click } = M.chips;
  const { type, typeEnd, send } = M.brief;

  // Entrée des rangées puis dérive ; la rangée du milieu s'arrête pile sur « Pizzeria » au clic.
  const enter = EXPO.out(ramp(f, from, from + 22, (t) => t));
  const drift = (dir: number) => dir * Math.max(0, click - f) * -1.6;
  const rowX = (r: (typeof ROWS)[number]) => (1 - enter) * 1300 * -r.dir + drift(r.dir) + r.base;
  const rowBlur = speedBlur((g) => (1 - EXPO.out(ramp(g, from, from + 22, (t) => t))) * 1300, f, 0.25, 30);

  // Après le clic : les autres puces s'envolent, la puce choisie devient le composeur.
  const scatter = ramp(f, click + 1, click + 16, EXPO.in);
  const hover = ramp(f, click - 9, click - 3);
  const morph = ramp(f, click + 4, click + 24, EASE.io);
  const flat = morph;

  // Curseur : arrive sur « Pizzeria », clique, s'écarte, revient sur « Envoyer ».
  const cur = (g: number) => {
    const a = EASE.io(ramp(g, from + 26, click - 4, (t) => t));
    const away = EASE.io(ramp(g, click + 4, click + 22, (t) => t));
    const back = EASE.io(ramp(g, typeEnd - 4, send - 3, (t) => t));
    const sx = 980, sy = 1560;
    const tx = CX + 40, ty = CY + 18;
    const ax = 1000, ay = 1300;
    const sendX = CX + 460 - 36 - 36, sendY = CY + 155 - 32 - 36;
    let x = sx + (tx - sx) * a, y = sy + (ty - sy) * a;
    x += (ax - x) * away; y += (ay - y) * away;
    x += (sendX - x) * back; y += (sendY - y) * back;
    return [x, y] as const;
  };
  const [cx, cy] = cur(f);
  const cursorBlur = Math.min(10, Math.hypot(cur(f + 0.5)[0] - cur(f - 0.5)[0], cur(f + 0.5)[1] - cur(f - 0.5)[1]) * 0.12);
  const press = Math.max(1 - Math.abs(f - click) / 3, 1 - Math.abs(f - send) / 3, 0);
  const cursorOpacity = ramp(f, from + 24, from + 30) * (1 - ramp(f, send + 4, send + 9));

  // Composeur
  const w = interpolate(morph, [0, 1], [chipW("Pizzeria"), 920]);
  const h = interpolate(morph, [0, 1], [CHIP_H, 310]);
  const launch = ramp(f, send + 3, M.drop, EXPO.in);
  const sendGlow = Math.max(0, 1 - Math.abs(f - send - 2) / 8);
  const typingGlow = ramp(f, type - 4, type + 6) * (1 - ramp(f, typeEnd, typeEnd + 20));

  return (
    <AbsoluteFill>
      {/* rangées de puces */}
      <AbsoluteFill style={{ transform: `${TILT(1)} scale(1.18)`, transformOrigin: `${CX}px ${CY}px` }}>
        {ROWS.map((r, ri) => {
          const xs = layoutRow(r.chips, r.target);
          return r.chips.map(([label, icon], ci) => {
            if (ri === 1 && ci === r.target) return null; // la puce choisie est dessinée à part
            const x = CX + xs[ci] + rowX(r);
            const side = Math.sign(xs[ci] + r.base || r.y || 1);
            const sx = side * scatter * (700 + ci * 60);
            const sy = (r.y === 0 ? 0 : Math.sign(r.y)) * scatter * 500 - scatter * 120;
            const appear = ramp(f, from + ci * 1.5 + ri * 2, from + ci * 1.5 + ri * 2 + 10);
            return (
              <Chip key={`${ri}-${ci}`} label={label} icon={icon} style={{
                left: x - chipW(label) / 2 + sx, top: CY + r.y - CHIP_H / 2 + sy,
                opacity: appear * (1 - scatter) * (ri === 1 ? 1 : 0.85),
                filter: `blur(${rowBlur + scatter * 24 + (ri === 1 ? 0 : 1.5)}px)`,
                transform: `scale(${1 - scatter * 0.2})`,
              }} />
            );
          });
        })}
      </AbsoluteFill>

      {/* puce « Pizzeria » → composeur */}
      <AbsoluteFill style={{
        transform: `${TILT(1 - flat)} translateY(${-launch * 140}px) scale(${1 + launch * 1.9})`, transformOrigin: `${CX}px ${CY}px`,
        opacity: 1 - EXPO.in(launch), filter: `blur(${launch * 22}px)`,
      }}>
        {(() => {
          const x0 = CX + rowX(ROWS[1]);
          const x = interpolate(morph, [0, 1], [x0, CX]);
          const pressPop = 1 + 0.08 * Math.sin(Math.PI * ramp(f, click, click + 8, (t) => t));
          return (
            <div style={{ position: "absolute", left: x - w / 2, top: CY - h / 2, width: w, height: h, transform: `scale(${pressPop})`, filter: `blur(${rowBlur}px)` }}>
              <Chip label="Pizzeria" icon="pizza" hover={hover * (1 - morph)} content={1 - ramp(morph, 0, 0.35, (t) => t)}
                style={{
                  left: 0, top: 0, width: w, height: h, borderRadius: interpolate(morph, [0, 1], [CHIP_H / 2, 48]),
                  opacity: ramp(f, from + 3, from + 13),
                  background: interpolateColors(morph, [0, 1], [interpolateColors(hover, [0, 1], ["rgba(255,255,255,0.07)", "rgba(255,196,107,0.2)"]), "rgba(13,14,24,0.72)"]),
                  border: `2px solid ${interpolateColors(morph, [0, 1], [interpolateColors(hover, [0, 1], ["rgba(255,236,210,0.28)", "rgba(255,212,143,1)"]), interpolateColors(typingGlow, [0, 1], ["rgba(255,236,210,0.16)", "rgba(255,196,107,0.55)"])])}`,
                  boxShadow: `0 40px 120px -30px rgba(0,0,0,.8), 0 0 ${30 + 70 * Math.max(hover * (1 - morph), typingGlow * 0.6)}px rgba(255,170,80,${0.2 + 0.4 * Math.max(hover * (1 - morph), typingGlow * 0.5)}), inset 0 1px 0 rgba(255,255,255,.12)`,
                  backdropFilter: "blur(24px)",
                }} />
              <div style={{ position: "absolute", inset: 0, opacity: ramp(morph, 0.55, 1, (t) => t) }}>
                <div style={{ position: "absolute", left: 50, top: 44, right: 50 }}>
                  <Typed text={BRIEF_TEXT} accents={["site", "pizzeria"]} from={type} to={typeEnd} size={54} />
                </div>
                <ComposerBar press={Math.max(0, 1 - Math.abs(f - send) / 3)} sendGlow={sendGlow} />
              </div>
              <div style={{ position: "absolute", left: x0 - x + w / 2, top: h / 2 }}>
                <Ripple p={ramp(f, click, click + 18, (t) => t)} size={520} />
              </div>
              <div style={{ position: "absolute", left: w - 36 - 36, top: h - 32 - 36 }}>
                <Ripple p={ramp(f, send, send + 16, (t) => t)} size={300} />
              </div>
            </div>
          );
        })()}
      </AbsoluteFill>

      <Cursor x={cx} y={cy} press={press} opacity={cursorOpacity} blur={cursorBlur} />
    </AbsoluteFill>
  );
};
