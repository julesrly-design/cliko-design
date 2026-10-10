import React from "react";
import { AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig, getStaticFiles } from "remotion";
import { B, FONT } from "../brand";
import { Dot, glass, MonoTag } from "../components/Brand";
import { LineIcon } from "../components/LineIcons";
import { RailScrim } from "../components/Captions";
import { Sfx } from "../components/Sound";
import { useHero } from "../captions";
import { Hook, useScene } from "../timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Photo de Jules et Louis : utilisée si public/brand/jules-louis.(jpg|png|webp) existe ;
// sinon, traitement typographique (initiales), sans visage inventé.
const teamPhoto = () => getStaticFiles().find((f) => /^brand\/jules-louis\.(jpe?g|png|webp)$/i.test(f.name))?.name;

const Avatar: React.FC<{ letter: string; size: number; s: number; style?: React.CSSProperties }> = ({ letter, size, s, style }) => (
  <div
    style={{
      width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
      background: `radial-gradient(circle at 35% 30%, ${B.accentBright}, ${B.accent} 50%, ${B.accentDeep})`,
      color: B.night, fontFamily: FONT.display, fontWeight: 800, fontSize: size * 0.5, letterSpacing: "-0.04em",
      boxShadow: `0 0 ${size * 0.5}px rgba(255,196,107,.45), 0 20px 50px -20px rgba(80,40,10,.8), inset 0 2px 0 rgba(255,255,255,.45)`,
      transform: `scale(${s})`, opacity: Math.min(1, s * 2), ...style,
    }}
  >
    {letter}
  </div>
);

export const S5Human: React.FC<{ hook: Hook }> = ({ hook }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useScene("humain");
  const ecoute = useHero(hook, "humain", "on vous écoute.");
  const names = useHero(hook, "humain", "Jules et Louis.");
  const aEc = ecoute?.at ?? T.at("on");
  const aEcWord = ecoute?.words[2]?.at ?? T.at("écoute");
  const aPas = T.at("pas");
  const aTicket = T.at("ticket");
  const aPas2 = T.at("pas", 1);
  const aRobot = T.at("robot");
  const aVous = T.at("vous", 1);
  const aDirect = T.at("directement");
  const aJules = names?.at ?? T.at("jules");
  const aLouis = names?.words[2]?.at ?? T.at("louis");
  const aRep = T.at("réponse");
  const a24 = T.at("vingt-quatre");
  const photo = teamPhoto();

  // 0 · respiration : le point ambre flotte dans la lumière chaude
  const dotIn = spring({ frame: frame - 2, fps, config: { stiffness: 80, damping: 14 } });
  // 1 · « on vous écoute »
  const ecIn = spring({ frame: frame - aEc, fps, config: { stiffness: 200, damping: 20 } });
  const ecOut = interpolate(frame, [aPas - 2, aPas + 4], [0, 1], { ...clamp, easing: (x) => x * x });
  // 2 · ticket barré qui tombe
  const tkIn = spring({ frame: frame - (aPas + 1), fps, config: { stiffness: 190, damping: 16 } });
  const strike = interpolate(frame, [aTicket + 2, aTicket + 9], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const fall = interpolate(frame, [aPas2 - 4, aPas2 + 12], [0, 1], { ...clamp, easing: (x) => x * x });
  // 3 · robot qui grésille puis s'éteint (écran cathodique)
  const rbIn = spring({ frame: frame - (aPas2 - 2), fps, config: { stiffness: 190, damping: 16 } });
  const glitch = frame >= aRobot + 1 && frame < aRobot + 7;
  const crt = interpolate(frame, [aRobot + 7, aRobot + 10, aRobot + 12], [0, 0.985, 1], clamp);
  const rbGone = frame > aRobot + 12;
  // 4 · Jules et Louis
  const avJ = spring({ frame: frame - aVous, fps, config: { stiffness: 170, damping: 13 } });
  const avL = spring({ frame: frame - (aVous + 6), fps, config: { stiffness: 170, damping: 13 } });
  const line = interpolate(frame, [aDirect - 2, aDirect + 12], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const nmJ = spring({ frame: frame - aJules, fps, config: { stiffness: 220, damping: 20 } });
  const nmL = spring({ frame: frame - aLouis + 4, fps, config: { stiffness: 220, damping: 20 } });
  const toChat = spring({ frame: frame - (aRep - 10), fps, config: { stiffness: 120, damping: 18 } });
  // 5 · conversation et tampon < 24 h
  const qIn = spring({ frame: frame - (aRep - 8), fps, config: { stiffness: 210, damping: 16 } });
  const typing = frame >= aRep && frame < aRep + 9;
  const rIn = spring({ frame: frame - (aRep + 9), fps, config: { stiffness: 210, damping: 15 } });
  const stamp = spring({ frame: frame - a24, fps, config: { stiffness: 320, damping: 11, mass: 0.6 } });

  const waves = (k: number) => ((frame / 26 + k / 3) % 1);

  return (
    <AbsoluteFill>
      {/* bokeh chaud */}
      {Array.from({ length: 14 }).map((_, k) => {
        const x = random(`bx${k}`) * 1080;
        const y = 300 + random(`by${k}`) * 1100 - frame * (0.2 + random(`bv${k}`) * 0.4);
        const r = 30 + random(`br${k}`) * 90;
        return <div key={k} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,212,143,.22), rgba(255,196,107,0) 70%)", opacity: 0.4 + 0.6 * random(`bo${k}`) }} />;
      })}

      {/* point ambre + ondes d'écoute */}
      {frame < aPas + 4 && (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: (1 - ecOut) * dotIn }}>
            {[0, 1, 2].map((k) => (
              <circle key={k} cx={540} cy={1010} r={40 + waves(k) * 420} fill="none" stroke={B.accent} strokeWidth={2} strokeOpacity={(1 - waves(k)) * 0.55} />
            ))}
          </svg>
          <Dot size={46} glow={2} style={{ position: "absolute", left: 517, top: 987, transform: `scale(${dotIn * (1 + 0.08 * Math.sin(frame / 5))})`, opacity: 1 - ecOut }} />
        </>
      )}

      {/* « on vous écoute. » */}
      {ecoute && frame >= aEc - 1 && ecOut < 1 && (
        <div style={{ position: "absolute", left: 80, width: 840, top: 470, textAlign: "center", fontFamily: FONT.display, lineHeight: 0.92, transform: `translateY(${-ecOut * 120}px)`, opacity: 1 - ecOut, filter: ecOut > 0 ? `blur(${ecOut * 10}px)` : undefined }}>
          <div style={{ fontWeight: 800, fontSize: 116, letterSpacing: "-0.04em", color: B.text, overflow: "hidden", paddingBottom: "0.08em" }}>
            <div style={{ transform: `translateY(${(1 - ecIn) * 105}%)` }}>on vous</div>
          </div>
          <div style={{ fontWeight: 900, fontSize: 220, letterSpacing: "-0.055em", color: B.accent, textShadow: "0 0 60px rgba(255,196,107,.35)", display: "flex", justifyContent: "center" }}>
            {"écoute.".split("").map((ch, i) => {
              const p = spring({ frame: frame - aEcWord + 1 - i * 0.8, fps, config: { stiffness: 300, damping: 20 } });
              return (
                <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingTop: "0.16em", marginTop: "-0.16em", paddingBottom: "0.08em" }}>
                  <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 105 + Math.sin(frame / 7 + i) * 2}%)` }}>{ch}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ticket de support barré */}
      {frame >= aPas && fall < 1 && (
        <div style={{ position: "absolute", left: 150, top: 540, transform: `translate(${(1 - tkIn) * 700 + fall * 120}px, ${fall * fall * 1300}px) rotate(${-7 + (1 - tkIn) * 20 + fall * 50}deg)`, opacity: Math.min(1, tkIn * 2) }}>
          <div style={{ width: 640, padding: "40px 46px 44px", borderRadius: 18, background: "#eef0f7", color: "#2a3044", fontFamily: FONT.mono, boxShadow: "0 50px 90px -30px rgba(10,6,4,.85)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, letterSpacing: "0.14em", color: "#7a8197" }}>
              <span>SERVICE CLIENT</span>
              <span>FILE D'ATTENTE</span>
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 120, letterSpacing: "-0.04em", lineHeight: 1.05, marginTop: 14 }}>#48213</div>
            <div style={{ fontSize: 28, marginTop: 10, color: "#4a5168" }}>Statut : en attente…</div>
            <div style={{ display: "flex", gap: 5, marginTop: 26, height: 46 }}>
              {Array.from({ length: 44 }).map((_, k) => <div key={k} style={{ width: random(`bc${k}`) > 0.6 ? 6 : 3, background: "#2a3044", opacity: 0.85 }} />)}
            </div>
            {/* dents de scie */}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: -14, height: 16, background: "linear-gradient(-45deg, transparent 10px, #eef0f7 0) 0 0 / 22px 16px, linear-gradient(45deg, transparent 10px, #eef0f7 0) 0 0 / 22px 16px" }} />
          </div>
          <svg width={760} height={420} style={{ position: "absolute", left: -60, top: -20, overflow: "visible" }}>
            <path d="M30 250 C 210 200, 470 270, 730 170" stroke={B.accent} strokeWidth={26} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - strike} style={{ filter: "drop-shadow(0 0 12px rgba(255,196,107,.6))" }} />
          </svg>
        </div>
      )}

      {/* robot qui grésille puis s'éteint */}
      {frame >= aPas2 - 2 && !rbGone && (
        <div style={{ position: "absolute", left: 540 - 170, top: 560, width: 340, height: 340, transform: `scale(${rbIn}) scaleY(${1 - crt * 0.985}) scaleX(${crt > 0.98 ? Math.max(0, 1 - (crt - 0.98) * 50) : 1})` }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 80, ...glass(true), display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", transform: glitch ? `translateX(${((frame * 7) % 3) * 9 - 9}px)` : undefined }}>
            {glitch && (
              <>
                <div style={{ position: "absolute", transform: "translateX(-10px)", opacity: 0.8 }}><LineIcon name="robot" size={210} color="#ff4d6d" stroke={1.4} /></div>
                <div style={{ position: "absolute", transform: "translateX(10px)", opacity: 0.8 }}><LineIcon name="robot" size={210} color="#4dd6ff" stroke={1.4} /></div>
              </>
            )}
            <LineIcon name="robot" size={210} color={B.mist} stroke={1.4} />
            <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 3px, transparent 3px 7px)" }} />
            {crt > 0 && <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: crt }} />}
          </div>
        </div>
      )}
      {/* le dernier point lumineux du robot devient le point ambre */}
      {frame > aRobot + 11 && frame < Math.max(aRobot + 16, aVous + 4) && (
        <Dot size={40} glow={2.2} style={{ position: "absolute", left: 520, top: 710, transform: `scale(${interpolate(frame, [aRobot + 11, aRobot + 14, Math.max(aRobot + 15, aVous + 4)], [0.3, 1, 2.6], clamp)})` }} />
      )}

      {/* Jules et Louis */}
      {frame >= aVous - 1 && (
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${-toChat * 230}px) scale(${1 - toChat * 0.35})`, transformOrigin: "50% 20%", opacity: 1 - toChat }}>
          <MonoTag size={24} style={{ position: "absolute", left: "50%", top: 300, transform: `translateX(-50%) translateY(${(1 - nmJ) * 20}px)`, opacity: nmJ * (1 - toChat) }}>Fondateurs de Cliko · Bruxelles</MonoTag>
          {photo ? (
            <Img src={staticFile(photo)} style={{ position: "absolute", left: 240, top: 400, width: 600, height: 420, objectFit: "cover", borderRadius: 40, border: "6px solid rgba(242,243,250,.9)", transform: `scale(${avJ}) rotate(${(1 - avJ) * -8}deg)`, boxShadow: "0 50px 100px -30px rgba(10,6,4,.9)" }} />
          ) : (
            <>
              <Avatar letter="J" size={230} s={avJ} style={{ position: "absolute", left: 300, top: 420 }} />
              <Avatar letter="L" size={230} s={avL} style={{ position: "absolute", left: 550, top: 420 }} />
            </>
          )}
          {/* ligne directe : de vous à eux */}
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <line x1={540} y1={1240} x2={540} y2={1240 - 400 * line} stroke={B.accent} strokeWidth={3} strokeDasharray="2 12" strokeLinecap="round" opacity={(1 - toChat) * 0.9} />
          </svg>
          {names && (
            <div style={{ position: "absolute", left: 80, width: 840, top: 700, textAlign: "center", fontFamily: FONT.display, fontWeight: 900, fontSize: 150, letterSpacing: "-0.05em", lineHeight: 0.95, color: B.text, opacity: 1 - toChat }}>
              <div style={{ overflow: "hidden", paddingBottom: "0.06em" }}><div style={{ transform: `translateY(${(1 - nmJ) * 105}%)` }}>Jules</div></div>
              <div style={{ overflow: "hidden", paddingBottom: "0.06em" }}>
                <div style={{ transform: `translateY(${(1 - nmL) * 105}%)` }}>
                  <span style={{ color: B.accent }}>&amp;</span> Louis
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* en-tête de conversation (petit) */}
      {toChat > 0.02 && (
        <div style={{ position: "absolute", left: 80, top: 300, display: "flex", alignItems: "center", gap: 18, opacity: toChat }}>
          <div style={{ display: "flex" }}>
            <Avatar letter="J" size={84} s={1} />
            <Avatar letter="L" size={84} s={1} style={{ marginLeft: -22 }} />
          </div>
          <div style={{ fontFamily: FONT.display }}>
            <div style={{ fontWeight: 800, fontSize: 46, color: B.text, letterSpacing: "-0.02em" }}>Jules &amp; Louis</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 24, color: B.mist, letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 12, height: 12, borderRadius: 6, background: "#7ee2a8", boxShadow: "0 0 10px #7ee2a8" }} />EN LIGNE
            </div>
          </div>
        </div>
      )}

      {/* conversation */}
      {frame >= aRep - 9 && (
        <div style={{ position: "absolute", left: 80, width: 840, top: 520, display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ alignSelf: "flex-end", maxWidth: 640, padding: "30px 38px", borderRadius: 44, borderBottomRightRadius: 12, ...glass(true), fontFamily: FONT.display, fontWeight: 600, fontSize: 50, lineHeight: 1.15, color: B.text, transform: `scale(${qIn})`, transformOrigin: "right bottom", opacity: Math.min(1, qIn * 2) }}>
            Pouvez-vous changer mes horaires&nbsp;?
          </div>
          {typing && (
            <div style={{ alignSelf: "flex-start", display: "flex", gap: 12, padding: "30px 36px", borderRadius: 44, ...glass(true) }}>
              {[0, 1, 2].map((k) => <div key={k} style={{ width: 18, height: 18, borderRadius: 9, background: B.accent, opacity: 0.35 + 0.65 * Math.max(0, Math.sin((frame - k * 3) / 2.5)) }} />)}
            </div>
          )}
          {frame >= aRep + 9 && (
            <div style={{ alignSelf: "flex-start", padding: "30px 40px", borderRadius: 44, borderBottomLeftRadius: 12, background: `linear-gradient(180deg, ${B.accentBright}, ${B.accent})`, color: B.night, fontFamily: FONT.display, fontWeight: 800, fontSize: 56, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 16, transform: `scale(${rIn})`, transformOrigin: "left bottom", boxShadow: "0 0 60px rgba(255,196,107,.35)" }}>
              C’est fait <LineIcon name="check" size={52} color={B.night} stroke={3} />
            </div>
          )}
        </div>
      )}
      {/* tampon < 24 h : la presse de l'usine, en geste humain */}
      {frame >= a24 - 1 && (
        <div style={{ position: "absolute", left: 560, top: 960, transform: `rotate(-9deg) scale(${lerp(1.8, 1, stamp)})`, opacity: Math.min(1, stamp * 2.5) }}>
          <div style={{ padding: "18px 34px", borderRadius: 26, border: `7px solid ${B.accent}`, color: B.accent, fontFamily: FONT.display, fontWeight: 900, fontSize: 92, letterSpacing: "-0.04em", lineHeight: 1, background: "rgba(11,16,32,.55)", boxShadow: "0 0 50px rgba(255,196,107,.35)", display: "flex", alignItems: "center", gap: 14 }}>
            <LineIcon name="clock" size={70} color={B.accent} stroke={2.4} />
            &lt; 24&nbsp;h
          </div>
        </div>
      )}

      <RailScrim strength={0.65} />

      <Sfx name="msg-receive" at={aEcWord} db={-10} />
      <Sfx name="whoosh" at={aPas - 2} db={-6} />
      <Sfx name="marker" at={aTicket + 2} db={-2} />
      <Sfx name="whip" at={aPas2 - 3} db={-6} />
      <Sfx name="glitch-off" at={aRobot} db={-2} />
      <Sfx name="pop" at={aVous} db={-6} />
      <Sfx name="pop" at={aVous + 6} db={-6} />
      <Sfx name="msg-send" at={aRep - 8} db={-4} />
      <Sfx name="msg-receive" at={aRep + 9} db={-2} />
      <Sfx name="stamp" at={a24} db={-4} />
    </AbsoluteFill>
  );
};
