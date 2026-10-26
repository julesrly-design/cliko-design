// SCÈNE 5 · SUR MOBILE (0:17 → 0:21)
// Un smartphone titane se dresse en pivotant ; la ligne s'enroule en spirale autour de lui
// (elle passe derrière, ses reflets glissent sur le chrome). L'écran affiche le site qui défile,
// des notifications glissent : « Nouvelle réservation », « Nouveau message ». « Parfait sur mobile. »
import React, { useMemo } from "react";
import { PALETTE, SAFE, SCENES, TEXT } from "../config";
import { registerCamera, registerTransition } from "../lib/camera";
import type { TrackBuilder } from "../lib/track";
import { clamp, expoInOut, lerp, linear, shot, shotBrake, sineInOut, springAt, type V3 } from "../lib/math";
import { pxToLocal, pxToWorld, REF, toWorld } from "../lib/world";
import { objectMatrix, useMatrixProps } from "../lib/scene";
import { useGlobalFrame, useSceneFrame } from "../lib/seq";
import { SceneOverlay } from "../overlay/SceneOverlay";
import { TracedText, passTimes, type PlacedLine } from "../overlay/TracedText";
import { Phone } from "../three/Phone";
import { registerLineBoost } from "../three/Line";
import { CSS_FONT, fitSize, layoutLine } from "../lib/fonts";

const ID = "mobile" as const;
const S = SCENES.mobile;
const C = pxToLocal(500, 800); // centre du téléphone

export const phoneMatrix = (lf: number) => {
  const rise = springAt(lf + 26, { stiffness: 70, damping: 12 });
  const turn = springAt(lf + 8, { stiffness: 45, damping: 10 });
  const ry = lerp(-2.9, -0.32, turn) + 0.5 * sineInOut(clamp((lf - 40) / 200));
  const rx = lerp(0.6, 0.06, rise) + 0.03 * Math.sin(lf * 0.03);
  return objectMatrix(ID, [C[0], C[1] + lerp(-7, 0, rise) + 0.05 * Math.sin(lf * 0.04), lerp(-3, 0, rise)], [rx, ry, 0.04 * Math.sin(lf * 0.02)], 1);
};

// ── Texte ──────────────────────────────────────────────────────────────────
let layoutCache: PlacedLine[] | null = null;
const mobileLayout = () => {
  if (layoutCache) return layoutCache;
  const maxW = 1080 - SAFE.left - SAFE.right - 40;
  const size = fitSize([TEXT.mobile.title], maxW, 104);
  const l = layoutLine(TEXT.mobile.title, size);
  const cx = (SAFE.left + 1080 - SAFE.right) / 2;
  const words = TEXT.mobile.title.split(" ");
  const lastWord = words[words.length - 1];
  const start = TEXT.mobile.title.length - lastWord.length;
  layoutCache = [{ line: l, x: cx - l.width / 2, baseline: 1350, accent: [start, TEXT.mobile.title.length] }];
  return layoutCache;
};
const TITLE_T = [96, 116] as const;
const NOTIF_T = [120, 165];

// ── Trajet de la ligne ─────────────────────────────────────────────────────
const helix = (u: number): V3 => {
  const turns = 3;
  const a = -Math.PI / 2 + u * turns * Math.PI * 2;
  const r = 1.55 - 0.25 * Math.sin(Math.PI * u);
  return toWorld(ID, [C[0] + r * Math.cos(a), C[1] - 2.6 + u * 5.4, r * Math.sin(a) * -1]);
};

export const mobileLine = (T: TrackBuilder) => {
  const f = (lf: number) => S.start + lf;
  T.go(f(22), [toWorld(ID, [C[0] + 1.8, C[1] - 4, 2.5]), helix(0)], shot);
  T.fn(f(80), helix, (t) => sineInOut(t) * 0.6 + t * 0.4);
  const [pl] = mobileLayout();
  const first = pl.x + pl.line.glyphs[0].x0;
  const last = pl.x + pl.line.glyphs[pl.line.glyphs.length - 1].x1;
  const P = (x: number, y: number, z = 0) => pxToWorld(ID, x, y, z);
  // sort par le haut, contourne le téléphone et file vers le titre
  T.go(f(TITLE_T[0]), [P(860, 420, 1.5), P(900, 1150, 1.2), P(first - 50, pl.baseline - pl.line.capHeight / 2, 0.4)], shot);
  const through = pl.line.glyphs.filter((g) => !g.empty).map((g, j) => P(pl.x + (g.x0 + g.x1) / 2, pl.baseline - pl.line.capHeight * (j % 2 ? 0.7 : 0.3), j % 2 ? 0.2 : -0.1));
  T.go(f(TITLE_T[1]), [...through, P(last + 30, pl.baseline - pl.line.capHeight / 2)], (t) => (linear(t) + sineInOut(t)) / 2);
  // remonte souligner l'arrivée de chaque notification (plan des notifications : z = 1.2)
  T.go(f(NOTIF_T[0]), [P(last + 40, 900, 1.2), P(170, 370, 1.2)], shot);
  T.go(f(NOTIF_T[0] + 18), [P(500, 300, 1.25), P(850, 340, 1.2)], shotBrake);
  T.hold(f(NOTIF_T[1] - 16), 0.04);
  T.go(f(NOTIF_T[1]), [P(700, 250, 1.6), P(170, 370, 1.2)], shot);
  T.go(f(NOTIF_T[1] + 18), [P(500, 300, 1.25), P(850, 340, 1.2)], shotBrake);
  // flotte autour du téléphone, puis part vers la gauche (whip-pan vers la scène 6)
  T.go(f(226), [P(880, 700, 0.8), P(760, 1180, 1.5), P(300, 1200, 1.8)], sineInOut);
};

export const mobileSetup = () => {
  registerCamera(ID, (lf) => {
    const k = clamp(lf / 240);
    return { pos: [lerp(0.8, -0.6, sineInOut(k)), 0.3 - 0.2 * k, REF.distance - 0.5 - 0.6 * k], look: [0, 0.1, 0], roll: -0.02 + 0.03 * k };
  });
  registerTransition({ at: SCENES.languages.start, pre: 12, post: 20, ease: expoInOut, rollKick: 0.12 });
  registerLineBoost(S.start + 76, S.start + 92, 1.6);
};

// ── 3D ─────────────────────────────────────────────────────────────────────
export const Mobile3D: React.FC = () => {
  const lf = useSceneFrame();
  const props = useMatrixProps(phoneMatrix(lf));
  const scroll = clamp((lf - 30) / 230) * 0.42 + 0.02 * Math.sin(lf * 0.02);
  if (lf < -26) return null;
  return (
    <group {...props}>
      <Phone scroll={scroll} screenGlow={0.4 + 0.6 * clamp((lf + 4) / 20)} />
    </group>
  );
};

// ── Calque texte : titre tracé + notifications ─────────────────────────────
const Bell: React.FC<{ kind: number }> = ({ kind }) =>
  kind === 0 ? (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={PALETTE.bg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  ) : (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={PALETTE.bg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z" />
    </svg>
  );

let timesCache: number[][] | null = null;
export const MobileOverlay: React.FC = () => {
  const frame = useGlobalFrame();
  const lf = useSceneFrame();
  const lines = mobileLayout();
  const times = useMemo(() => (timesCache ??= passTimes(ID, lines, [[S.start + TITLE_T[0] - 2, S.start + TITLE_T[1] + 1]])), [lines]);
  const exit = clamp((lf - 236) / 8);
  return (
    <>
      <SceneOverlay id={ID}>
        <TracedText frame={frame} lines={lines} times={times} exit={exit} />
      </SceneOverlay>
      <SceneOverlay id={ID} z={1.2}>
        {TEXT.mobile.notifications.map((n, i) => {
          const a = lf - NOTIF_T[i];
          if (a < 0) return null;
          const s = springAt(a, { stiffness: 190, damping: 14 });
          const older = i === 0 ? springAt(lf - NOTIF_T[1], { stiffness: 160, damping: 16 }) : 0;
          const y = lerp(-180, 300, s) + older * 34;
          const scale = lerp(0.9, 1, s) - older * 0.08;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 150,
                top: y,
                width: 700,
                height: 128,
                borderRadius: 38,
                transform: `scale(${scale})`,
                transformOrigin: "50% 0%",
                zIndex: i,
                opacity: clamp(a / 6) * (1 - older * 0.45) * (1 - exit),
                background: "rgba(22,28,60,.62)",
                border: "1.5px solid rgba(185,196,240,.22)",
                backdropFilter: "blur(22px) saturate(150%)",
                boxShadow: "0 30px 70px -20px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.12)",
                display: "flex",
                alignItems: "center",
                gap: 24,
                padding: "0 30px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ width: 72, height: 72, borderRadius: 20, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg, ${PALETTE.accentFrom}, ${PALETTE.accentTo})`, boxShadow: "0 0 30px rgba(255,196,107,.45)" }}>
                <Bell kind={i} />
              </div>
              <div style={{ flex: 1, minWidth: 0, opacity: 1 - older }}>
                <div style={{ fontFamily: CSS_FONT.body, fontWeight: 600, fontSize: 40, letterSpacing: "-0.01em", color: PALETTE.text, lineHeight: 1.1 }}>{n}</div>
              </div>
            </div>
          );
        })}
      </SceneOverlay>
    </>
  );
};

