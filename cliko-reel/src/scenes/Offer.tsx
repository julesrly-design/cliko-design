import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../brand";
import { Icon, IconName } from "../components/Icons";
import { Laptop, Phone, SiteMock, SiteVariant, Tablet } from "../components/Devices";
import { useScene } from "../timeline";
import { clamp, lerp, sp } from "../utils";

const PHONE_W = 400;

// Écran du téléphone : chaque nouvel écran glisse par-dessus le précédent sur son mot-clé.
const Screens: React.FC<{ steps: { at: number; v: SiteVariant }[]; width: number; desktop?: boolean }> = ({ steps, width, desktop }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {steps.map((st, i) => {
        if (frame < st.at - 1 || (steps[i + 1] && frame > steps[i + 1].at + 12)) return null;
        const s = i === 0 ? 1 : sp(frame, fps, st.at, { damping: 18, stiffness: 170 });
        return (
          <div key={i} style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - s) * 100}%)`, boxShadow: i ? "0 -20px 40px rgba(0,0,0,.25)" : undefined }}>
            <SiteMock variant={st.v} width={width} desktop={desktop} scroll={Math.max(0, frame - st.at) * 2.2} />
          </div>
        );
      })}
    </>
  );
};

const Chip: React.FC<{ icon: IconName; label: string; s: number; style: React.CSSProperties }> = ({ icon, label, s, style }) => (
  <div style={{ position: "absolute", display: "flex", alignItems: "center", gap: 16, padding: "18px 28px 18px 20px", borderRadius: 999, background: C.white, boxShadow: "0 24px 50px -16px rgba(18,18,20,.35)", fontFamily: F.display, fontWeight: 800, fontSize: 40, color: C.ink, transform: `scale(${s}) translateY(${(1 - s) * 40}px)`, opacity: Math.min(1, s * 1.5), ...style }}>
    <div style={{ width: 58, height: 58, borderRadius: 29, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon name={icon} size={34} color={C.accent} stroke={2.6} />
    </div>
    {label}
    <Icon name="check" size={36} color={C.accent} stroke={3.2} />
  </div>
);

const Tile: React.FC<{ label: string; flip: number }> = ({ label, flip }) => (
  <div style={{ width: 150, height: 130, perspective: 800, opacity: flip > 0.01 ? 1 : 0, transform: `scale(${0.6 + 0.4 * Math.min(1, flip * 2)})` }}>
    <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transform: `rotateX(${180 - 180 * flip}deg)` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: C.ink, backfaceVisibility: "hidden", transform: "rotateX(180deg)" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: C.accent, backfaceVisibility: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 900, fontSize: 64, color: "#fff", boxShadow: "0 20px 40px -12px rgba(255,79,46,.6)" }}>
        {label}
      </div>
    </div>
  </div>
);

export const OfferScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useScene("offre");
  const aPense = T.at("pensé");
  const aAct = T.at("activité");
  const aParf = T.at("parfait");
  const aHeb = T.at("hébergé");
  const aMaj = T.at("mis");
  const aRes = T.at("même");

  // Téléphone : entrée de 3/4 → face caméra sur « parfait » → passe devant, à droite, quand arrivent tablette et ordinateur.
  const enter = sp(frame, fps, 0, { damping: 16, stiffness: 120 });
  const face = sp(frame, fps, aParf, { damping: 14, stiffness: 110 });
  const multi = sp(frame, fps, aHeb, { damping: 16, stiffness: 120 });
  const rotY = lerp(lerp(-35, -16, enter), 0, face) + Math.sin(frame / 22) * 4 * (1 - face) + multi * -14;
  const rotX = lerp(10, 4, enter) * (1 - face);
  const phoneX = lerp(540, 790, multi);
  const phoneY = lerp(770, 860, multi);
  const phoneS = lerp(lerp(0.7, 1, enter), 0.58, multi);
  const glare = interpolate(rotY, [-40, 10], [-60, 140]);

  const laptopIn = sp(frame, fps, aHeb + 2, { damping: 15, stiffness: 110 });
  const tabletIn = sp(frame, fps, aMaj, { damping: 15, stiffness: 120 });
  const social = sp(frame, fps, aRes, { damping: 14 });
  const badge = sp(frame, fps, aParf + 6, { damping: 12, stiffness: 170 });
  const flips = ["français", "néerlandais", "anglais"].map((w) => sp(frame, fps, T.at(w) - 2, { damping: 11, stiffness: 150 }));
  const tilesOut = interpolate(frame, [aRes, aRes + 8], [0, 1], clamp);

  const label = interpolate(frame, [aPense - 2, aPense + 6, aParf + 20, aParf + 28], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill>
      {/* ordinateur (arrière-plan) */}
      <div style={{ position: "absolute", left: 90, top: 470, transform: `translateX(${(1 - laptopIn) * -900}px) scale(${0.85 + 0.15 * laptopIn}) rotateY(${(1 - laptopIn) * 30}deg)`, filter: `blur(${(1 - laptopIn) * 12}px)`, opacity: laptopIn }}>
        <Laptop width={640}>
          <Screens width={612} desktop steps={[{ at: aHeb, v: "cliko" }, { at: aMaj + 4, v: "celest" }]} />
        </Laptop>
      </div>
      {/* tablette (plan intermédiaire) */}
      <div style={{ position: "absolute", left: 420, top: 640, transform: `translateY(${(1 - tabletIn) * 1100}px) rotate(${(1 - tabletIn) * 12}deg)`, opacity: tabletIn }}>
        <Tablet width={300}>
          <Screens width={276} steps={[{ at: aMaj, v: "celest" }]} />
        </Tablet>
      </div>
      {/* téléphone 3D */}
      <div style={{ position: "absolute", left: phoneX, top: phoneY, perspective: 2200 }}>
        <div style={{ transform: `translate(-50%, -50%) scale(${phoneS}) rotateY(${rotY}deg) rotateX(${rotX}deg)`, transformStyle: "preserve-3d" }}>
          <Phone width={PHONE_W}>
            <Screens width={PHONE_W * 0.93} steps={[{ at: 0, v: "cliko" }, { at: aPense, v: "verso" }, { at: aAct, v: "forno" }, { at: aParf, v: "celest" }]} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${glare - 30}%, rgba(255,255,255,.22) ${glare}%, transparent ${glare + 20}%)` }} />
          </Phone>
        </div>
      </div>
      {/* étiquette honnête : les démos sont des exemples de styles */}
      <div style={{ position: "absolute", left: 120, top: 300, padding: "12px 22px", borderRadius: 999, border: `2px solid ${C.ink}22`, background: "rgba(255,255,255,.7)", fontFamily: F.text, fontWeight: 700, fontSize: 34, color: C.inkSoft, opacity: label * (1 - multi), transform: `translateY(${(1 - label) * 20}px)` }}>
        Exemples de styles
      </div>
      {/* chips hébergé / mis à jour */}
      <Chip icon="cloud" label="Hébergé" s={sp(frame, fps, aHeb, { damping: 11 }) * (1 - tilesOut)} style={{ left: 70, top: 400 }} />
      <Chip icon="refresh" label="Mis à jour" s={sp(frame, fps, aMaj, { damping: 11 }) * (1 - tilesOut)} style={{ left: 70, top: 510 }} />
      {/* tuiles FR · NL · EN */}
      <div style={{ position: "absolute", left: 0, right: 150, top: 1090, display: "flex", justifyContent: "center", gap: 26, opacity: 1 - tilesOut, transform: `translateY(${tilesOut * 40}px)` }}>
        {["FR", "NL", "EN"].map((l, i) => (
          <Tile key={l} label={l} flip={flips[i]} />
        ))}
      </div>
      {/* badge non lu par la voix */}
      <div style={{ position: "absolute", left: 0, right: 150, top: 268, display: "flex", justifyContent: "center", transform: `scale(${badge})`, opacity: Math.min(1, badge * 1.5) }}>
        <div style={{ padding: "20px 36px", borderRadius: 999, background: C.ink, color: "#fff", fontFamily: F.display, fontWeight: 800, fontSize: 40, display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ width: 16, height: 16, borderRadius: 8, background: C.accent }} />
          En ligne en 1 à 3 semaines
        </div>
      </div>
      {/* réseaux sociaux : posts génériques qui se publient en cascade */}
      {(["heart", "bubble", "share", "heart"] as IconName[]).map((ic, i) => {
        const s = sp(frame, fps, aRes + i * 4, { damping: 10, stiffness: 200 });
        const pos = [
          { x: 110, y: 420 }, { x: 330, y: 380 }, { x: 140, y: 880 }, { x: 760, y: 470 },
        ][i];
        return (
          <div key={i} style={{ position: "absolute", left: pos.x, top: pos.y - 40 * s, width: 128, height: 128, borderRadius: 40, background: i % 2 ? C.white : C.accent, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${s}) rotate(${(i % 2 ? 1 : -1) * 10 * s}deg)`, boxShadow: "0 24px 40px -14px rgba(18,18,20,.4)", opacity: social > 0 ? 1 : 0 }}>
            <Icon name={ic} size={64} color={i % 2 ? C.accent : "#fff"} fill={ic === "heart" ? (i % 2 ? C.accent : "#fff") : "none"} stroke={2.4} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
