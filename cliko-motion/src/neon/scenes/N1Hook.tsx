// SCÈNE 1 · HOOK (0:00 → 0:02,5)
// Le logo Cliko est allumé (c'est aussi la dernière image : la vidéo boucle). Son bouton lumineux,
// logé dans le « o » interrupteur, se détache et devient le fil néon. L'accroche s'écrit ;
// « invisible » n'est qu'un fantôme… jusqu'à ce que le fil l'entoure et l'allume. Puis il plonge.
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { clamp, noise1 } from "../../lib/math";
import { EASE, FONT, LOGO, logoPx, NEON, TEXT } from "../theme";
import { ellipseLoop, makeTrack, pointOn, drawnAt, through, type P } from "../paths";
import { Haze, Head, Svg, Wire } from "../Neon";
import { Logo, Words } from "../UI";
import { measureLine } from "../measure";

export const N1_DUR = 150;
const SIZE = 96;
const CX = 500; // centre de la zone sûre
const LINE_Y = [640, 640 + SIZE * 1.12, 640 + SIZE * 2.24];
const AT = [50, 62, 76]; // apparition de chaque ligne (frames locales)

export const n1Track = (() => {
  let cache: ReturnType<typeof build> | null = null;
  const build = () => {
    const lines = TEXT.hook.lines;
    const l2 = measureLine(lines[1], SIZE, CX);
    const word = l2.words.find((w) => w.word === TEXT.hook.accent) ?? l2.words[l2.words.length - 1];
    const wy = LINE_Y[1] + SIZE * 0.55;
    const knob = logoPx(LOGO.hole.cx, LOGO.hole.cy);
    const l3 = measureLine(lines[2], SIZE, CX);
    const q = l3.words[l3.words.length - 1];
    const lasso = { cx: word.cx, cy: wy, rx: (word.x1 - word.x0) / 2 + 46, ry: SIZE * 0.6 };
    const start: P = knob;
    const t = makeTrack(start, [
      // le bouton s'envole et balaie le haut de l'écran
      { d: through([start, [920, 700], [900, 470], [640, 420], [300, 450], [70, 600]]), f0: 22, f1: 50, ease: EASE.out },
      // descend le long du texte et file sous la dernière ligne jusqu'au « ? »
      { d: through([[70, 600], [52, 800], [100, 1010], [380, 1070], [q.x1 + 30, 1040], [q.cx + 4, LINE_Y[2] + SIZE * 0.95]]), f0: 50, f1: 90, ease: EASE.inOut },
      // lasso autour de « invisible »
      { d: through([[q.cx + 4, LINE_Y[2] + SIZE * 0.95], [lasso.cx + lasso.rx + 30, lasso.cy + 30], [lasso.cx + lasso.rx, lasso.cy]]), f0: 90, f1: 98, ease: EASE.out },
      { d: ellipseLoop(lasso.cx, lasso.cy, lasso.rx, lasso.ry, 0, 1.05), f0: 98, f1: 118, ease: EASE.inOut },
      // plongée vers le bas (scène 2)
      { d: through([[lasso.cx + lasso.rx * 1.1, lasso.cy + lasso.ry * 0.4], [760, 1300], [600, 1700], [520, 2150]]), f0: 126, f1: 152, ease: EASE.in },
    ]);
    return { t, word, knob, firstX: l2.words[0].x0 };
  };
  return () => (cache ??= build());
})();

export const N1Hook: React.FC = () => {
  const lf = useCurrentFrame();
  const { t, word, knob, firstX } = useMemo(() => n1Track(), []);
  const lines = TEXT.hook.lines;
  // logo : s'efface quand son bouton s'en va
  const logoOut = EASE.in(clamp((lf - 24) / 20));
  const knobRest = lf < 22;
  const breathe = 1 + 0.05 * Math.sin(lf * 0.12);
  // « invisible » : fantôme, puis allumé au bouclage du lasso
  const lit = EASE.out(clamp((lf - 112) / 12));
  const out = EASE.in(clamp((lf - 132) / 16));
  const head = pointOn(t.d, drawnAt(t, lf));
  // petit tremblement à l'impact du « ? » (sur le temps, f90)
  const sh = Math.max(0, 1 - Math.abs(lf - 92) / 9) * 6;
  const shake = `translate(${noise1(lf * 0.9, 3) * sh}px, ${noise1(lf * 0.9, 9) * sh}px)`;
  return (
    <div style={{ position: "absolute", inset: 0, transform: shake }}>
      {/* logo */}
      {logoOut < 1 && (
        <div style={{ position: "absolute", inset: 0, opacity: 1 - logoOut, filter: logoOut > 0 ? `blur(${logoOut * 16}px)` : undefined, scale: `${1 + logoOut * 0.12}`, transformOrigin: "540px 860px" }}>
          <Logo glow={1 + 0.2 * Math.sin(lf * 0.12)} />
        </div>
      )}
      <Haze at={knobRest ? knob : head} k={knobRest ? 1.3 : 1} />
      {knobRest && (
        <Svg>
          <Head at={knob} size={2.1 * breathe} intensity={1.3} />
        </Svg>
      )}
      {/* accroche */}
      <Words text={lines[0]} at={AT[0]} size={SIZE} x={0} y={LINE_Y[0]} width={CX * 2} frame={lf} out={out} />
      <div style={{ position: "absolute", left: 0, top: LINE_Y[1], width: CX * 2, opacity: 1 - out, filter: out > 0 ? `blur(${out * 14}px)` : undefined }}>
        {/* « est » normal + « invisible » fantôme puis allumé */}
        <Words text={lines[1].replace(TEXT.hook.accent, "").trim()} at={AT[1]} size={SIZE} x={firstX} y={0} width={word.x0 - firstX} align="left" frame={lf} />
        <div
          style={{
            position: "absolute",
            left: word.x0,
            top: 0,
            fontFamily: FONT.display,
            fontWeight: 600,
            fontSize: SIZE,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            whiteSpace: "nowrap",
            opacity: clamp((lf - AT[1] - 5) / 12),
            color: lit > 0 ? undefined : "transparent",
            WebkitTextStroke: lit < 1 ? `${1.6 * (1 - lit)}px rgba(242,243,250,${0.45 + 0.25 * noise1(lf * 0.6, 4)})` : undefined,
            backgroundImage: lit > 0 ? `linear-gradient(180deg, ${NEON.amberHot}, ${NEON.amber} 55%, ${NEON.amberDeep})` : undefined,
            WebkitBackgroundClip: lit > 0 ? "text" : undefined,
            WebkitTextFillColor: lit > 0 ? `rgba(255,196,107,${lit})` : "transparent",
            filter: lit > 0 ? `drop-shadow(0 0 ${30 * lit}px rgba(255,196,107,${0.7 * lit}))` : undefined,
            scale: `${1 + 0.08 * Math.sin(Math.PI * lit) * (lit < 1 ? 1 : 0)}`,
          }}
        >
          {TEXT.hook.accent}
        </div>
      </div>
      <Words text={lines[2]} at={AT[2]} stagger={6} size={SIZE} x={0} y={LINE_Y[2]} width={CX * 2} frame={lf} out={out} />
      <Svg>
        <Wire track={t} frame={lf} />
      </Svg>
    </div>
  );
};
