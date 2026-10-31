// SCÈNE 2 · LE SITE SE CONSTRUIT (0:02,5 → 0:07)
// Le fil tombe du haut et fait le tour du téléphone (le bord s'allume derrière lui) pendant que le
// site d'un restaurant s'assemble bloc par bloc. Zoom sur « Réserver » : tap. Puis le titre.
import React, { useMemo } from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { clamp, lerp, springAt } from "../../lib/math";
import { EASE, FONT, NEON, TEXT } from "../theme";
import { drawnAt, makeTrack, pointOn, roundRectFromLeft, through } from "../paths";
import { Haze, Svg, Wire } from "../Neon";
import { Camera, Icon, Phone, Words } from "../UI";

export const N2_PRE = 14;
const PH = { x: 300, y: 520, w: 440, h: 900, r: 68 };
const BTN = { x: PH.x + 11 + 20, y: PH.y + 11 + 640, w: 378, h: 84 };
const POP = { status: 30, nav: 90, hero: 100, info: 110, button: 120, menu: 130 };
const TAP = 138;

const track = () =>
  makeTrack([-140, 620], [
    // arrive par la gauche, sous le titre, et se pose sur le bord du téléphone
    { d: through([[-140, 620], [120, 640], [230, 820], [PH.x - 2, PH.y + PH.h / 2]]), f0: 0, f1: 40, ease: EASE.out },
    // un tour complet du téléphone, au rythme des blocs qui apparaissent
    { d: roundRectFromLeft(PH.x - 2, PH.y - 2, PH.w + 4, PH.h + 4, PH.r + 2, 1), f0: 40, f1: 136, ease: (t) => t },
    // il repart vers la droite (whip-pan vers les services)
    { d: through([[PH.x - 2, PH.y + PH.h / 2], [PH.x - 40, PH.y + PH.h + 60], [700, 1640], [1000, 1500], [1300, 1200]]), f0: 236, f1: 268, ease: EASE.in },
  ]);

const Block: React.FC<{ lf: number; at: number; style: React.CSSProperties; children?: React.ReactNode }> = ({ lf, at, style, children }) => {
  const s = springAt(lf - at, { stiffness: 230, damping: 13 });
  if (s <= 0.001) return null;
  return <div style={{ position: "absolute", opacity: clamp(s * 1.6), translate: `0 ${(1 - Math.min(1, s)) * 50}px`, scale: `${lerp(0.88, 1, Math.min(1.1, s))}`, ...style }}>{children}</div>;
};
const Bar: React.FC<{ w: number | string; h?: number; o?: number }> = ({ w, h = 14, o = 0.85 }) => <div style={{ width: w, height: h, borderRadius: h / 2, background: `rgba(242,243,250,${o})`, marginBottom: 12 }} />;

const Screen: React.FC<{ lf: number }> = ({ lf }) => {
  const tap = lf - TAP;
  const ripple = clamp(tap / 22);
  const pressed = tap >= 0 && tap < 8 ? 0.96 : 1;
  const W = PH.w - 22;
  return (
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 60% at 50% 0%, #18213F 0%, #090D1A 60%, #06080F 100%)" }}>
      <Block lf={lf} at={POP.status} style={{ left: 34, top: 22, right: 34, display: "flex", justifyContent: "space-between", fontFamily: FONT.body, fontWeight: 600, fontSize: 21, color: NEON.text }}>
        <span>9:41</span>
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[8, 11, 14, 17].map((h) => (
            <span key={h} style={{ width: 4, height: h, borderRadius: 2, background: NEON.text }} />
          ))}
          <span style={{ width: 30, height: 15, borderRadius: 5, border: `2px solid ${NEON.text}`, marginLeft: 6, boxSizing: "border-box", padding: 2 }}>
            <span style={{ display: "block", width: "75%", height: "100%", background: NEON.text, borderRadius: 2 }} />
          </span>
        </span>
      </Block>
      <Block lf={lf} at={POP.nav} style={{ left: 26, top: 84, right: 26, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: '"Georgia", serif', fontSize: 30, color: NEON.text, letterSpacing: "0.02em" }}>La Table</span>
        <Icon name="menu" size={32} />
      </Block>
      <Block lf={lf} at={POP.hero} style={{ left: 20, top: 140, width: W - 40, height: 260, borderRadius: 24, overflow: "hidden" }}>
        <Img src={staticFile("neon/photo-salle.jpg")} style={{ width: "160%", height: "100%", objectFit: "cover", marginLeft: "-22%" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,7,14,0) 40%, rgba(5,7,14,.85) 100%)" }} />
        <div style={{ position: "absolute", left: 22, bottom: 14, width: "70%" }}>
          <Bar w="88%" h={18} o={0.95} />
          <Bar w="56%" h={18} o={0.95} />
        </div>
      </Block>
      <Block lf={lf} at={POP.info} style={{ left: 26, top: 430, width: W - 52 }}>
        <Bar w="72%" h={20} />
        <Bar w="94%" h={11} o={0.35} />
        <Bar w="82%" h={11} o={0.35} />
      </Block>
      <Block lf={lf} at={POP.menu} style={{ left: 20, top: 540, width: W - 40, display: "flex", gap: 14 }}>
        {[0, 1].map((i) => (
          <div key={i} style={{ flex: 1, borderRadius: 18, overflow: "hidden", background: "#121A31", border: `1px solid ${NEON.cardLine}` }}>
            <Img src={staticFile("neon/photo-salle.jpg")} style={{ width: "100%", height: 64, objectFit: "cover", objectPosition: i ? "80% 60%" : "30% 70%" }} />
            <div style={{ padding: "10px 12px 2px" }}>
              <Bar w="80%" h={9} o={0.7} />
            </div>
          </div>
        ))}
      </Block>
      <Block lf={lf} at={POP.button} style={{ left: 20, top: 640, width: BTN.w, height: BTN.h }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 42,
            scale: `${pressed}`,
            background: `linear-gradient(180deg, ${NEON.amberHot} 0%, ${NEON.amber} 55%, ${NEON.amberDeep} 100%)`,
            boxShadow: `0 0 ${40 + 60 * (tap >= 0 ? 1 - ripple : 0)}px rgba(255,196,107,${0.45 + 0.4 * (tap >= 0 ? 1 - ripple : 0)})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            fontFamily: FONT.body,
            fontWeight: 600,
            fontSize: 30,
            color: "#0B1020",
          }}
        >
          <Icon name={tap > 6 ? "check" : "calendar"} size={30} color="#0B1020" width={2.4} />
          Réserver
        </div>
        {tap >= 0 && ripple < 1 && (
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 40, height: 40, marginLeft: -20, marginTop: -20, borderRadius: "50%", border: `3px solid ${NEON.core}`, scale: `${1 + ripple * 9}`, opacity: 1 - ripple }} />
        )}
      </Block>
    </div>
  );
};

export const N2Site: React.FC = () => {
  const lf = useCurrentFrame() - N2_PRE;
  const t = useMemo(track, []);
  const head = pointOn(t.d, drawnAt(t, lf));
  const btnC: [number, number] = [BTN.x + BTN.w / 2, BTN.y + BTN.h / 2];
  const out = EASE.in(clamp((lf - 242) / 14));
  return (
    <Camera
      frame={lf}
      keys={[
        { f: -14, y: 60, s: 0.92, rx: 14, ry: -16 },
        { f: 60, y: 30, s: 0.98, rx: 8, ry: -10 },
        { f: 112, y: 10, s: 1, rx: 4, ry: -4 },
        // zoom sur le bouton « Réserver » puis recul
        { f: 128, x: btnC[0] - 540, y: btnC[1] - 960, s: 1.55, rx: 0, ry: 0 },
        { f: 146, x: btnC[0] - 540, y: btnC[1] - 960, s: 1.6, rx: 0, ry: 0 },
        { f: 168, y: 0, s: 1, rx: 2, ry: 6 },
        { f: 270, y: 10, s: 1.04, rx: 4, ry: 10 },
      ]}
    >
      <Haze at={head} />
      <Phone x={PH.x} y={PH.y} w={PH.w} h={PH.h} glow={clamp((lf - 40) / 60)}>
        <Screen lf={lf} />
      </Phone>
      <Svg>
        <Wire track={t} frame={lf} />
      </Svg>
      <Words text={TEXT.site.line1} at={152} size={78} x={80} y={262} width={900} frame={lf} out={out} />
      <Words text={TEXT.site.line2} at={180} size={104} x={80} y={350} width={900} frame={lf} accent={TEXT.site.line2.replace(".", "").split(" ")} out={out} />
    </Camera>
  );
};
