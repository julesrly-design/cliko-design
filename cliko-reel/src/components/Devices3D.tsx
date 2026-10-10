import React from "react";
import { Video } from "@remotion/media";
import { staticFile } from "remotion";

// Appareils en CSS 3D « épais » : la tranche est faite de couches empilées en Z,
// ce qui donne une vraie épaisseur quand l'appareil pivote, sans WebGL.

type Pose = { rotateX?: number; rotateY?: number; rotateZ?: number };

const Slices: React.FC<{ w: number; h: number; r: number; depth: number; n?: number; dark?: string; light?: string }> = ({
  w, h, r, depth, n = 12, dark = "#1a1d27", light = "#4a5266",
}) => (
  <>
    {Array.from({ length: n }).map((_, i) => {
      const k = i / (n - 1);
      // reflet métallique : plus clair au milieu de la tranche
      const shade = Math.sin(Math.PI * k);
      return (
        <div
          key={i}
          style={{
            position: "absolute", left: 0, top: 0, width: w, height: h, borderRadius: r,
            background: `linear-gradient(135deg, ${light} 0%, ${dark} ${40 + shade * 20}%, ${light} 100%)`,
            transform: `translateZ(${-depth / 2 + k * depth}px)`,
            opacity: 0.999,
          }}
        />
      );
    })}
  </>
);

// Reflet de vitre qui glisse avec la rotation.
const Glare: React.FC<{ angle: number; radius: number }> = ({ angle, radius }) => {
  const pos = 30 + angle * 2.2;
  return (
    <div
      style={{
        position: "absolute", inset: 0, borderRadius: radius, pointerEvents: "none",
        background: `linear-gradient(115deg, transparent ${pos - 28}%, rgba(255,255,255,.16) ${pos - 6}%, rgba(255,255,255,.05) ${pos}%, transparent ${pos + 18}%)`,
        mixBlendMode: "screen",
      }}
    />
  );
};

export const ScreenVideo: React.FC<{ src: string; playbackRate?: number; trimBefore?: number; style?: React.CSSProperties }> = ({ src, playbackRate = 1, trimBefore = 0, style }) => (
  <Video
    src={staticFile(src)}
    muted
    playbackRate={playbackRate}
    trimBefore={trimBefore}
    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", ...style }}
  />
);

export const Phone3D: React.FC<Pose & { width: number; children?: React.ReactNode; screenBg?: string; style?: React.CSSProperties }> = ({
  width, rotateX = 0, rotateY = 0, rotateZ = 0, children, screenBg = "#05070f", style,
}) => {
  const h = width * 2.07;
  const r = width * 0.155;
  const depth = width * 0.085;
  const bezel = width * 0.032;
  return (
    <div style={{ width, height: h, position: "relative", transformStyle: "preserve-3d", transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`, ...style }}>
      <Slices w={width} h={h} r={r} depth={depth} />
      {/* face avant */}
      <div style={{ position: "absolute", inset: 0, borderRadius: r, background: "#07080d", transform: `translateZ(${depth / 2 + 0.5}px)`, boxShadow: "inset 0 0 0 2px #3b4152" }}>
        <div style={{ position: "absolute", inset: bezel, borderRadius: r - bezel, overflow: "hidden", background: screenBg }}>
          {children}
          <div style={{ position: "absolute", top: width * 0.03, left: "50%", width: width * 0.3, height: width * 0.088, marginLeft: -width * 0.15, borderRadius: 99, background: "#030407" }} />
        </div>
        <Glare angle={rotateY} radius={r} />
      </div>
      {/* boutons latéraux */}
      <div style={{ position: "absolute", right: -2, top: h * 0.22, width: 4, height: h * 0.1, borderRadius: 3, background: "#5a6274", transform: `translateZ(0px) rotateY(90deg)`, transformOrigin: "right" }} />
    </div>
  );
};

export const Tablet3D: React.FC<Pose & { width: number; landscape?: boolean; children?: React.ReactNode; style?: React.CSSProperties }> = ({
  width, landscape, rotateX = 0, rotateY = 0, rotateZ = 0, children, style,
}) => {
  const h = landscape ? width * 0.72 : width * 1.38;
  const r = width * 0.07;
  const depth = width * 0.05;
  const bezel = width * 0.04;
  return (
    <div style={{ width, height: h, position: "relative", transformStyle: "preserve-3d", transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`, ...style }}>
      <Slices w={width} h={h} r={r} depth={depth} n={8} />
      <div style={{ position: "absolute", inset: 0, borderRadius: r, background: "#07080d", transform: `translateZ(${depth / 2 + 0.5}px)`, boxShadow: "inset 0 0 0 2px #3b4152" }}>
        <div style={{ position: "absolute", inset: bezel, borderRadius: r * 0.5, overflow: "hidden", background: "#05070f" }}>{children}</div>
        <Glare angle={rotateY} radius={r} />
      </div>
    </div>
  );
};

// Ordinateur portable : écran incliné + base (clavier) dans le même espace 3D.
export const Laptop3D: React.FC<Pose & { width: number; open?: number; children?: React.ReactNode; style?: React.CSSProperties }> = ({
  width, rotateX = 0, rotateY = 0, rotateZ = 0, open = 1, children, style,
}) => {
  const sh = width * 0.64;
  const r = width * 0.025;
  const depth = width * 0.018;
  const bezel = width * 0.02;
  const baseH = width * 0.68;
  return (
    <div style={{ width, height: sh, position: "relative", transformStyle: "preserve-3d", transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`, ...style }}>
      {/* base */}
      <div
        style={{
          position: "absolute", left: -width * 0.03, top: sh, width: width * 1.06, height: baseH, borderRadius: r * 1.5,
          background: "linear-gradient(180deg, #3a4152 0%, #232837 60%, #1a1e29 100%)",
          transformOrigin: "top center", transform: "rotateX(90deg)",
          boxShadow: "inset 0 0 0 2px #4b5468",
        }}
      >
        <div style={{ position: "absolute", left: "8%", right: "8%", top: "7%", height: "52%", borderRadius: 8, background: "repeating-linear-gradient(90deg, #151924 0 22px, #1d2230 22px 26px), #151924", opacity: 0.9 }} />
        <div style={{ position: "absolute", left: "36%", right: "36%", top: "66%", height: "26%", borderRadius: 10, background: "#1c2130", boxShadow: "inset 0 0 0 1px #2f3647" }} />
      </div>
      {/* écran, articulé sur la charnière */}
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transformOrigin: "bottom center", transform: `rotateX(${(1 - open) * -88}deg)` }}>
        <Slices w={width} h={sh} r={r} depth={depth} n={5} />
        <div style={{ position: "absolute", inset: 0, borderRadius: r, background: "#07080d", transform: `translateZ(${depth / 2 + 0.5}px)`, boxShadow: "inset 0 0 0 2px #3b4152" }}>
          <div style={{ position: "absolute", inset: bezel, borderRadius: 4, overflow: "hidden", background: "#05070f" }}>{children}</div>
          <Glare angle={rotateY} radius={r} />
        </div>
      </div>
    </div>
  );
};
