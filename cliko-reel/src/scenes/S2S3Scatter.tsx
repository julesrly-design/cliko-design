import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { B, FONT } from "../brand";
import { Dot, glass } from "../components/Brand";
import { Phone3D } from "../components/Devices3D";
import { LineIcon, LineIconName } from "../components/LineIcons";
import { RailScrim } from "../components/Captions";
import { Sfx } from "../components/Sound";
import { useHero } from "../captions";
import { Hook, useScene } from "../timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeOut3 = (x: number) => 1 - Math.pow(1 - x, 3);

// Constellation de la présence éparpillée (reprise de la section « éparpillée » de cliko.be).
const CX = 540;
const CY = 760;
type Tile = { key: string; icon: LineIconName; label: string; word?: string; atRel?: number; x: number; y: number; seed: number };
const TILES: Tile[] = [
  { key: "facebook", icon: "thumb", label: "Facebook", word: "facebook", x: 225, y: 440, seed: 1 },
  { key: "google", icon: "pin", label: "Google", word: "google", x: 790, y: 500, seed: 2 },
  { key: "photos", icon: "camera", label: "Photos", word: "photos", x: 250, y: 1080, seed: 3 },
  { key: "tel", icon: "phone", label: "Téléphone", atRel: 0.62, x: 800, y: 1045, seed: 4 },
];
const TILE = 196;
const SPREAD = 1.22;

const jit = (frame: number, seed: number, amp: number) =>
  amp * (Math.sin(frame * 1.9 + seed * 12.9) * 0.6 + Math.sin(frame * 3.7 + seed * 4.3) * 0.4);

const tilePos = (t: Tile, out: number, spread: number, frame: number, shake: number) => {
  const k = 1 + (SPREAD - 1) * spread;
  return {
    x: CX + (t.x - CX) * out * k + jit(frame, t.seed, shake),
    y: CY + (t.y - CY) * out * k + jit(frame, t.seed + 7, shake),
  };
};

const GlassTile: React.FC<{ t: Tile; size?: number; glow?: number }> = ({ t, size = TILE, glow = 0 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.28, ...glass(true), display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: `0 30px 80px -30px rgba(2,4,12,.8), inset 0 1px 0 rgba(255,255,255,.1), 0 0 ${60 * glow}px rgba(255,196,107,${0.5 * glow})` }}>
    <LineIcon name={t.icon} size={size * 0.44} color={glow > 0.5 ? B.accent : B.text} stroke={1.5} />
    {/* nœud d'étoile, comme sur le site */}
    <div style={{ position: "absolute", right: -7, top: -7, width: 14, height: 14, borderRadius: 7, background: "#fff", boxShadow: "0 0 14px rgba(255,255,255,.9)" }} />
  </div>
);

// Petites photos qui accompagnent l'appareil photo.
const Prints: React.FC<{ s: number; frame: number; spread: number; shake: number }> = ({ s, frame, spread, shake }) => (
  <>
    {[0, 1, 2].map((k) => {
      const p = Math.max(0, Math.min(1, s * 1.4 - k * 0.2));
      const grad = ["linear-gradient(135deg,#f7b267,#c4553a)", "linear-gradient(135deg,#7fb7be,#2c4a7a)", "linear-gradient(135deg,#d9b38c,#6b4a3a)"][k];
      const ox = (-150 + k * 120) * (1 + 0.25 * spread) + jit(frame, 20 + k, shake);
      const oy = (170 - Math.abs(k - 1) * 30) * (1 + 0.2 * spread) + jit(frame, 30 + k, shake);
      return (
        <div key={k} style={{ position: "absolute", left: 250 + ox * p - 60, top: 1080 + oy * p - 45, width: 120, height: 90, borderRadius: 10, border: "5px solid #f2f3fa", background: grad, boxShadow: "0 16px 30px -10px rgba(0,0,0,.6)", transform: `rotate(${(k - 1) * 16 * p + jit(frame, 40 + k, shake * 0.6)}deg) scale(${p})`, opacity: p }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.55 }}>
            <LineIcon name="image" size={46} color="#fff" stroke={1.4} />
          </div>
        </div>
      );
    })}
  </>
);

// ——— Scène 2 : « Facebook, Google, vos photos… tout est éparpillé. » ———
export const S2Problem: React.FC<{ hook: Hook }> = ({ hook }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useScene("probleme");
  const hero = useHero(hook, "probleme", "éparpillé.");
  const heroAt = hero?.at ?? T.at("éparpillé");
  const telAt = Math.round(T.at("photos") + (T.at("tout") - T.at("photos")) * 0.62);
  const flash = interpolate(frame, [0, 9], [1, 0], { ...clamp, easing: easeOut3 });
  const phoneIn = spring({ frame: frame + 2, fps, config: { stiffness: 140, damping: 18 } });
  const spread = spring({ frame: frame - (T.at("tout") - 2), fps, config: { stiffness: 90, damping: 12 } });
  const chaos = interpolate(frame, [heroAt - 2, heroAt + 6], [0, 1], clamp);
  const shake = 2 + 3 * spread + 5 * chaos;
  const scatter = interpolate(frame, [Math.min(heroAt + 12, T.dur - 5), T.dur + 2], [0, 1], { ...clamp, easing: (x) => x * x });

  const appear = (t: Tile) => (t.word ? T.at(t.word) : telAt);
  const letters = "éparpillé.".split("");

  return (
    <AbsoluteFill>
      {/* lignes de constellation téléphone → tuiles */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {TILES.map((t) => {
          const s = spring({ frame: frame - appear(t), fps, config: { stiffness: 170, damping: 14 } });
          if (s < 0.01) return null;
          const p = tilePos(t, s, spread, frame, shake);
          const snap = chaos > 0 ? (Math.sin(frame * 7 + t.seed) > 0.2 ? 0.15 : 0.55) * (1 - chaos * 0.6) : 0.55;
          return <line key={t.key} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke={`rgba(185,196,240,${snap})`} strokeWidth={1.6} strokeDasharray={chaos > 0 ? "10 12" : undefined} strokeDashoffset={frame * 3} />;
        })}
      </svg>

      {/* téléphone : la présence en ligne… */}
      <div style={{ position: "absolute", left: CX, top: CY, perspective: 1800, transform: `translate(${jit(frame, 9, chaos * 3)}px, ${(1 - phoneIn) * 500}px)` }}>
        <div style={{ transform: `translate(-50%,-50%) rotate(${jit(frame, 11, chaos * 1.2)}deg)`, filter: `saturate(${1 - chaos * 0.7}) brightness(${1 - chaos * 0.35})` }}>
          <Phone3D width={268} rotateY={-12 + Math.sin(frame / 18) * 4} rotateX={6}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 70% at 50% 0%, #1b2450 0%, #0a0e1c 70%)" }} />
            <div style={{ position: "absolute", top: 80, left: 22, right: 22, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: "1", borderRadius: 13, background: "rgba(242,243,250,.08)", border: "1px solid rgba(185,196,240,.12)" }} />
              ))}
            </div>
            {/* notifications qui s'empilent */}
            {TILES.map((t, k) => {
              const s = spring({ frame: frame - appear(t) + 2, fps, config: { stiffness: 200, damping: 16 } });
              return (
                <div key={t.key} style={{ position: "absolute", left: 14, right: 14, top: 300 + k * 58, height: 48, borderRadius: 14, ...glass(true), display: "flex", alignItems: "center", gap: 10, padding: "0 12px", opacity: s * (1 - chaos), transform: `translateY(${(1 - s) * -20}px)` }}>
                  <LineIcon name={t.icon} size={22} color={B.text} />
                  <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 17, color: B.text }}>{t.label}</div>
                </div>
              );
            })}
          </Phone3D>
        </div>
      </div>

      {/* tuiles en verre qui jaillissent */}
      {TILES.map((t) => {
        const at = appear(t);
        const s = spring({ frame: frame - at, fps, config: { stiffness: 170, damping: 14 } });
        if (s < 0.01) return null;
        const p = tilePos(t, s, spread, frame, shake);
        const vel = Math.max(0, 1 - Math.abs(frame - at - 4) / 6);
        const rot = (t.seed % 2 ? -1 : 1) * (14 * (1 - s) + 6 * spread) + jit(frame, t.seed + 3, shake * 0.8);
        return (
          <div key={t.key} style={{ position: "absolute", left: p.x - TILE / 2, top: p.y - TILE / 2, transform: `rotate(${rot}deg) scale(${0.4 + 0.6 * s})`, opacity: Math.min(1, s * 2) * (1 - scatter * 0.2), filter: vel > 0.05 ? `blur(${vel * 6}px)` : undefined }}>
            <GlassTile t={t} />
            <div style={{ position: "absolute", left: -40, right: -40, top: TILE + 16, textAlign: "center", fontFamily: FONT.display, fontWeight: 600, fontSize: 36, color: B.mist, letterSpacing: "-0.01em" }}>{t.label}</div>
          </div>
        );
      })}
      <Prints s={spring({ frame: frame - T.at("photos"), fps, config: { stiffness: 150, damping: 14 } })} frame={frame} spread={spread} shake={shake} />

      {/* mot héros « éparpillé. » : il s'assemble, puis vole en éclats */}
      {hero && frame >= heroAt - 1 && (
        <div style={{ position: "absolute", left: 80, width: 840, top: 690, display: "flex", justifyContent: "center", fontFamily: FONT.display, fontWeight: 900, fontSize: 150, letterSpacing: "-0.045em", color: B.text, lineHeight: 1 }}>
          {letters.map((ch, i) => {
            const a = spring({ frame: frame - heroAt + 2 - i * 0.35, fps, config: { stiffness: 420, damping: 24, mass: 0.5 } });
            const ang = random(`ep${i}`) * Math.PI * 2;
            const dist = 300 + random(`ed${i}`) * 700;
            const dx = Math.cos(ang) * dist * scatter;
            const dy = Math.sin(ang) * dist * scatter;
            const r = (random(`er${i}`) - 0.5) * 140 * scatter;
            return (
              <span key={i} style={{ display: "inline-block", transform: `translate(${dx}px, ${dy + (1 - a) * 60}px) rotate(${r}deg) scale(${0.6 + 0.4 * a})`, opacity: a * (1 - scatter * 0.6), filter: scatter > 0.05 ? `blur(${scatter * 8}px)` : undefined, textShadow: "0 10px 50px rgba(4,6,14,.9)" }}>
                {ch}
              </span>
            );
          })}
        </div>
      )}

      {/* raccord : le flash ambré de la scène 1 se dissipe */}
      <AbsoluteFill style={{ background: "radial-gradient(70% 50% at 50% 50%, rgba(255,232,190,1) 0%, rgba(255,196,107,.9) 40%, rgba(11,16,32,1) 100%)", opacity: flash }} />
      <RailScrim strength={0.6} />

      <Sfx name="impact" at={0} db={-2} />
      {TILES.map((t) => (
        <React.Fragment key={t.key}>
          <Sfx name="whip" at={appear(t) - 1} db={-6} />
          <Sfx name="pop" at={appear(t) + 2} db={-4} />
        </React.Fragment>
      ))}
      <Sfx name="glitch-off" at={heroAt} db={-10} duration={18} />
      <Sfx name="whoosh" at={heroAt + 8} db={-4} />
    </AbsoluteFill>
  );
};

// ——— Scène 3 : « Cliko rassemble tout à une seule adresse : la vôtre. » ———
const URL = "votrecommerce.be";
const BAR_W = 820;
const BAR_H = 128;

export const S3Solution: React.FC<{ hook: Hook }> = ({ hook }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useScene("solution");
  const cliko = useHero(hook, "solution", "Cliko");
  const clikoAt = cliko?.at ?? T.at("cliko");
  const gather = T.at("rassemble");
  const typeStart = T.at("une");
  const enter = T.at("vôtre");

  // le téléphone se résorbe en un point ambre
  const collapse = interpolate(frame, [0, 7], [0, 1], { ...clamp, easing: (x) => x * x });
  const dotIn = spring({ frame: frame - 3, fps, config: { stiffness: 260, damping: 13, mass: 0.6 } });
  // « Cliko » s'écrit autour du point, puis s'efface sur « rassemble »
  const word = spring({ frame: frame - clikoAt, fps, config: { stiffness: 260, damping: 22 } });
  const wordOut = interpolate(frame, [gather + 2, gather + 10], [0, 1], { ...clamp, easing: (x) => x * x });
  // traits qui convergent puis aspiration des tuiles
  const lines = interpolate(frame, [gather, gather + 6], [0, 1], { ...clamp, easing: easeOut3 });
  // barre d'adresse
  const bar = spring({ frame: frame - (typeStart - 6), fps, config: { stiffness: 150, damping: 17 } });
  const typed = Math.floor(interpolate(frame, [typeStart, enter - 4], [0, URL.length], clamp));
  const valid = spring({ frame: frame - enter, fps, config: { stiffness: 300, damping: 12, mass: 0.5 } });
  const ring = interpolate(frame - enter, [0, 20], [0, 1], { ...clamp, easing: easeOut3 });
  const exit = interpolate(frame, [T.dur - 8, T.dur], [0, 1], { ...clamp, easing: (x) => x * x * x });
  const barW = 26 + (BAR_W - 26) * bar;
  const barH = 26 + (BAR_H - 26) * Math.min(1, bar * 1.4);

  return (
    <AbsoluteFill>
      {/* téléphone qui se résorbe */}
      {collapse < 1 && (
        <div style={{ position: "absolute", left: CX, top: CY, perspective: 1800 }}>
          <div style={{ transform: `translate(-50%,-50%) scale(${1 - collapse * 0.96})`, opacity: 1 - collapse, filter: `brightness(${1 + collapse})` }}>
            <Phone3D width={268} rotateY={-12} rotateX={6}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 70% at 50% 0%, #1b2450 0%, #0a0e1c 70%)" }} />
            </Phone3D>
          </div>
        </div>
      )}

      {/* traits de convergence (comme l'animation « éparpillée » du site) */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {TILES.map((t, k) => {
          const pull = interpolate(frame, [gather + 3 + k * 3, gather + 15 + k * 3], [0, 1], { ...clamp, easing: (x) => x * x * x });
          const from = tilePos(t, 1, 1, frame, 3 * (1 - pull));
          const x = from.x + (CX - from.x) * pull;
          const y = from.y + (CY - from.y) * pull;
          const fade = 1 - interpolate(frame, [gather + 15 + k * 3, gather + 20 + k * 3], [0, 1], clamp);
          return (
            <line key={t.key} x1={CX} y1={CY} x2={CX + (x - CX) * lines} y2={CY + (y - CY) * lines} stroke={B.accent} strokeOpacity={0.75 * fade} strokeWidth={2.2} style={{ filter: "drop-shadow(0 0 6px rgba(255,196,107,.8))" }} />
          );
        })}
      </svg>

      {/* tuiles aspirées vers le point */}
      {TILES.map((t, k) => {
        const pull = interpolate(frame, [gather + 3 + k * 3, gather + 15 + k * 3], [0, 1], { ...clamp, easing: (x) => x * x * x });
        if (pull >= 1) return null;
        const from = tilePos(t, 1, 1, frame, 3 * (1 - pull));
        const x = from.x + (CX - from.x) * pull;
        const y = from.y + (CY - from.y) * pull;
        const vel = Math.sin(Math.PI * pull);
        return (
          <div key={t.key} style={{ position: "absolute", left: x - TILE / 2, top: y - TILE / 2, transform: `scale(${1 - 0.85 * pull})`, filter: `blur(${vel * 9}px)` }}>
            <GlassTile t={t} glow={pull} />
          </div>
        );
      })}

      {/* « Cliko » : le point est son point final */}
      {cliko && frame >= clikoAt - 1 && wordOut < 1 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: CY - 100, display: "flex", justifyContent: "center", paddingRight: 26 }}>
          <div style={{ display: "flex", alignItems: "baseline", fontFamily: FONT.display, fontWeight: 700, fontSize: 190, letterSpacing: "-0.03em", color: B.text, lineHeight: 1, opacity: 1 - wordOut, transform: `scale(${0.92 + 0.08 * word - 0.1 * wordOut})`, filter: wordOut > 0 ? `blur(${wordOut * 10}px)` : undefined }}>
            {"Cliko".split("").map((ch, i) => {
              const p = Math.max(0, Math.min(1, word * 5 - (4 - i)));
              return (
                <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.1em", marginBottom: "-0.1em" }}>
                  <span style={{ display: "inline-block", transform: `translateX(${(1 - p) * 40}%)`, opacity: p }}>{ch}</span>
                </span>
              );
            })}
            <span style={{ display: "inline-block", width: 44 }} />
          </div>
        </div>
      )}

      {/* le point ambre, puis la barre d'adresse qui en naît */}
      <div
        style={{
          position: "absolute", left: CX - barW / 2 + (cliko && wordOut < 1 && bar < 0.05 ? 238 * (1 - wordOut) * word : 0), top: CY - barH / 2 + (bar < 0.05 ? 58 * (1 - wordOut) * word : 0),
          width: barW, height: barH, borderRadius: barH / 2,
          transform: `scale(${dotIn}) translateY(${-exit * 700}px) scale(${1 - exit * 0.4})`,
          opacity: 1 - exit,
        }}
      >
        {bar < 0.05 ? (
          <Dot size={36} glow={1.6 + Math.sin(frame / 3) * 0.2} style={{ position: "absolute", left: (barW - 36) / 2, top: (barH - 36) / 2 }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, borderRadius: barH / 2, ...glass(true), border: `2px solid rgba(255,196,107,${0.35 + 0.65 * valid})`, boxShadow: `0 40px 90px -30px rgba(2,4,12,.9), 0 0 ${40 + 80 * valid}px rgba(255,196,107,${0.25 + 0.45 * valid})`, display: "flex", alignItems: "center", overflow: "hidden" }}>
            <div style={{ marginLeft: 26, width: 76, height: 76, borderRadius: 38, flexShrink: 0, background: valid > 0.05 ? `linear-gradient(180deg, ${B.accentBright}, ${B.accentDeep})` : "rgba(242,243,250,.1)", display: "flex", alignItems: "center", justifyContent: "center", opacity: Math.min(1, bar * 2) }}>
              <LineIcon name={valid > 0.05 ? "check" : "lock"} size={40} color={valid > 0.05 ? B.night : B.text} stroke={2.4} />
            </div>
            <div style={{ marginLeft: 26, fontFamily: FONT.display, fontWeight: 600, fontSize: 60, letterSpacing: "-0.02em", color: B.text, whiteSpace: "nowrap", opacity: Math.min(1, bar * 2) }}>
              {URL.slice(0, typed)}
              <span style={{ display: "inline-block", width: 4, height: 62, marginLeft: 4, verticalAlign: "middle", background: B.accent, opacity: frame < enter && Math.floor(frame / 7) % 2 === 0 ? 1 : 0 }} />
            </div>
          </div>
        )}
      </div>

      {/* tout ce qui était éparpillé, désormais rangé sous la même adresse */}
      {bar > 0.3 && (
        <div style={{ position: "absolute", left: 40, right: 150, top: CY + 120, display: "flex", justifyContent: "center", gap: 14, opacity: 1 - exit }}>
          {TILES.map((t, k) => {
            const s = spring({ frame: frame - (typeStart + 4 + k * 4), fps, config: { stiffness: 220, damping: 15 } });
            return (
              <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 15px 11px 12px", borderRadius: 999, ...glass(), transform: `translateY(${(1 - s) * 40}px) scale(${0.8 + 0.2 * s})`, opacity: Math.min(1, s * 1.6) }}>
                <LineIcon name={t.icon} size={28} color={B.text} stroke={1.6} />
                <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 26, color: B.mist }}>{t.label}</span>
                <LineIcon name="check" size={24} color={B.accent} stroke={2.6} style={{ opacity: valid > 0.05 ? 1 : 0.0 }} />
              </div>
            );
          })}
        </div>
      )}

      {/* onde de validation + orbite (le cercle de « votrecommerce.be » sur le site) */}
      {frame >= enter && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 1 - exit }}>
          <ellipse cx={CX} cy={CY} rx={BAR_W / 2 + 40 + ring * 180} ry={BAR_H / 2 + 30 + ring * 260} fill="none" stroke={B.accent} strokeOpacity={(1 - ring) * 0.9} strokeWidth={3} />
          <ellipse cx={CX} cy={CY} rx={BAR_W / 2 + 10 + ring * 90} ry={BAR_H / 2 + 14 + ring * 140} fill="none" stroke={B.accentBright} strokeOpacity={(1 - ring) * 0.6} strokeWidth={2} />
        </svg>
      )}
      {bar > 0.2 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: (bar - 0.2) * (1 - exit) * 0.8 }}>
          <circle cx={CX} cy={CY} r={300} fill="none" stroke="rgba(185,196,240,.22)" strokeWidth={1.5} />
          <circle cx={CX + Math.cos(frame / 14) * 300} cy={CY + Math.sin(frame / 14) * 300} r={7} fill="#fff" style={{ filter: "drop-shadow(0 0 8px #fff)" }} />
        </svg>
      )}
      <RailScrim strength={0.5} />

      <Sfx name="pop" at={4} db={-2} />
      <Sfx name="suck" at={gather - 2} db={-2} />
      {TILES.map((t, k) => (
        <Sfx key={t.key} name="click" at={gather + 15 + k * 3} db={-10} />
      ))}
      {Array.from({ length: URL.length }).map((_, i) => {
        const at = Math.round(interpolate(i, [0, URL.length], [typeStart, enter - 4]));
        return i % 2 === 0 ? <Sfx key={i} name="key" at={at} db={-12} duration={6} /> : null;
      })}
      <Sfx name="click-signature" at={enter - 1} db={0} />
      <Sfx name="whoosh" at={T.dur - 9} db={-4} />
    </AbsoluteFill>
  );
};
