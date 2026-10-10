import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../brand";
import { Icon, IconName, IconTile } from "../components/Icons";
import { Phone } from "../components/Devices";
import { useScene } from "../timeline";
import { clamp, ease, jitter, lerp, sp } from "../utils";

const CX = 540;
const CY = 760;

// Positions des icônes autour du téléphone (relatives au centre), puis dérive « éparpillé » ×1,3.
const ICONS: { name: IconName; word: string; x: number; y: number; rot: number; seed: number; bg: string }[] = [
  { name: "thumb", word: "facebook", x: -270, y: -400, rot: -14, seed: 1, bg: "#E6EEFF" },
  { name: "pin", word: "google", x: 280, y: -300, rot: 12, seed: 2, bg: "#FFE9E2" },
  { name: "camera", word: "photos", x: -280, y: 300, rot: 9, seed: 3, bg: "#FFF4D6" },
  { name: "phone", word: "téléphone", x: 270, y: 380, rot: -10, seed: 4, bg: "#E3F6EA" },
];
const SPREAD = 1.3;

const iconPos = (i: number, frame: number) => {
  const ic = ICONS[i];
  return {
    x: CX + ic.x * SPREAD + jitter(frame, ic.seed, 6),
    y: CY + ic.y * SPREAD + jitter(frame, ic.seed + 7, 6),
    rot: ic.rot * SPREAD + jitter(frame, ic.seed + 3, 3.6),
  };
};

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useScene("probleme");
  const scatter = sp(frame, fps, T.at("éparpillé") - 2, { damping: 10, stiffness: 120 });
  const phoneIn = sp(frame, fps, -4, { damping: 15 });
  const shake = interpolate(scatter, [0, 1], [2, 6]);

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: CX - 170, top: CY - 350, transform: `translateY(${(1 - phoneIn) * 500}px) rotate(${jitter(frame, 9, 0.6 * scatter)}deg)`, filter: `saturate(${1 - scatter * 0.8})` }}>
        <Phone width={340}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#2B2E35,#15161A)" }} />
          <div style={{ position: "absolute", top: 120, left: 30, right: 30, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 22 }}>
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: "1", borderRadius: 16, background: "rgba(255,255,255,.1)" }} />
            ))}
          </div>
        </Phone>
      </div>
      {/* vignettes photo qui accompagnent l'appareil photo */}
      {[0, 1, 2].map((k) => {
        const s = sp(frame, fps, T.at("photos") + 3 + k * 3, { damping: 12 });
        const x = CX - 300 + k * 70 + jitter(frame, 20 + k, 4) - 150 * scatter;
        const y = CY + 560 - k * 20 + 60 * scatter;
        return (
          <div key={k} style={{ position: "absolute", left: x, top: y - 400 * (1 - s), width: 130, height: 100, borderRadius: 14, border: "6px solid #fff", boxShadow: "0 16px 30px -8px rgba(0,0,0,.3)", background: ["linear-gradient(135deg,#F7B267,#F4845F)", "linear-gradient(135deg,#7FB7BE,#3D5A80)", "linear-gradient(135deg,#C9ADA7,#9A8C98)"][k], transform: `rotate(${(k - 1) * 14 + jitter(frame, 30 + k, 3)}deg) scale(${s})`, opacity: s }} />
        );
      })}
      {ICONS.map((ic, i) => {
        const s = sp(frame, fps, T.at(ic.word), { damping: 11, stiffness: 180 });
        const ring = ic.name === "phone" ? jitter(frame * 3, 5, 6) * interpolate(frame - T.at(ic.word), [0, 12, 20], [1, 1, 0], clamp) : 0;
        const k = lerp(1, SPREAD, scatter);
        const x = CX + ic.x * k * s + jitter(frame, ic.seed, shake);
        const y = CY + ic.y * k * s + jitter(frame, ic.seed + 7, shake);
        return (
          <div key={ic.name} style={{ position: "absolute", left: x - 85, top: y - 85, transform: `rotate(${ic.rot * s * k + jitter(frame, ic.seed + 3, shake * 0.6) + ring}deg) scale(${0.3 + 0.7 * s})`, opacity: Math.min(1, s * 2), filter: `blur(${Math.max(0, (1 - s) * 8)}px)` }}>
            <IconTile name={ic.name} bg={ic.bg} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const URL = "votrecommerce.be";
const BAR_W = 800;
const BAR_X = (1080 - BAR_W) / 2 - 20;

export const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useScene("solution");
  const barIn = sp(frame, fps, 2, { damping: 13, stiffness: 140 });
  const typeStart = T.at("une");
  const enter = T.at("vôtre");
  const typed = Math.floor(interpolate(frame, [typeStart, enter - 3], [0, URL.length], clamp));
  const valid = sp(frame, fps, enter, { damping: 9, stiffness: 260, mass: 0.5 });
  const ringT = interpolate(frame - enter, [0, 18], [0, 1], { ...clamp, easing: ease });
  const dock = { x: BAR_X + 70, y: CY };

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute", left: BAR_X, top: CY - 70, width: BAR_W, height: 140, borderRadius: 70, background: C.white,
          transform: `scale(${(0.6 + 0.4 * barIn) * (1 + 0.05 * Math.sin(Math.PI * Math.min(1, valid)))})`,
          boxShadow: `0 40px 80px -24px rgba(18,18,20,.35), 0 0 0 ${6 * valid}px ${C.accent}, 0 0 ${80 * valid}px ${C.accent}66`,
          display: "flex", alignItems: "center", paddingLeft: 140, opacity: barIn,
        }}
      >
        <span style={{ fontFamily: F.text, fontWeight: 700, fontSize: 58, color: C.ink, letterSpacing: -1 }}>
          {URL.slice(0, typed)}
        </span>
        <span style={{ width: 5, height: 64, background: C.accent, marginLeft: 4, opacity: frame < enter && Math.floor(frame / 8) % 2 === 0 ? 1 : 0 }} />
        <div style={{ position: "absolute", right: 22, width: 96, height: 96, borderRadius: 48, background: valid > 0.05 ? C.accent : C.ink, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 - 0.15 * Math.sin(Math.PI * Math.min(1, valid))})` }}>
          <Icon name={valid > 0.05 ? "check" : "lock"} size={48} color="#fff" stroke={3} />
        </div>
      </div>
      {/* anneau de choc à la validation */}
      {frame >= enter && (
        <div style={{ position: "absolute", left: 540 - 20, top: CY, width: 0, height: 0 }}>
          <div style={{ position: "absolute", left: -(BAR_W / 2) * (1 + ringT * 0.35), top: -70 * (1 + ringT * 1.6), width: BAR_W * (1 + ringT * 0.35), height: 140 * (1 + ringT * 1.6), borderRadius: 999, border: `5px solid ${C.accent}`, opacity: 1 - ringT }} />
        </div>
      )}
      {/* icônes aspirées vers la barre */}
      {ICONS.map((ic, i) => {
        const start = iconPos(i, frame);
        const t = interpolate(frame, [T.at("rassemble") - 2 + i * 3, T.at("rassemble") + 12 + i * 3], [0, 1], { ...clamp, easing: (x) => x * x * x });
        const ctrl = { x: lerp(start.x, dock.x, 0.2) + (i % 2 ? 160 : -160), y: lerp(start.y, dock.y, 0.7) };
        const x = (1 - t) ** 2 * start.x + 2 * (1 - t) * t * ctrl.x + t * t * dock.x;
        const y = (1 - t) ** 2 * start.y + 2 * (1 - t) * t * ctrl.y + t * t * dock.y;
        const vel = Math.sin(Math.PI * t);
        const docked = t >= 1;
        return (
          <div key={ic.name} style={{ position: "absolute", left: x - 85, top: y - 85, transform: `rotate(${start.rot * (1 - t)}deg) scale(${lerp(1, 0.48, t)})`, filter: `blur(${vel * 10}px)`, opacity: docked ? (i === 3 ? 1 : 0) : 1, zIndex: 2 }}>
            <IconTile name={docked ? "pin" : ic.name} bg={docked ? C.accentSoft : ic.bg} color={docked ? C.accent : C.ink} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
