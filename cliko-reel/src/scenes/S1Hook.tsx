import React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "../brand";
import { Box3D } from "../components/Box3D";
import { Dot } from "../components/Brand";
import { ScreenVideo } from "../components/Devices3D";
import { RailScrim } from "../components/Captions";
import { Sfx } from "../components/Sound";
import { beatsFor, Hook, useScene, useTimeline } from "../timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Géométrie du monde (px CSS) : le tapis court le long de x, la caméra plonge à 54°.
const SPACING = 360;
const PW = 270; // page posée à plat : largeur le long du tapis
const PD = 430; // longueur en travers du tapis (devient la hauteur une fois redressée)
const TILT = 58;
const TURN = -34;
const PERSP = 1150;
const ORIGIN = "540px 560px";
const PRESS_UP = 300;
const PRESS_DOWN = 14;

// Page-modèle grise, identique pour toutes : nav, bloc image, lignes, bouton.
const Template: React.FC<{ stamp: number; label: string; big?: boolean }> = ({ stamp, label, big }) => (
  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #d7dce6 0%, #c3c9d6 100%)", padding: 18, fontFamily: FONT.display }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ width: 70, height: 12, borderRadius: 6, background: "#9aa3b5" }} />
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map((i) => <div key={i} style={{ width: 22, height: 6, borderRadius: 3, background: "#aab2c2" }} />)}
      </div>
    </div>
    <div style={{ marginTop: 22, height: 132, borderRadius: 10, background: "linear-gradient(135deg, #a9b1c1, #bcc3d0)" }} />
    <div style={{ marginTop: 18, width: "86%", height: 16, borderRadius: 5, background: "#8f98ab" }} />
    <div style={{ marginTop: 9, width: "64%", height: 16, borderRadius: 5, background: "#8f98ab" }} />
    <div style={{ marginTop: 16, width: "92%", height: 8, borderRadius: 4, background: "#adb5c4" }} />
    <div style={{ marginTop: 7, width: "78%", height: 8, borderRadius: 4, background: "#adb5c4" }} />
    <div style={{ marginTop: 16, width: 96, height: 30, borderRadius: 15, background: "#9aa3b5" }} />
    <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {[0, 1, 2, 3].map((i) => <div key={i} style={{ height: 44, borderRadius: 8, background: "#b7bfcc" }} />)}
    </div>
    {/* tampon industriel */}
    <div
      style={{
        position: "absolute", left: big ? 24 : 34, bottom: big ? 120 : 96, padding: big ? "8px 14px" : "6px 12px",
        border: `${big ? 5 : 4}px solid rgba(58,66,84,.85)`, borderRadius: 6, color: "rgba(58,66,84,.88)",
        fontFamily: FONT.mono, fontWeight: 700, fontSize: big ? 34 : 22, letterSpacing: "0.06em",
        transform: `rotate(-9deg) scale(${1.4 - 0.4 * stamp})`, opacity: stamp, whiteSpace: "nowrap",
        mixBlendMode: "multiply",
      }}
    >
      {label}
    </div>
  </div>
);

export const S1Hook: React.FC<{ hook: Hook; silent?: boolean }> = ({ hook, silent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tl = useTimeline();
  const T = useScene("accroche");
  const sceneEnd = T.dur;

  // Grille de beat (frames relatives : l'accroche commence à 0).
  const beats = beatsFor(tl).map((b) => b * fps).filter((b) => b < sceneEnd + 20);
  beats.unshift(beats[0] - (beats[1] - beats[0])); // un temps avant le début : la presse est déjà en bas au frame 0
  const rescueWord = hook === "A" ? T.at("chaîne") : T.at("pas");
  const colorWord = hook === "A" ? T.at("chaîne") : T.at("nous");
  const R = beats.reduce((best, b) => (Math.abs(b - rescueWord) < Math.abs(best - rescueWord) ? b : best), Infinity);
  const moves = beats.filter((b) => b + 13 <= R + 0.5 && b >= -1);
  const H = moves.length; // index de la page qui porte le point

  // Avance du tapis : un cran par temps, pendant [b+5, b+13].
  const p = moves.reduce((acc, b) => acc + inOut(interpolate(frame, [b + 5, b + 13], [0, 1], clamp)), 0);
  const speed = moves.reduce((acc, b) => {
    const t = (frame - (b + 5)) / 8;
    return t > 0 && t < 1 ? acc + Math.sin(Math.PI * t) : acc;
  }, 0);

  // Presse : descente sèche avant le temps, impact sur le temps, remontée.
  const pressFor = (f: number) => {
    let z = PRESS_UP;
    for (const b of beats) {
      if (b > R - 0.5) break;
      const d = f - b;
      if (d >= -3 && d < 0) z = Math.min(z, interpolate(d, [-3, 0], [PRESS_UP, PRESS_DOWN], { easing: (x) => x * x }));
      else if (d >= 0 && d < 2) z = PRESS_DOWN;
      else if (d >= 2 && d < 9) z = Math.min(z, interpolate(d, [2, 9], [PRESS_DOWN, PRESS_UP], { easing: (x) => 1 - (1 - x) * (1 - x) }));
    }
    // sauvetage : la presse descend sur la page au point, et se fige à quelques centimètres
    const dr = f - R;
    if (dr >= -3) z = dr < -1 ? interpolate(dr, [-3, -1], [PRESS_UP, 110], { easing: (x) => x * x }) : 110 + Math.sin(dr * 2.4) * 6 * Math.exp(-Math.max(0, dr) / 5);
    return z;
  };
  const pressZ = pressFor(frame);
  const shake = beats.some((b) => b < R && frame - b >= 0 && frame - b < 3) ? Math.sin(frame * 9) * 3 : 0;

  // Moment héros : clic du point, la couleur envahit la page, elle se redresse et fonce vers la caméra.
  const click = spring({ frame: frame - (R - 1), fps, config: { stiffness: 380, damping: 14, mass: 0.5 } });
  const color = interpolate(frame, [colorWord + 1, colorWord + 12], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const lift = spring({ frame: frame - (colorWord + 3), fps, config: { stiffness: 120, damping: 16, mass: 0.8 } });
  const toCam = interpolate(frame, [colorWord + 5, sceneEnd], [0, 560], { ...clamp, easing: (x) => x * x });
  const through = interpolate(frame, [sceneEnd - 6, sceneEnd], [0, 1], { ...clamp, easing: (x) => x * x });
  const freeze = frame >= R - 1; // la machine s'arrête net

  const labelFor = (i: number) => (hook === "A" ? `MODÈLE N° ${String(340 + i).padStart(4, "0")}` : `N° ${String(344 + i).padStart(5, "0")}`);
  const stampAt = (i: number) => (i < 0 ? -999 : moves[i] ?? beats[i] ?? 9999);

  // Caméra : plan de poursuite sur la page au point ambre, qui avance vers la presse ; léger travelling avant.
  const camT = interpolate(frame, [0, R - 4], [0, 1], { ...clamp, easing: (x) => x * x * (3 - 2 * x) });
  const focusX = SPACING * H * (1 - camT);
  const dolly = interpolate(frame, [0, R * 0.45, R - 2], [90, -40, 150], { ...clamp, easing: (x) => x * x * (3 - 2 * x) }) + interpolate(frame, [R - 2, R + 8], [0, 50], clamp);
  const world = `translateZ(${dolly}px) rotateX(${TILT}deg) rotateZ(${TURN}deg) translate(${-focusX}px, 0px)`;

  const plates = [];
  for (let i = Math.floor(p) - 6; i <= Math.floor(p) + 9; i++) {
    const x = (i - p) * SPACING;
    if (i === H && lift > 0.001) continue;
    const dist = Math.abs(x - focusX) / SPACING;
    const blur = Math.min(7, Math.max(0, dist - 0.6) * 2.2) + speed * 2.4;
    const st = interpolate(frame, [stampAt(i) - 0.5, stampAt(i) + 1.5], [0, 1], clamp);
    plates.push(
      <Box3D key={i} w={PW} d={PD} h={10} x={x} y={0} z={2} top="#c9cfda" front="linear-gradient(90deg,#8a93a6,#a7afbf)" side="#7d8699">
        <div style={{ position: "absolute", inset: 0, filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
          <Template stamp={i < H ? st : 0} label={labelFor(i)} big={hook === "B"} />
          {i === H && (
            <>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(90% 60% at 86% 8%, rgba(255,196,107,.55), rgba(255,196,107,.12) 60%, transparent 85%)", mixBlendMode: "screen" }} />
              <Dot size={44} glow={1.8} style={{ position: "absolute", right: 16, top: 12 }} />
            </>
          )}
        </div>
      </Box3D>,
    );
  }

  const heroX = (H - p) * SPACING;
  const neonFlicker = (k: number) => (Math.sin(frame * 1.7 + k * 3.1) > 0.97 ? 0.35 : 1);
  const sign = hook === "A" ? "FAIT À LA CHAÎNE" : "PRENEZ UN NUMÉRO";
  const signOff = interpolate(frame, [R - 1, R + 1], [1, 0.12], clamp);
  const counter = hook === "B" ? `N° ${String(344 + Math.min(H, Math.floor(p + 0.5))).padStart(5, "0")}` : null;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* faisceaux froids */}
      <AbsoluteFill style={{ background: "linear-gradient(104deg, transparent 18%, rgba(170,190,230,.10) 26%, transparent 34%), linear-gradient(98deg, transparent 52%, rgba(170,190,230,.08) 60%, transparent 68%)", mixBlendMode: "screen" }} />

      {/* le monde : tapis, pages, presse */}
      <AbsoluteFill style={{ perspective: PERSP, perspectiveOrigin: ORIGIN, transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
        <div style={{ position: "absolute", left: 540, top: 820, transformStyle: "preserve-3d", transform: world }}>
          {/* tapis */}
          <div
            style={{
              position: "absolute", left: -2800, top: -300, width: 5600, height: 600,
              background: `repeating-linear-gradient(90deg, #171b25 0 34px, #0f121a 34px 38px)`,
              backgroundPositionX: `${-p * SPACING}px`,
              boxShadow: "inset 0 18px 30px rgba(0,0,0,.55), inset 0 -18px 30px rgba(0,0,0,.55)",
            }}
          />
          {/* rails latéraux */}
          <Box3D w={5600} d={26} h={34} y={-313} z={-6} top="linear-gradient(90deg,#3a4254,#7d879c 50%,#3a4254)" front="#2a3040" side="#2a3040" />
          <Box3D w={5600} d={26} h={34} y={313} z={-6} top="linear-gradient(90deg,#3a4254,#8e98ad 50%,#3a4254)" front="linear-gradient(180deg,#5b6478,#1d2230)" side="#2a3040" />
          {/* flaque de lumière chaude sous la page au point : l'anomalie se voit dès la miniature */}
          <div style={{ position: "absolute", left: (H - p) * SPACING - 420, top: -420, width: 840, height: 840, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,196,107,.34) 0%, rgba(255,196,107,.12) 38%, transparent 68%)", transform: "translateZ(1px)", opacity: lift > 0.001 ? 0 : 1 }} />
          {plates}
          {/* presse */}
          <div style={{ position: "absolute", left: 0, top: 0, transformStyle: "preserve-3d" }}>
            {[-130, 130].map((px) => (
              <Box3D key={px} w={42} d={42} h={1600} x={px} y={-40} z={pressZ + 150} top="#3a4152" front="linear-gradient(90deg,#1c212c,#5b6476 40%,#262c39 70%,#1c212c)" side="#151922" />
            ))}
            <Box3D
              w={340} d={500} h={150} x={0} y={0} z={pressZ + 10}
              top="linear-gradient(135deg,#4b5367,#2b3142)"
              front="linear-gradient(180deg,#5d667c 0%,#323a4c 100%)"
              side="linear-gradient(180deg,#465064,#272d3b)"
            >
              <div style={{ position: "absolute", inset: 16, border: "2px solid rgba(160,175,205,.25)", borderRadius: 6 }} />
              <div style={{ position: "absolute", left: 30, top: 30, padding: "6px 12px", border: "2px solid rgba(190,205,235,.35)", borderRadius: 4, fontFamily: FONT.mono, fontWeight: 600, fontSize: 22, letterSpacing: "0.12em", color: "rgba(214,224,245,.75)" }}>PRESSE 01</div>
              <div style={{ position: "absolute", left: 24, right: 24, bottom: 22, height: 6, borderRadius: 3, background: "#cfe0ff", boxShadow: "0 0 14px rgba(190,215,255,.95), 0 0 34px rgba(140,175,255,.6)" }} />
            </Box3D>
          </div>
        </div>
      </AbsoluteFill>

      {/* page sauvée : se redresse face caméra, la couleur jaillit du point */}
      {lift > 0.001 && (
        <AbsoluteFill style={{ perspective: PERSP, perspectiveOrigin: ORIGIN }}>
          <div style={{ position: "absolute", left: 540, top: 820, transformStyle: "preserve-3d", transform: world }}>
            <div
              style={{
                position: "absolute", left: heroX - PW / 2, top: -PD / 2, width: PW, height: PD,
                transformStyle: "preserve-3d",
                transform: `translateZ(${12 + 260 * lift}px) rotateZ(${-TURN * lift}deg) rotateX(${-TILT * lift}deg) translateZ(${toCam}px)`,
              }}
            >
              <div style={{ position: "absolute", inset: 0, borderRadius: 10, overflow: "hidden", boxShadow: `0 ${30 + 40 * lift}px ${60 + 60 * lift}px rgba(0,0,0,.55), 0 0 ${80 * color}px rgba(255,196,107,${0.35 * color})` }}>
                <Template stamp={0} label="" />
                <div style={{ position: "absolute", inset: 0, clipPath: `circle(${color * 135}% at 88% 6%)` }}>
                  <ScreenVideo src="captures/mobile-hero.mp4" trimBefore={Math.round(0.5 * fps)} />
                </div>
                <Dot size={44} glow={1.8 + 2 * (1 - color)} style={{ position: "absolute", right: 16, top: 12, transform: `scale(${1 + click * 0.6 - color * 0.6})`, opacity: 1 - color * 0.9 }} />
              </div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* traversée : la page vivante remplit le cadre, flash ambré vers la scène 2 */}
      {through > 0 && (
        <AbsoluteFill style={{ background: `radial-gradient(70% 50% at 50% 50%, rgba(255,232,190,${through}) 0%, rgba(255,196,107,${through * 0.9}) 40%, rgba(11,16,32,${through}) 100%)` }} />
      )}
      {/* éclair du clic */}
      <AbsoluteFill style={{ background: "radial-gradient(60% 40% at 50% 48%, rgba(255,212,143,.55), transparent 70%)", opacity: interpolate(frame, [R - 1, R + 1, R + 9], [0, 1, 0], clamp), mixBlendMode: "screen" }} />

      {/* néon industriel */}
      <div style={{ position: "absolute", left: 0, right: 150, top: 262, display: "flex", justifyContent: "center", opacity: freeze ? signOff : 1 }}>
        <div style={{ position: "relative", padding: "18px 34px", borderRadius: 14, border: "1.5px solid rgba(190,205,235,.25)", background: "rgba(20,26,40,.55)" }}>
          <div style={{ position: "absolute", left: 60, top: -300, width: 2, height: 300, background: "rgba(150,165,195,.35)" }} />
          <div style={{ position: "absolute", right: 60, top: -300, width: 2, height: 300, background: "rgba(150,165,195,.35)" }} />
          <div style={{ fontFamily: FONT.mono, fontWeight: 600, fontSize: 60, letterSpacing: "0.12em", color: "#f2f6ff", textShadow: "0 0 6px rgba(220,232,255,1), 0 0 18px rgba(170,195,255,.9), 0 0 48px rgba(120,150,255,.6)", display: "flex" }}>
            {sign.split("").map((ch, k) => (
              <span key={k} style={{ opacity: neonFlicker(k), whiteSpace: "pre" }}>{ch}</span>
            ))}
          </div>
          {counter && (
            <div style={{ marginTop: 8, textAlign: "center", fontFamily: FONT.mono, fontWeight: 700, fontSize: 40, color: "#ffd9a0", textShadow: "0 0 18px rgba(255,190,110,.7)" }}>{counter}</div>
          )}
        </div>
      </div>

      {/* poussières en suspension dans les faisceaux */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {Array.from({ length: 46 }).map((_, k) => {
          const x0 = (k * 397) % 1080;
          const y0 = (k * 613) % 1500;
          const y = (y0 - frame * (0.4 + (k % 5) * 0.12) + 1500) % 1500 + 150;
          const x = x0 + Math.sin(frame / 25 + k) * 14;
          const a = 0.18 + 0.32 * ((k * 37) % 10) / 10;
          return <div key={k} style={{ position: "absolute", left: x, top: y, width: 3 + (k % 3), height: 3 + (k % 3), borderRadius: "50%", background: "#dfe8ff", opacity: freeze ? a * 0.5 : a, filter: k % 4 === 0 ? "blur(2px)" : undefined }} />;
        })}
      </AbsoluteFill>
      {/* brume de profondeur + vignette */}
      <AbsoluteFill style={{ background: "linear-gradient(200deg, rgba(14,18,30,.75) 0%, transparent 38%), radial-gradient(90% 60% at 45% 60%, transparent 50%, rgba(3,5,10,.7) 100%)" }} />
      <RailScrim strength={0.9} />

      {/* son */}
      {!silent && (
        <>
      <Sfx name="conveyor" at={0} duration={Math.max(1, Math.round(R))} db={-6} />
      {beats.filter((b) => b < R - 0.5).map((b, k) => (
        <Sfx key={k} name="stamp" at={Math.max(0, Math.round(b) - 1)} db={k === 0 ? 2 : -3} />
      ))}
      <Sfx name="click-signature" at={Math.round(R) - 1} db={2} />
      <Sfx name="riser" at={Math.round(R) - 14} db={-8} />
      <Sequence from={Math.round(colorWord + 4)} layout="none">
        <Sfx name="whoosh-deep" at={0} db={0} />
      </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};
