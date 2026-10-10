import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../brand";
import { Icon } from "../components/Icons";
import { useScene } from "../timeline";
import { clamp, ease, lerp, sp } from "../utils";

// PROVISOIRE : remplacé par la vraie photo de Jules et Louis (public/brand/jules-louis.*).
const TeamPhoto: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size * 0.8, borderRadius: 40, overflow: "hidden", position: "relative", background: "linear-gradient(160deg,#F7C9A8,#E58F6A)", boxShadow: "0 50px 90px -30px rgba(120,50,20,.55)", border: "10px solid #fff" }}>
    {[0, 1].map((k) => (
      <div key={k} style={{ position: "absolute", left: `${22 + k * 34}%`, bottom: -size * 0.05, width: size * 0.32, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: size * 0.17, height: size * 0.17, borderRadius: "50%", background: "#FFF3EA", opacity: 0.85 }} />
        <div style={{ width: size * 0.32, height: size * 0.26, marginTop: size * 0.02, borderRadius: `${size * 0.16}px ${size * 0.16}px 0 0`, background: "#FFF3EA", opacity: 0.85 }} />
      </div>
    ))}
    <div style={{ position: "absolute", left: 24, top: 20, fontFamily: F.text, fontWeight: 700, fontSize: 24, color: "#fff", opacity: 0.9, letterSpacing: 1 }}>PHOTO JULES &amp; LOUIS</div>
  </div>
);

const Bubble: React.FC<{ side: "left" | "right"; s: number; children: React.ReactNode }> = ({ side, s, children }) => (
  <div style={{ display: "flex", justifyContent: side === "left" ? "flex-start" : "flex-end", transform: `scale(${s})`, transformOrigin: side === "left" ? "left bottom" : "right bottom", opacity: Math.min(1, s * 2) }}>
    <div style={{ maxWidth: 620, padding: "26px 34px", borderRadius: 40, borderBottomLeftRadius: side === "left" ? 10 : 40, borderBottomRightRadius: side === "right" ? 10 : 40, background: side === "left" ? C.white : C.ink, color: side === "left" ? C.ink : "#fff", fontFamily: F.text, fontWeight: 600, fontSize: 44, lineHeight: 1.2, boxShadow: "0 24px 50px -20px rgba(80,30,10,.35)" }}>
      {children}
    </div>
  </div>
);

const Dots: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ display: "flex", gap: 10, padding: "26px 30px", background: C.white, borderRadius: 40, width: "fit-content" }}>
    {[0, 1, 2].map((i) => <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: C.inkSoft, opacity: 0.4 + 0.6 * Math.max(0, Math.sin((frame - i * 4) / 3)) }} />)}
  </div>
);

export const HumanScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useScene("humain");
  const aTicket = T.at("ticket");
  const aRobot = T.at("robot");
  const aParlez = T.at("parlez");
  const aConstr = T.at("construisent");
  const aQuestion = T.at("question");
  const aRep = T.at("réponse");
  const a24 = T.at("vingt-quatre");

  // 5A — écoute : bulle avec onde vocale qui respire.
  const listenIn = sp(frame, fps, -2, { damping: 14, stiffness: 130 });
  const listenOut = interpolate(frame, [aTicket - 4, aTicket + 2], [0, 1], clamp);
  // 5B — ticket barré puis qui tombe.
  const ticketIn = sp(frame, fps, aTicket - 2, { damping: 12 });
  const strike = interpolate(frame, [aTicket + 5, aTicket + 12], [0, 1], { ...clamp, easing: ease });
  const ticketFall = interpolate(frame, [aRobot - 4, aRobot + 10], [0, 1], { ...clamp, easing: (x) => x * x });
  // 5C — robot qui grésille et s'éteint.
  const robotIn = sp(frame, fps, aRobot - 2, { damping: 12 });
  const glitch = frame >= aRobot + 3 && frame < aRobot + 13;
  const off = interpolate(frame, [aRobot + 13, aRobot + 17, aRobot + 21], [0, 0.97, 1], clamp);
  // 5D/E — photo, puis elle monte pour laisser place à la conversation.
  const photoAt = Math.min(aParlez, aRobot + 18);
  const photoIn = sp(frame, fps, photoAt, { damping: 13, stiffness: 110 });
  const photoUp = sp(frame, fps, aConstr, { damping: 16, stiffness: 120 });
  const build = [0, 1, 2].map((i) => sp(frame, fps, aConstr + 3 + i * 4, { damping: 12, stiffness: 200 }));
  const buildOut = interpolate(frame, [aQuestion - 6, aQuestion], [0, 1], clamp);
  // 5F/G — conversation.
  const q = sp(frame, fps, aQuestion + 4, { damping: 13, stiffness: 200 });
  const a = sp(frame, fps, aRep + 6, { damping: 13, stiffness: 200 });
  const stamp = sp(frame, fps, a24, { damping: 9, stiffness: 260, mass: 0.6 });

  return (
    <AbsoluteFill>
      {/* écoute */}
      <div style={{ position: "absolute", left: 0, right: 150, top: 560, display: "flex", justifyContent: "center", opacity: listenIn * (1 - listenOut), transform: `scale(${(0.7 + 0.3 * listenIn) * (1 - 0.3 * listenOut)})` }}>
        <div style={{ width: 520, height: 360, borderRadius: 80, background: C.white, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, boxShadow: "0 50px 90px -30px rgba(120,50,20,.45)" }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ width: 22, borderRadius: 11, background: C.accent, height: 40 + 140 * Math.abs(Math.sin(frame / 5 + i * 0.8)) * Math.sin((Math.PI * (i + 1)) / 10) }} />
          ))}
        </div>
      </div>
      {/* ticket */}
      {frame >= aTicket - 2 && frame < aRobot + 12 && (
        <div style={{ position: "absolute", left: 160, top: 470, transform: `translateY(${ticketFall * 1400}px) rotate(${-6 + ticketFall * 40}deg) scale(${ticketIn})` }}>
          <div style={{ width: 600, height: 300, background: "#fff", borderRadius: 18, padding: "40px 50px", fontFamily: F.text, boxShadow: "0 40px 70px -30px rgba(0,0,0,.4)", maskImage: "radial-gradient(circle at 0 50%, transparent 26px, #000 27px), radial-gradient(circle at 100% 50%, transparent 26px, #000 27px)", maskComposite: "intersect", WebkitMaskComposite: "source-in" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.inkSoft, letterSpacing: 2 }}>TICKET SUPPORT</div>
            <div style={{ fontSize: 110, fontWeight: 900, color: C.ink, fontFamily: F.display, letterSpacing: -3 }}>#48213</div>
            <div style={{ fontSize: 28, color: C.inkSoft }}>Statut : en attente…</div>
          </div>
          <svg width="680" height="300" style={{ position: "absolute", left: -40, top: 0 }}>
            <path d="M20 170 C 200 140, 420 190, 660 130" stroke={C.accent} strokeWidth="22" strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - strike} />
          </svg>
        </div>
      )}
      {/* robot */}
      {frame >= aRobot - 2 && frame < aRobot + 22 && (
        <div style={{ position: "absolute", left: 0, right: 150, top: 560, display: "flex", justifyContent: "center", transform: `scale(${robotIn}) scaleY(${1 - off * 0.98}) scaleX(${off > 0.97 ? 1 - (off - 0.97) * 33 : 1})` }}>
          <div style={{ width: 380, height: 380, borderRadius: 90, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", transform: glitch ? `translateX(${(frame % 3) * 8 - 8}px)` : undefined, filter: glitch && frame % 2 ? "drop-shadow(8px 0 0 #00E5FF) drop-shadow(-8px 0 0 #FF2D55)" : undefined }}>
            <Icon name="robot" size={230} color={glitch && frame % 4 === 0 ? "#555" : "#9AE6B4"} stroke={1.6} />
            <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.07) 0 3px, transparent 3px 7px)" }} />
            {off > 0 && <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: off }} />}
          </div>
        </div>
      )}
      {/* photo de Jules et Louis */}
      {frame >= photoAt - 1 && (
        <div style={{ position: "absolute", left: 540 - 75, top: lerp(800, 470, photoUp), transform: `translate(-50%, -50%) scale(${lerp(0.6, 1, photoIn) * lerp(1, 0.55, photoUp)}) rotate(${lerp(-12, 0, photoIn) + 2 * photoUp}deg)`, opacity: photoIn }}>
          <TeamPhoto size={700} />
        </div>
      )}
      {/* « ceux qui construisent votre site » : des blocs qui s'empilent */}
      <div style={{ position: "absolute", left: 160, width: 610, top: 700, opacity: 1 - buildOut }}>
        {build.map((b, i) => (
          <div key={i} style={{ height: [130, 90, 90][i], marginTop: 18, borderRadius: 22, background: i === 0 ? C.accent : C.white, transform: `translateY(${(1 - b) * -300}px)`, opacity: b, boxShadow: "0 20px 40px -18px rgba(80,30,10,.4)", width: ["100%", "70%", "85%"][i] }} />
        ))}
      </div>
      {/* conversation */}
      <div style={{ position: "absolute", left: 90, width: 760, top: 700, display: "flex", flexDirection: "column", gap: 24 }}>
        {frame >= aQuestion - 6 && frame < aQuestion + 4 && <div style={{ alignSelf: "flex-end" }}><Dots frame={frame} /></div>}
        {frame >= aQuestion + 4 && <Bubble side="right" s={q}>Pouvez-vous changer mes horaires ?</Bubble>}
        {frame >= aRep - 2 && frame < aRep + 6 && <Dots frame={frame} />}
        {frame >= aRep + 6 && (
          <Bubble side="left" s={a}>
            C’est fait <span style={{ color: C.accent, fontWeight: 900 }}>✓</span>
          </Bubble>
        )}
      </div>
      {frame >= a24 && (
        <div style={{ position: "absolute", left: 600, top: 960, transform: `rotate(-8deg) scale(${lerp(1.6, 1, stamp)})`, opacity: Math.min(1, stamp * 2) }}>
          <div style={{ padding: "18px 34px", borderRadius: 26, border: `6px solid ${C.accent}`, color: C.accent, background: "rgba(255,255,255,.9)", fontFamily: F.display, fontWeight: 900, fontSize: 64, letterSpacing: -1 }}>
            &lt; 24 h
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
