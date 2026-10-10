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
  <div style={{ width: 170, height: 150, perspective: 900, opacity: flip > 0.02 ? 1 : 0 }}>
    <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transform: `rotateX(${180 - 180 * flip}deg) scale(${0.7 + 0.3 * Math.min(1, flip * 1.5)})` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 30, background: B.nightRaised, border: `1.5px solid ${B.glassLine}`, backfaceVisibility: "hidden", transform: "rotateX(180deg)" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 30, ...glass(true), border: "1.5px solid rgba(255,196,107,.55)", backfaceVisibility: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.display, fontWeight: 800, fontSize: 76, letterSpacing: "-0.03em", color: B.accent, boxShadow: "0 0 50px rgba(255,196,107,.22), 0 30px 60px -20px rgba(2,4,12,.8)" }}>
        {label}
      </div>
    </div>
  </div>
);

// Carte de publication (style des illustrations « réseaux sociaux » du site) : cadre photo au trait + cœur.
const PostCard: React.FC<{ s: number; liked: number; tint: string; style: React.CSSProperties }> = ({ s, liked, tint, style }) => (
  <div style={{ position: "absolute", width: 168, height: 196, borderRadius: 28, ...glass(true), padding: 14, transform: `translateY(${(1 - s) * 60}px) scale(${0.6 + 0.4 * s})`, opacity: Math.min(1, s * 1.8), ...style }}>
    <div style={{ height: 118, borderRadius: 16, background: tint, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.12)" }}>
      <LineIcon name="image" size={56} color="rgba(242,243,250,.9)" stroke={1.4} />
    </div>
    <div style={{ display: "flex", gap: 12, marginTop: 14, alignItems: "center" }}>
      <LineIcon name="heart" size={32} color={liked > 0.5 ? B.accent : B.mist} fill={liked > 0.5 ? B.accent : "none"} stroke={1.8} style={{ transform: `scale(${1 + 0.35 * Math.sin(Math.PI * Math.min(1, liked))})` }} />
      <LineIcon name="bubble" size={30} color={B.mist} stroke={1.7} />
      <LineIcon name="send" size={28} color={B.mist} stroke={1.7} />
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
  const aOn = T.at("on");
  const aRes = T.at("réseaux");
  const end = T.dur;

  // —— téléphone héros ——
  const enter = spring({ frame: frame + 1, fps, config: { stiffness: 110, damping: 17 } });
  const side = spring({ frame: frame - aSur, fps, config: { stiffness: 120, damping: 18 } }); // passe à droite pendant « sur-mesure »
  const face = spring({ frame: frame - aParf, fps, config: { stiffness: 120, damping: 15 } });
  const multi = spring({ frame: frame - aHeb, fps, config: { stiffness: 100, damping: 18 } });
  const outro = interpolate(frame, [end - 22, end], [0, 1], { ...clamp, easing: (x) => x * x });
  const sideAmt = side * (1 - face);
  const phoneX = lerp(lerp(540, 790, sideAmt), 300, multi);
  const phoneY = lerp(lerp(1500, 830, enter), 900, multi) + outro * 500;
  const phoneW = lerp(lerp(390, 330, sideAmt), 250, multi);
  const rotY = lerp(lerp(-34, -18, enter), -26, sideAmt) * (1 - face) + face * (Math.sin(frame / 20) * 3) + multi * 16;
  const rotX = lerp(14, 4, enter) * (1 - face) + multi * 4;
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
  const chipsOut = interpolate(frame, [aOn - 4, aOn + 4], [0, 1], clamp);
  const badge = spring({ frame: frame - (aMaj + 10), fps, config: { stiffness: 140, damping: 16 } });
  const flips = [aEn, aTrois, aLang].map((a, i) => spring({ frame: frame - (a + i * 2), fps, config: { stiffness: 150, damping: 12 } }));
  const social = (i: number) => spring({ frame: frame - (aOn + i * 4), fps, config: { stiffness: 170, damping: 13 } });
  const heroIn = spring({ frame: frame - aSur, fps, config: { stiffness: 240, damping: 20 } });
  const heroOut = interpolate(frame, [aParf - 3, aParf + 3], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ transform: `translateY(${-outro * 40}px)`, filter: outro > 0 ? `blur(${outro * 14}px)` : undefined, opacity: 1 - outro * 0.6 }}>
      {/* ordinateur (plan arrière) */}
      {laptopIn > 0.005 && (
        <div style={{ position: "absolute", left: 520, top: 560, perspective: 2400, transform: `translateX(${(1 - laptopIn) * -900}px)`, opacity: Math.min(1, laptopIn * 2) }}>
          <div style={{ transform: "translate(-50%,-50%)" }}>
            <Laptop3D width={700} rotateX={14} rotateY={lerp(40, 10, laptopIn)} open={Math.min(1, 0.3 + laptopIn)}>
              <DesktopScreen demo={DEMOS[0]} t={local(aHeb, 90)} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, transparent ${refresh * 120 - 30}%, rgba(255,255,255,.25) ${refresh * 120 - 15}%, transparent ${refresh * 120}%)` }} />
            </Laptop3D>
          </div>
        </div>
      )}
      {/* tablette paysage (plan intermédiaire) */}
      {tabletIn > 0.005 && (
        <div style={{ position: "absolute", left: 760, top: 900, perspective: 2000, transform: `translateX(${(1 - tabletIn) * 700}px)`, opacity: Math.min(1, tabletIn * 2) }}>
          <div style={{ transform: "translate(-50%,-50%)" }}>
            <Tablet3D width={330} landscape rotateY={lerp(-50, -20, tabletIn)} rotateX={8}>
              <DesktopScreen demo={DEMOS[2]} t={local(aMaj, 80)} zoom={1.1} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, transparent ${refresh * 120 - 30}%, rgba(255,255,255,.25) ${refresh * 120 - 15}%, transparent ${refresh * 120}%)` }} />
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
      <Chip icon="cloud" label="Hébergé" s={spring({ frame: frame - aHeb, fps, config: { stiffness: 180, damping: 14 } }) * (1 - chipsOut)} style={{ left: 80, top: 276 }} />
      <Chip icon="refresh" label="Mis à jour" spin={interpolate(frame, [aMaj, aMaj + 20], [0, 360], clamp)} s={spring({ frame: frame - aMaj, fps, config: { stiffness: 180, damping: 14 } }) * (1 - chipsOut)} style={{ left: 430, top: 276 }} />
      <div style={{ position: "absolute", left: 80, top: 384, display: "flex", alignItems: "center", gap: 14, padding: "14px 26px", borderRadius: 999, background: `linear-gradient(180deg, ${B.accentBright}, ${B.accent})`, color: B.night, fontFamily: FONT.display, fontWeight: 700, fontSize: 34, transform: `scale(${0.8 + 0.2 * badge})`, transformOrigin: "left center", opacity: Math.min(1, badge * 1.6) * (1 - chipsOut), boxShadow: "0 0 40px rgba(255,196,107,.3)" }}>
        <LineIcon name="clock" size={32} color={B.night} stroke={2.2} />
        En ligne en 1 à 3 semaines
      </div>

      {/* FR · NL · EN */}
      <div style={{ position: "absolute", left: 0, right: 150, top: 1062, display: "flex", justifyContent: "center", gap: 24, opacity: 1 - chipsOut, transform: `translateY(${chipsOut * 30}px)` }}>
        {["FR", "NL", "EN"].map((l, i) => <LangTile key={l} label={l} flip={flips[i]} />)}
      </div>

      {/* réseaux sociaux */}
      {[
        { x: 70, y: 300, tint: "linear-gradient(135deg,#c98b5e,#5a3a26)", r: -8 },
        { x: 300, y: 250, tint: "linear-gradient(135deg,#e0452b,#3a120c)", r: 5 },
        { x: 540, y: 280, tint: "linear-gradient(135deg,#a9bdb1,#2c3d35)", r: -4 },
        { x: 760, y: 330, tint: "linear-gradient(135deg,#7f95e6,#1a2a86)", r: 9 },
      ].map((c, i) => (
        <PostCard key={i} s={social(i)} liked={interpolate(frame, [aRes + i * 3, aRes + 4 + i * 3], [0, 1], clamp)} tint={c.tint} style={{ left: c.x, top: c.y - Math.sin((frame - aOn) / 14 + i) * 8, transform: `rotate(${c.r}deg)` }} />
      ))}
      {Array.from({ length: 8 }).map((_, k) => {
        const t0 = aRes + (k % 4) * 3;
        const t = interpolate(frame, [t0, t0 + 26], [0, 1], clamp);
        if (t <= 0 || t >= 1) return null;
        return (
          <div key={k} style={{ position: "absolute", left: 150 + (k % 4) * 230 + Math.sin(k * 3 + frame / 6) * 20, top: 360 - t * 200 - k * 6, opacity: Math.sin(Math.PI * t), transform: `scale(${0.6 + 0.6 * t})` }}>
            <LineIcon name="heart" size={40} color={B.accent} fill={B.accent} />
          </div>
        );
      })}

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
      {[0, 1, 2, 3].map((i) => <Sfx key={i} name="pop" at={aOn + i * 4} db={-6} />)}
      <Sfx name="msg-receive" at={aRes} db={-8} />
    </AbsoluteFill>
  );
};
