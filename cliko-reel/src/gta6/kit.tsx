// Boîte à outils visuelle du short GTA 6 : palette « Miami de nuit », ciel synthwave, textes qui claquent, compteurs.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { noise2D } from "@remotion/noise";
import { FONT } from "../brand";

export const C = {
  night: "#0d0519",
  plum: "#2a0b45",
  violet: "#5a1a8c",
  pink: "#ff2d87",
  hot: "#ff4fa3",
  orange: "#ff8a3d",
  yellow: "#ffd23f",
  teal: "#2ee6d6",
  white: "#fff6fb",
  twitch: "#9146ff",
  youtube: "#ff1f1f",
  kick: "#53fc18",
};
export const DISPLAY = FONT.display;
export const MONO = FONT.mono;
export const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const ease = {
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  expo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  io: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};
export const ramp = (f: number, a: number, b: number, e = ease.out) => interpolate(f, [a, b], [0, 1], { ...CL, easing: e });

// Ressort « pop » (0 → 1 avec léger dépassement) à partir de la frame `at`.
export const usePop = (at: number, damping = 11, stiffness = 170) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - at, fps, config: { damping, stiffness, mass: 0.7 } });
};

// Nombre au format français : 3 000 000
export const fr = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// ---------------------------------------------------------------------------------------------
// Ciel synthwave : dégradé de nuit, soleil rayé, grille au sol qui défile, palmiers, étoiles.
export const Sky: React.FC<{ hue?: number; sunY?: number; zoom?: number; dim?: number }> = ({ hue = 0, sunY = 1040, zoom = 1, dim = 0 }) => {
  const f = useCurrentFrame();
  const stars = React.useMemo(
    () => Array.from({ length: 70 }, (_, i) => ({ x: (i * 397) % 1080, y: (i * 211) % 900, r: 1 + ((i * 7) % 3), p: i * 0.7 })),
    [],
  );
  return (
    <AbsoluteFill style={{ filter: `hue-rotate(${hue}deg)`, transform: `scale(${zoom})`, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.night} 0%, ${C.plum} 38%, #7a1a6e 52%, ${C.pink} 58%, ${C.night} 58.2%)` }} />
      {stars.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, borderRadius: 9, background: "#fff", opacity: 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(f / 12 + s.p)) }} />
      ))}
      {/* soleil rayé */}
      <div
        style={{
          position: "absolute", left: 540 - 300, top: sunY - 470, width: 600, height: 600, borderRadius: "50%",
          background: `linear-gradient(180deg, ${C.yellow} 0%, ${C.orange} 45%, ${C.pink} 100%)`,
          WebkitMaskImage: "linear-gradient(180deg, #000 0 52%, transparent 52% 56%, #000 56% 66%, transparent 66% 71%, #000 71% 79%, transparent 79% 85%, #000 85% 91%, transparent 91%)",
          boxShadow: `0 0 160px 40px rgba(255,45,135,.45)`,
        }}
      />
      {/* grille au sol (perspective dessinée en SVG) */}
      <svg width={1080} height={810} viewBox="0 0 1080 810" style={{ position: "absolute", left: 0, top: 1115, filter: `drop-shadow(0 0 6px ${C.pink})` }}>
        {Array.from({ length: 23 }, (_, i) => {
          const x = (i - 11) * 260;
          return <line key={"v" + i} x1={540 + x * 0.04} y1={0} x2={540 + x * 1.6} y2={810} stroke={C.hot} strokeWidth={3} opacity={0.6} />;
        })}
        {Array.from({ length: 14 }, (_, i) => {
          const p = ((i + (f * 0.045) % 1) / 14);
          const y = 810 * Math.pow(p, 2.2);
          return <line key={"h" + i} x1={0} y1={y} x2={1080} y2={y} stroke={C.hot} strokeWidth={1.5 + p * 3} opacity={0.25 + p * 0.5} />;
        })}
        <rect x={0} y={0} width={1080} height={810} fill="url(#fade)" />
        <defs>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.night} stopOpacity={0.9} />
            <stop offset="0.25" stopColor={C.night} stopOpacity={0} />
            <stop offset="0.8" stopColor={C.night} stopOpacity={0.2} />
            <stop offset="1" stopColor={C.night} stopOpacity={0.85} />
          </linearGradient>
        </defs>
      </svg>
      <Palm x={-60} y={520} s={1.25} flip={false} sway={Math.sin(f / 28) * 2} />
      <Palm x={790} y={600} s={1.05} flip sway={Math.sin(f / 31 + 1) * 2} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(5,0,12,.75) 100%)` }} />
      <AbsoluteFill style={{ background: C.night, opacity: dim }} />
    </AbsoluteFill>
  );
};

const Palm: React.FC<{ x: number; y: number; s: number; flip: boolean; sway: number }> = ({ x, y, s, flip, sway }) => (
  <svg
    width={420} height={900} viewBox="0 0 420 900"
    style={{ position: "absolute", left: x, top: y, transform: `scale(${flip ? -s : s}, ${s}) rotate(${sway}deg)`, transformOrigin: "50% 100%" }}
  >
    <path d="M205 900 C 215 700, 190 500, 230 250" stroke="#12041f" strokeWidth={26} fill="none" strokeLinecap="round" />
    {[-150, -110, -60, -15, 30, 75, 120].map((a, i) => (
      <path key={i} transform={`rotate(${a} 230 250)`} d="M230 250 C 260 180, 330 160, 400 200 C 330 185, 280 205, 230 250 Z" fill="#12041f" />
    ))}
  </svg>
);

// ---------------------------------------------------------------------------------------------
// Texte qui claque : arrive de très grand, flou, puis se pose (avec dépassement).
export const Slam: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; from?: number }> = ({ at, children, style, from = 2.6 }) => {
  const f = useCurrentFrame();
  const t = ramp(f, at, at + 7, ease.expo);
  if (f < at) return null;
  const scale = interpolate(t, [0, 1], [from, 1]);
  return (
    <div style={{ transform: `scale(${scale})`, filter: `blur(${(1 - t) * 14}px)`, opacity: Math.min(1, t * 3), ...style }}>{children}</div>
  );
};

// Tampon incliné (« RECORD », « CONGÉ »…)
export const Stamp: React.FC<{ at: number; text: string; color?: string; rot?: number; size?: number; style?: React.CSSProperties }> = ({ at, text, color = C.yellow, rot = -7, size = 92, style }) => {
  const f = useCurrentFrame();
  const t = ramp(f, at, at + 6, ease.expo);
  if (f < at) return null;
  return (
    <div
      style={{
        display: "inline-block", transform: `rotate(${rot}deg) scale(${interpolate(t, [0, 1], [2.2, 1])})`, opacity: t,
        border: `10px solid ${color}`, color, borderRadius: 18, padding: "8px 30px", fontFamily: DISPLAY, fontWeight: 900,
        fontSize: size, letterSpacing: -1, textTransform: "uppercase", boxShadow: `0 0 40px ${color}55, inset 0 0 30px ${color}33`,
        textShadow: `0 0 24px ${color}88`, background: "rgba(13,5,25,.55)", ...style,
      }}
    >
      {text}
    </div>
  );
};

// Gros texte de titre, dégradé coucher de soleil
export const Big: React.FC<{ children: React.ReactNode; size: number; style?: React.CSSProperties; grad?: string }> = ({ children, size, style, grad }) => (
  <div
    style={{
      fontFamily: DISPLAY, fontWeight: 900, fontSize: size, lineHeight: 0.92, letterSpacing: -size * 0.04, textTransform: "uppercase",
      color: grad ? "transparent" : C.white, backgroundImage: grad, WebkitBackgroundClip: grad ? "text" : undefined, backgroundClip: grad ? "text" : undefined,
      filter: grad ? `drop-shadow(0 6px 0 ${C.night}) drop-shadow(0 0 30px rgba(255,45,135,.55))` : `drop-shadow(0 6px 0 ${C.night})`,
      transform: "skewX(-6deg)", ...style,
    }}
  >
    {children}
  </div>
);
export const SUNSET = `linear-gradient(180deg, ${C.yellow} 0%, ${C.orange} 45%, ${C.pink} 100%)`;
export const NEON = `linear-gradient(180deg, #ffffff 0%, ${C.teal} 100%)`;

// Compteur qui monte de 0 à `to` entre `at` et `at + dur`, avec tics visuels.
export const Counter: React.FC<{ at: number; dur?: number; to: number; suffix?: string; size: number; grad?: string }> = ({ at, dur = 26, to, suffix = "", size, grad = SUNSET }) => {
  const f = useCurrentFrame();
  const t = ramp(f, at, at + dur, ease.expo);
  const done = f >= at + dur;
  const bump = done ? 1 + 0.08 * Math.max(0, 1 - (f - at - dur) / 8) : 1;
  return (
    <div style={{ transform: `scale(${bump})`, opacity: f >= at ? 1 : 0, fontVariantNumeric: "tabular-nums" }}>
      <Big size={size} grad={grad}>
        {fr(to * t)}
        {done ? suffix : ""}
      </Big>
    </div>
  );
};

// Pilule « ● EN DIRECT »
export const LivePill: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 14, background: "#e3122d", color: "#fff", borderRadius: 14, padding: "10px 22px", fontFamily: DISPLAY, fontWeight: 900, fontSize: 40, letterSpacing: 1 }}>
    <div style={{ width: 18, height: 18, borderRadius: 9, background: "#fff", opacity: 0.4 + 0.6 * Math.abs(Math.sin(f / 8)) }} />
    EN DIRECT
  </div>
);

export const Person: React.FC<{ color: string; size?: number }> = ({ color, size = 150 }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 100 130">
    <circle cx={50} cy={30} r={24} fill={color} />
    <path d="M8 130 C 8 80, 92 80, 92 130 Z" fill={color} />
  </svg>
);

// Petit tremblement de caméra, décroissant après `at`
export const shake = (f: number, at: number, amp = 18, len = 10) => {
  const k = Math.max(0, 1 - (f - at) / len) * (f >= at ? 1 : 0);
  return { x: noise2D("sx", f * 0.9, at) * amp * k, y: noise2D("sy", f * 0.9, at) * amp * k };
};

export const Label: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 52, color: C.white, textTransform: "uppercase", letterSpacing: 1, textShadow: `0 4px 0 ${C.night}, 0 0 20px rgba(0,0,0,.6)`, ...style }}>{children}</div>
);
export const Note: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 26, color: "rgba(255,246,251,.72)", letterSpacing: 0.5, ...style }}>{children}</div>
);
