// SCÈNE 5 · SUR MOBILE (0:17 → 0:21)
// Le fil s'enroule deux fois autour du téléphone, comme un anneau : il passe derrière, puis devant.
// Écran verrouillé, les notifications tombent : « Nouvelle réservation », « Nouveau message ».
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { clamp, lerp, springAt } from "../../lib/math";
import { EASE, FONT, LOGO, NEON, TEXT } from "../theme";
import { drawnAt, ellipseLoop, makeTrack, pointOn, through } from "../paths";
import { Haze, NeonStroke, Svg, Wire } from "../Neon";
import { Camera, Phone, Words } from "../UI";

export const N5_PRE = 14;
const PH = { x: 320, y: 470, w: 420, h: 860 };
const CX = PH.x + PH.w / 2;
const RINGS = [
  { cy: 1190, rx: 330, ry: 92 },
  { cy: 780, rx: 320, ry: 86 },
];
const NOTIF = [120, 165];

const track = () =>
  makeTrack([-160, 1420], [
    { d: through([[-160, 1420], [60, 1300], [CX - RINGS[0].rx, RINGS[0].cy]]), f0: 0, f1: 22, ease: EASE.out },
    { d: ellipseLoop(CX, RINGS[0].cy, RINGS[0].rx, RINGS[0].ry, Math.PI, 1, 48), f0: 22, f1: 50, ease: (t) => t },
    { d: through([[CX - RINGS[0].rx * 1.06, RINGS[0].cy], [CX - RINGS[1].rx - 40, (RINGS[0].cy + RINGS[1].cy) / 2], [CX - RINGS[1].rx, RINGS[1].cy]]), f0: 50, f1: 58, ease: (t) => t },
    { d: ellipseLoop(CX, RINGS[1].cy, RINGS[1].rx, RINGS[1].ry, Math.PI, 1, 48), f0: 58, f1: 84, ease: (t) => t },
    // remonte, passe au-dessus du téléphone et vient se poser près des notifications
    { d: through([[CX - RINGS[1].rx * 1.06, RINGS[1].cy], [170, 560], [330, 400], [640, 380], [880, 470], [910, 600]]), f0: 84, f1: 118, ease: EASE.out },
    // glisse le long du bord droit puis sort (whip-pan vers les langues)
    { d: through([[910, 600], [930, 900], [900, 1250], [1000, 1500], [1300, 1560]]), f0: 200, f1: 262, ease: EASE.in },
  ]);

const Notif: React.FC<{ i: number; lf: number }> = ({ i, lf }) => {
  const a = lf - NOTIF[i];
  if (a < 0) return null;
  const s = springAt(a, { stiffness: 200, damping: 14 });
  // la plus ancienne passe derrière la nouvelle (pile façon iOS) et perd son texte
  const older = i === 0 ? springAt(lf - NOTIF[1], { stiffness: 170, damping: 16 }) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        top: lerp(-140, 250, s) + older * 26,
        height: 110,
        borderRadius: 32,
        background: "rgba(30,36,64,.72)",
        border: "1.5px solid rgba(185,196,240,.22)",
        backdropFilter: "blur(20px)",
        boxShadow: `0 20px 50px -10px rgba(0,0,0,.7), 0 0 ${50 * clamp(1 - a / 40)}px rgba(255,196,107,.45)`,
        scale: `${lerp(0.9, 1, Math.min(1, s)) - older * 0.07}`,
        transformOrigin: "50% 0%",
        zIndex: i,
        opacity: clamp(a / 5) * (1 - older * 0.4),
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "0 20px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: 66, height: 66, borderRadius: 18, flex: "none", background: "#0B1020", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,196,107,.35)" }}>
        <svg width={50} height={34} viewBox="318 40 166 112">
          <path d={LOGO.toggle} fill={NEON.amber} fillRule="evenodd" />
        </svg>
      </div>
      <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 26, color: NEON.text, letterSpacing: "-0.01em", opacity: 1 - older, whiteSpace: "nowrap" }}>{TEXT.mobile.notifications[i]}</div>
    </div>
  );
};

const LockScreen: React.FC<{ lf: number }> = ({ lf }) => (
  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(90% 55% at 50% 78%, rgba(255,196,107,.28) 0%, rgba(240,169,72,.08) 40%, #070A16 75%)" }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 96, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 112, letterSpacing: "-0.04em", color: NEON.text, opacity: 0.95 }}>9:41</div>
    {[0, 1].map((i) => (
      <Notif key={i} i={i} lf={lf} />
    ))}
  </div>
);

export const N5Mobile: React.FC = () => {
  const lf = useCurrentFrame() - N5_PRE;
  const t = useMemo(track, []);
  const to = drawnAt(t, lf);
  const head = pointOn(t.d, to);
  const out = EASE.in(clamp((lf - 238) / 14));
  return (
    <Camera
      frame={lf}
      keys={[
        { f: -14, y: 80, s: 0.9, ry: -18, rx: 8 },
        { f: 90, y: 20, s: 1, ry: -6, rx: 4 },
        { f: 250, y: 0, s: 1.06, ry: 10, rx: 2 },
      ]}
    >
      <Haze at={head} />
      {/* fil, côté arrière : seulement les demi-anneaux qui passent derrière le téléphone */}
      <Svg>
        <defs>
          <mask id="ring-back" maskUnits="userSpaceOnUse" x={-600} y={-600} width={2280} height={3120}>
            {RINGS.map((r, i) => (
              <rect key={i} x={PH.x - 4} y={r.cy - r.ry - 40} width={PH.w + 8} height={r.ry + 40} fill="#fff" />
            ))}
          </mask>
        </defs>
        <g mask="url(#ring-back)">
          <NeonStroke d={t.d} total={t.total} to={to} />
        </g>
      </Svg>
      <Phone x={PH.x} y={PH.y} w={PH.w} h={PH.h} glow={0.7}>
        <LockScreen lf={lf} />
      </Phone>
      {/* fil, côté avant : tout le reste (la tête comprise) */}
      <Svg>
        <defs>
          <mask id="ring-front" maskUnits="userSpaceOnUse" x={-600} y={-600} width={2280} height={3120}>
            <rect x={-600} y={-600} width={2280} height={3120} fill="#fff" />
            {RINGS.map((r, i) => (
              <rect key={i} x={PH.x - 4} y={r.cy - r.ry - 40} width={PH.w + 8} height={r.ry + 40} fill="#000" />
            ))}
          </mask>
        </defs>
        <g mask="url(#ring-front)">
          <Wire track={t} frame={lf} />
        </g>
      </Svg>
      <Words text={TEXT.mobile.title} at={100} size={84} x={80} y={286} width={900} frame={lf} accent={["mobile"]} out={out} />
    </Camera>
  );
};
