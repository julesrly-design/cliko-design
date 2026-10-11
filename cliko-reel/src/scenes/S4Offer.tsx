import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { B, FONT } from "../brand";
import { glass, MonoTag } from "../components/Brand";
import { Laptop3D, Phone3D, ScreenVideo, Tablet3D } from "../components/Devices3D";
import { LineIcon, LineIconName } from "../components/LineIcons";
import { RailScrim } from "../components/Captions";
import { Sfx } from "../components/Sound";
import { useHero } from "../captions";
import { Hook, useScene } from "../timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Démos de cliko.be : des EXEMPLES DE STYLES (jamais des réalisations livrées).
// `priceY` = première ligne de prix fictive dans la capture mobile (px image) : on ne défile jamais jusque-là.
const DEMOS = [
  { key: "atelier-verso", name: "Atelier Verso", priceY: 2872 },
  { key: "forno-nero", name: "Forno Nero", priceY: 2970 },
  { key: "maison-celest", name: "Maison Célest", priceY: 3267 },
] as const;
const CAP_W = 1075; // largeur des captures mobiles (430 px CSS × 2,5)

// Écran de téléphone qui défile dans la vraie section « Un style différent pour chaque commerce » de cliko.be.
const DemoScreen: React.FC<{ demo: (typeof DEMOS)[number]; screenW: number; screenH: number; t: number }> = ({ demo, screenW, screenH, t }) => {
  const k = screenW / CAP_W;
  const viewImg = screenH / k;
  const maxScroll = Math.max(0, demo.priceY - viewImg - 70);
  const scroll = lerp(maxScroll * 0.55, maxScroll, t) * k;
  return (
    <div style={{ position: "absolute", inset: 0, background: B.night, overflow: "hidden" }}>
      <Img src={staticFile(`captures/demos/${demo.key}-mobile-1.png`)} style={{ position: "absolute", left: 0, top: -scroll, width: screenW }} />
    </div>
  );
};

// Écran large (ordinateur, tablette paysage) : capture desktop de la section, avec un léger travelling.
const DesktopScreen: React.FC<{ demo: (typeof DEMOS)[number]; t: number; zoom?: number }> = ({ demo, t, zoom = 1.06 }) => (
  <Img
    src={staticFile(`captures/demos/${demo.key}-desktop-1.png`)}
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${lerp(10, 30, t)}% ${lerp(20, 60, t)}%`, transform: `scale(${zoom + 0.04 * t})` }}
  />
);

// Écran cadré sur une zone précise d'une capture desktop (2160×1350) : ex. le mini-site seul, pour la tablette.
const CropScreen: React.FC<{ src: string; crop: { x: number; y: number; w: number; h: number }; width: number; t: number }> = ({ src, crop, width, t }) => {
  const k = (width / crop.w) * (1 + 0.04 * t);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: B.night }}>
      <Img src={staticFile(src)} style={{ position: "absolute", left: -crop.x * k, top: -crop.y * k - 30 * t, width: 2160 * k, height: 1350 * k }} />
    </div>
  );
};

// Écran qui glisse par-dessus le précédent sur son mot-clé.
const Swap: React.FC<{ steps: { at: number; node: React.ReactNode }[] }> = ({ steps }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {steps.map((st, i) => {
        if (frame < st.at - 1 || (steps[i + 1] && frame > steps[i + 1].at + 14)) return null;
        const s = i === 0 ? 1 : spring({ frame: frame - st.at, fps, config: { stiffness: 190, damping: 20 } });
        return (
          <div key={i} style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - s) * 104}%)`, boxShadow: i ? "0 -30px 60px rgba(0,0,0,.6)" : undefined }}>
            {st.node}
          </div>
        );
      })}
    </>
  );
};

const Chip: React.FC<{ icon: LineIconName; label: string; s: number; spin?: number; style: React.CSSProperties }> = ({ icon, label, s, spin = 0, style }) => (
  <div style={{ position: "absolute", display: "flex", alignItems: "center", gap: 14, padding: "14px 24px 14px 14px", borderRadius: 999, ...glass(true), fontFamily: FONT.display, fontWeight: 700, fontSize: 38, color: B.text, letterSpacing: "-0.01em", transform: `translateY(${(1 - s) * 30}px) scale(${0.85 + 0.15 * s})`, opacity: Math.min(1, s * 1.6), ...style }}>
    <div style={{ width: 54, height: 54, borderRadius: 27, background: "rgba(255,196,107,.14)", border: "1px solid rgba(255,196,107,.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <LineIcon name={icon} size={30} color={B.accent} stroke={1.9} style={{ transform: `rotate(${spin}deg)` }} />
    </div>
    {label}
    <LineIcon name="check" size={30} color={B.accent} stroke={2.6} />
  </div>
);

const LangTile: React.FC<{ label: string; flip: number }> = ({ label, flip }) => (
  <div style={{ width: 170, height: 150, perspective: 900, opacity: flip > 0.02 ? Math.min(1, flip * 3) : 0 }}>
    <div
      style={{
        position: "absolute", inset: 0, borderRadius: 30, ...glass(true), border: "1.5px solid rgba(255,196,107,.6)",
        display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.display, fontWeight: 800, fontSize: 76,
        letterSpacing: "-0.03em", color: B.accent, boxShadow: "0 0 50px rgba(255,196,107,.25), 0 30px 60px -20px rgba(2,4,12,.85)",
        background: "rgba(11,16,32,.72)",
        transform: `rotateX(${(1 - flip) * 90}deg) scale(${0.75 + 0.25 * Math.min(1, flip)})`,
      }}
    >
      {label}
    </div>
  </div>
);

export const S4Offer: React.FC<{ hook: Hook }> = ({ hook }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = useScene("offre");
  const hero = useHero(hook, "offre", "sur-mesure,");
  const aSur = hero?.at ?? T.at("sur-mesure");
  const aParf = T.at("parfait");
  const aTel = T.at("téléphone");
  const aHeb = T.at("hébergé");
  const aMaj = T.at("mis");
  const aTrois = T.at("trois");
  const aLang = T.at("langues");
  const aEn = T.at("en");
  const end = T.dur;

  // —— téléphone héros ——
  const enter = spring({ frame: frame + 1, fps, config: { stiffness: 110, damping: 17 } });
  const side = spring({ frame: frame - aSur, fps, config: { stiffness: 120, damping: 18 } }); // passe à droite pendant « sur-mesure »
  const face = spring({ frame: frame - aParf, fps, config: { stiffness: 120, damping: 15 } });
  const multi = spring({ frame: frame - aHeb, fps, config: { stiffness: 100, damping: 18 } });
  const outro = interpolate(frame, [end - 22, end], [0, 1], { ...clamp, easing: (x) => x * x });
  const sideAmt = side * (1 - face);
  const phoneX = lerp(lerp(540, 750, sideAmt), 768, multi);
  const phoneY = lerp(lerp(1500, 830, enter), 968, multi) + outro * 500;
  const phoneW = lerp(lerp(390, 330, sideAmt), 228, multi);
  const rotY = (lerp(lerp(-34, -18, enter), -26, sideAmt) * (1 - face) + face * (Math.sin(frame / 20) * 3)) * (1 - multi) + multi * (-12 + Math.sin(frame / 24) * 3);
  const rotX = (lerp(14, 4, enter) * (1 - face)) * (1 - multi) + multi * 5;
  const screenW = phoneW * 0.936;
  const screenH = phoneW * 2.006;
  const local = (from: number, len = 40) => interpolate(frame, [from, from + len], [0, 1], clamp);

  // —— écrans larges ——
  const laptopIn = spring({ frame: frame - (aHeb + 1), fps, config: { stiffness: 95, damping: 17 } });
  const tabletIn = spring({ frame: frame - (aMaj - 2), fps, config: { stiffness: 110, damping: 17 } });
  const refresh = interpolate(frame, [aMaj + 4, aMaj + 14], [0, 1], clamp);

  // —— textes non lus et puces ——
  const tagIn = spring({ frame: frame - aSur, fps, config: { stiffness: 160, damping: 18 } });
  const tagOut = interpolate(frame, [aHeb - 4, aHeb + 2], [0, 1], clamp);
  const demoIdx = frame < aParf ? 0 : frame < aTel ? 1 : 2;
  const badge = spring({ frame: frame - (aMaj + 10), fps, config: { stiffness: 140, damping: 16 } });
  const flips = [aEn, aTrois, aLang].map((a, i) => spring({ frame: frame - (a + i * 2), fps, config: { stiffness: 150, damping: 12 } }));
  const heroIn = spring({ frame: frame - aSur, fps, config: { stiffness: 240, damping: 20 } });
  const heroOut = interpolate(frame, [aParf - 3, aParf + 3], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ transform: `translateY(${-outro * 40}px)`, filter: outro > 0 ? `blur(${outro * 14}px)` : undefined, opacity: 1 - outro * 0.6 }}>
      {/* ordinateur (plan arrière, centré dans la zone utile) */}
      {laptopIn > 0.005 && (
        <div style={{ position: "absolute", left: 470, top: 700, perspective: 2600, transform: `translateY(${(1 - laptopIn) * 260}px) scale(${0.88 + 0.12 * laptopIn})`, opacity: Math.min(1, laptopIn * 1.8), filter: laptopIn < 0.95 ? `blur(${(1 - laptopIn) * 10}px)` : undefined }}>
          <div style={{ transform: "translate(-50%,-50%)" }}>
            <Laptop3D width={760} rotateX={6} rotateY={lerp(-16, -5, laptopIn) + Math.sin(frame / 30) * 2}>
              <DesktopScreen demo={DEMOS[2]} t={local(aHeb, 120)} zoom={1.0} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, transparent ${refresh * 120 - 30}%, rgba(255,255,255,.22) ${refresh * 120 - 15}%, transparent ${refresh * 120}%)` }} />
            </Laptop3D>
          </div>
        </div>
      )}
      {/* tablette (premier plan gauche) : le même site, cadré sur le mini-site */}
      {tabletIn > 0.005 && (
        <div style={{ position: "absolute", left: 255, top: 1000, perspective: 2000, transform: `translateX(${(1 - tabletIn) * -520}px)`, opacity: Math.min(1, tabletIn * 2) }}>
          <div style={{ transform: "translate(-50%,-50%)" }}>
            <Tablet3D width={340} landscape rotateY={lerp(34, 14, tabletIn)} rotateX={6}>
              <CropScreen src={`captures/demos/${DEMOS[2].key}-desktop-1.png`} crop={{ x: 234, y: 740, w: 924, h: 610 }} width={340 * 0.92} t={local(aMaj, 90)} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, transparent ${refresh * 120 - 30}%, rgba(255,255,255,.22) ${refresh * 120 - 15}%, transparent ${refresh * 120}%)` }} />
            </Tablet3D>
          </div>
        </div>
      )}

      {/* téléphone : vrai hero de cliko.be, puis les 3 démos sur les mots-clés */}
      <div style={{ position: "absolute", left: phoneX, top: phoneY, perspective: 2000 }}>
        <div style={{ transform: "translate(-50%,-50%)" }}>
          <Phone3D width={phoneW} rotateY={rotY} rotateX={rotX}>
            <Swap
              steps={[
                { at: 0, node: <ScreenVideo src="captures/mobile-hero.mp4" /> },
                { at: aSur, node: <DemoScreen demo={DEMOS[0]} screenW={screenW} screenH={screenH} t={local(aSur)} /> },
                { at: aParf, node: <DemoScreen demo={DEMOS[1]} screenW={screenW} screenH={screenH} t={local(aParf)} /> },
                { at: aTel, node: <DemoScreen demo={DEMOS[2]} screenW={screenW} screenH={screenH} t={local(aTel, 60)} /> },
              ]}
            />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, transparent ${refresh * 120 - 30}%, rgba(255,255,255,.22) ${refresh * 120 - 15}%, transparent ${refresh * 120}%)` }} />
          </Phone3D>
        </div>
      </div>

      {/* mot héros « sur-mesure » avec un mètre ruban qui se trace */}
      {hero && heroOut < 1 && frame >= aSur - 1 && (
        <div style={{ position: "absolute", left: 80, top: 600, fontFamily: FONT.display, fontWeight: 900, fontSize: 160, letterSpacing: "-0.05em", lineHeight: 0.88, color: B.accent, opacity: 1 - heroOut, transform: `translateX(${-heroOut * 80}px)`, textShadow: "0 0 50px rgba(255,196,107,.3), 0 18px 60px rgba(4,6,14,.9)" }}>
          {["sur-", "mesure"].map((line, i) => (
            <div key={i} style={{ overflow: "hidden", paddingBottom: "0.06em" }}>
              <div style={{ transform: `translateY(${(1 - Math.max(0, Math.min(1, heroIn * 1.6 - i * 0.4))) * 105}%)` }}>{line}</div>
            </div>
          ))}
          <svg width={560} height={60} style={{ display: "block", marginTop: 18 }}>
            <line x1={0} y1={8} x2={560 * heroIn} y2={8} stroke={B.accent} strokeWidth={3} />
            {Array.from({ length: 29 }).map((_, k) => (
              <line key={k} x1={k * 20} y1={8} x2={k * 20} y2={k % 5 === 0 ? 46 : 28} stroke={B.accent} strokeWidth={k % 5 === 0 ? 3 : 2} opacity={k * 20 <= 560 * heroIn ? 0.9 : 0} />
            ))}
          </svg>
        </div>
      )}

      {/* étiquette honnête : ce sont des exemples de styles */}
      <div style={{ position: "absolute", left: 80, top: 286, opacity: tagIn * (1 - tagOut), transform: `translateY(${(1 - tagIn) * -20}px)` }}>
        <MonoTag size={26}>{`Exemple de style · ${DEMOS[demoIdx].name}`}</MonoTag>
      </div>

      {/* puces hébergé / mis à jour + badge non lu */}
      <Chip icon="cloud" label="Hébergé" s={spring({ frame: frame - aHeb, fps, config: { stiffness: 180, damping: 14 } })} style={{ left: 80, top: 276 }} />
      <Chip icon="refresh" label="Mis à jour" spin={interpolate(frame, [aMaj, aMaj + 20], [0, 360], clamp)} s={spring({ frame: frame - aMaj, fps, config: { stiffness: 180, damping: 14 } })} style={{ left: 430, top: 276 }} />
      <div style={{ position: "absolute", left: 80, top: 384, display: "flex", alignItems: "center", gap: 14, padding: "14px 26px", borderRadius: 999, background: `linear-gradient(180deg, ${B.accentBright}, ${B.accent})`, color: B.night, fontFamily: FONT.display, fontWeight: 700, fontSize: 34, transform: `scale(${0.8 + 0.2 * badge})`, transformOrigin: "left center", opacity: Math.min(1, badge * 1.6), boxShadow: "0 0 40px rgba(255,196,107,.3)" }}>
        <LineIcon name="clock" size={32} color={B.night} stroke={2.2} />
        En ligne en 1 à 3 semaines
      </div>

      {/* FR · NL · EN */}
      <div style={{ position: "absolute", left: 0, width: 940, top: 600, display: "flex", justifyContent: "center", gap: 24 }}>
        {["FR", "NL", "EN"].map((l, i) => <LangTile key={l} label={l} flip={flips[i]} />)}
      </div>

      <RailScrim strength={0.75} />

      <Sfx name="whoosh-deep" at={0} db={-4} />
      <Sfx name="whoosh" at={aSur - 2} db={-4} />
      <Sfx name="flap" at={aParf} db={-6} />
      <Sfx name="flap" at={aTel} db={-6} />
      <Sfx name="whoosh-deep" at={aHeb - 1} db={-2} />
      <Sfx name="pop" at={aHeb + 2} db={-4} />
      <Sfx name="pop" at={aMaj + 2} db={-4} />
      <Sfx name="pop" at={aMaj + 12} db={-6} />
      {[aEn, aTrois, aLang].map((a, i) => <Sfx key={i} name="flap" at={a + i * 2} db={-3} />)}
    </AbsoluteFill>
  );
};
