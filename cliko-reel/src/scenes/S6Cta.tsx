import React from "react";
import { AbsoluteFill, Freeze, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { B, FONT } from "../brand";
import { AmberPill, Logo } from "../components/Brand";
import { CaptionRail } from "../components/Captions";
import { Galaxy } from "../components/Galaxy";
import { LineIcon } from "../components/LineIcons";
import { Night } from "../components/Night";
import { Sfx } from "../components/Sound";
import { useHero } from "../captions";
import { Hook, useScene } from "../timeline";
import { S1Hook } from "./S1Hook";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const LOOP = 12; // frames du raccord de boucle vers le frame 0

export const S6Cta: React.FC<{ hook: Hook }> = ({ hook }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useScene("cta");
  const logoHero = useHero(hook, "cta", "Cliko.");
  const trouve = useHero(hook, "cta", "trouvé.");
  const devis = useHero(hook, "cta", "Devis gratuit");
  const url = useHero(hook, "cta", "sur cliko.be");
  const aLogo = logoHero?.at ?? T.at("cliko");
  const aTrouve = trouve?.at ?? T.at("trouvé");
  const aDevis = devis?.at ?? T.at("devis");
  const aUrl = url?.at ?? T.at("sur");
  const aUrlWord = url?.words[1]?.at ?? aUrl + 7;
  const end = T.dur;
  const loopStart = end - LOOP;

  // Logo : le point tombe, rebondit et devient le point final de « Cliko. »
  const land = aLogo + 6;
  const fallT = interpolate(frame, [Math.min(0, aLogo - 6), land], [0, 1], { ...clamp, easing: (x) => x * x });
  const bounce = frame > land ? Math.abs(Math.sin((frame - land) / 3.2)) * 60 * Math.exp(-(frame - land) / 5) : 0;
  const letters = spring({ frame: frame - (aLogo - 2), fps, config: { stiffness: 200, damping: 22 } });
  const click = interpolate(frame - land, [0, 22], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const up = spring({ frame: frame - (T.at("votre") - 2), fps, config: { stiffness: 90, damping: 18 } });
  const logoSize = lerp(220, 120, up);
  const logoY = lerp(800, 330, up);

  // Galaxie
  const gal = interpolate(frame, [land, land + 30], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 2) });
  const galDim = interpolate(frame, [aDevis, aDevis + 20], [1, 0.62], clamp);

  // « trouvé. » + épingle
  const tIn = spring({ frame: frame - aTrouve, fps, config: { stiffness: 260, damping: 18 } });
  const tOut = interpolate(frame, [aDevis - 3, aDevis + 4], [0, 1], { ...clamp, easing: (x) => x * x });
  const pinDrop = spring({ frame: frame - (aTrouve - 4), fps, config: { stiffness: 240, damping: 12, mass: 0.7 } });
  const ping = (k: number) => interpolate(frame - (aTrouve + 4 + k * 7), [0, 26], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 2) });

  // Plan final
  const pill = spring({ frame: frame - aDevis, fps, config: { stiffness: 220, damping: 15 } });
  const urlIn = (i: number) => spring({ frame: frame - (aUrlWord - 3) - i * 1.2, fps, config: { stiffness: 280, damping: 20 } });
  const handle = spring({ frame: frame - (aUrlWord + 10), fps, config: { stiffness: 200, damping: 18 } });
  const shine = interpolate(frame, [aUrlWord + 18, aUrlWord + 40], [-30, 130], clamp);

  // Boucle : saut en hyperespace, puis on retombe exactement sur le frame 0
  const warp = interpolate(frame, [loopStart - 6, end - 3], [0, 1], { ...clamp, easing: (x) => x * x * x });
  const back = interpolate(frame, [end - 6, end - 2], [0, 1], clamp);

  const urlText = "cliko.be";

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${1 + warp * 2.4})`, filter: warp > 0.02 ? `blur(${warp * 18}px)` : undefined, opacity: 1 - back }}>
        {/* galaxie (écho du hero de cliko.be) */}
        <AbsoluteFill style={{ opacity: gal * galDim }}>
          <AbsoluteFill style={{ background: "radial-gradient(34% 18% at 50% 41%, rgba(255,220,170,.28), rgba(255,196,107,.08) 55%, transparent 75%)" }} />
          <Galaxy rotation={-0.5 + frame * 0.006} distance={lerp(12, 8.6, gal)} offsetY={-1.25} tilt={1.12} size={0.05} brightness={0.95} />
        </AbsoluteFill>
        {/* traînées d'étoiles pendant le saut */}
        {warp > 0 && (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 70 }).map((_, k) => {
              const a = (k / 70) * Math.PI * 2 + k;
              const r0 = 80 + ((k * 137) % 600);
              const r1 = r0 + warp * (300 + (k % 7) * 120);
              return <line key={k} x1={540 + Math.cos(a) * r0} y1={760 + Math.sin(a) * r0} x2={540 + Math.cos(a) * r1} y2={760 + Math.sin(a) * r1} stroke="#e8eeff" strokeWidth={2} strokeOpacity={0.7 * warp} />;
            })}
          </svg>
        )}

        {/* logo « Cliko. » : le point tombe, rebondit et se pose en point final (clic) */}
        <div style={{ position: "absolute", left: 0, right: 0, top: logoY - logoSize / 2, display: "flex", justifyContent: "center" }}>
          <Logo
            size={logoSize}
            reveal={letters}
            dot={1}
            dotY={-(lerp(620, 0, fallT) + bounce) * (logoSize / 220)}
            dotGlow={1 + (1 - click) * 1.6}
            ring={frame >= land && up < 0.6 ? click : 0}
          />
        </div>
        {/* « trouvé. » et l'épingle plantée dans les étoiles */}
        {trouve && frame >= aTrouve - 4 && tOut < 1 && (
          <>
            <div style={{ position: "absolute", left: 540 - 60, top: lerp(-200, 600, pinDrop), opacity: 1 - tOut }}>
              <LineIcon name="pin" size={120} color={B.accent} fill="rgba(255,196,107,.25)" stroke={1.8} style={{ filter: "drop-shadow(0 0 18px rgba(255,196,107,.8))" }} />
            </div>
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 1 - tOut }}>
              {[0, 1, 2].map((k) => (
                <ellipse key={k} cx={540} cy={720} rx={20 + ping(k) * 260} ry={6 + ping(k) * 70} fill="none" stroke={B.accent} strokeWidth={3} strokeOpacity={(1 - ping(k)) * 0.9} />
              ))}
            </svg>
            <div style={{ position: "absolute", left: 80, width: 840, top: 800, textAlign: "center", fontFamily: FONT.display, fontWeight: 900, fontSize: 210, letterSpacing: "-0.055em", lineHeight: 1, color: B.accent, opacity: 1 - tOut, transform: `scale(${(0.85 + 0.15 * tIn) * (1 - tOut * 0.2)})`, textShadow: "0 0 70px rgba(255,196,107,.4), 0 20px 60px rgba(4,6,14,.9)" }}>
              <div style={{ overflow: "hidden", paddingTop: "0.18em", marginTop: "-0.18em", paddingBottom: "0.06em" }}>
                <div style={{ transform: `translateY(${(1 - tIn) * 105}%)` }}>trouvé.</div>
              </div>
            </div>
          </>
        )}

        {/* plan final : cliko.be, @cliko_be, devis gratuit */}
        {frame >= aUrlWord - 4 && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 610, display: "flex", justifyContent: "center", fontFamily: FONT.display, fontWeight: 800, fontSize: 168, letterSpacing: "-0.05em", lineHeight: 1, color: B.text, textShadow: "0 18px 60px rgba(4,6,14,.85)" }}>
            {urlText.split("").map((ch, i) => (
              <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.08em" }}>
                <span
                  style={{
                    display: "inline-block", transform: `translateY(${(1 - urlIn(i)) * 105}%)`,
                    color: i >= 5 ? B.accent : B.text,
                    backgroundImage: i < 5 ? `linear-gradient(100deg, ${B.text} ${shine - 20}%, #fff7e6 ${shine}%, ${B.text} ${shine + 20}%)` : undefined,
                    WebkitBackgroundClip: i < 5 ? "text" : undefined,
                    WebkitTextFillColor: i < 5 ? "transparent" : undefined,
                  }}
                >
                  {ch}
                </span>
              </span>
            ))}
          </div>
        )}
        <div style={{ position: "absolute", left: 0, right: 0, top: 812, display: "flex", justifyContent: "center", fontFamily: FONT.mono, fontWeight: 500, fontSize: 50, letterSpacing: "0.02em", color: B.mist, opacity: handle, transform: `translateY(${(1 - handle) * 20}px)` }}>
          @cliko_be
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 960, display: "flex", justifyContent: "center", transform: `scale(${0.7 + 0.3 * pill})`, opacity: Math.min(1, pill * 2) }}>
          <AmberPill size={38}>
            <span>Devis gratuit</span>
            <span style={{ opacity: 0.55 }}>·</span>
            <span style={{ fontWeight: 600 }}>Bruxelles et toute la Belgique</span>
          </AmberPill>
        </div>
      </AbsoluteFill>

      {/* raccord de boucle : on retombe sur le frame 0 (usine, « Votre commerce ») */}
      {back > 0 && (
        <AbsoluteFill style={{ opacity: back }}>
          <Freeze frame={0}>
            <Night />
            <S1Hook hook={hook} silent />
            <CaptionRail hook={hook} />
          </Freeze>
        </AbsoluteFill>
      )}

      <Sfx name="whoosh" at={aLogo - 7} db={-6} />
      <Sfx name="click-signature" at={land - 1} db={4} />
      <Sfx name="impact" at={land} db={-6} />
      <Sfx name="riser" at={aTrouve - 16} db={-10} />
      <Sfx name="pop" at={aTrouve - 1} db={-2} />
      <Sfx name="click" at={aDevis} db={-4} />
      <Sfx name="click-signature" at={aUrlWord - 2} db={-2} />
      <Sfx name="whoosh-deep" at={loopStart - 4} db={-2} />
    </AbsoluteFill>
  );
};
