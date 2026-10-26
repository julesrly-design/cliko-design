// SCÈNE 7 · L'OFFRE (0:23,5 → 0:26)
// Gros compteur à rouleaux qui défile jusqu'à « Dès 390 € » pendant que la ligne tourne autour.
// Elle souligne le prix d'un trait qui explose en étincelles, puis le sous-titre apparaît.
import React from "react";
import { PALETTE, SAFE, SCENES, TEXT } from "../config";
import { registerCamera, registerShake, registerTransition } from "../lib/camera";
import type { TrackBuilder } from "../lib/track";
import { clamp, cubicOut, expoInOut, expoOut, lerp, shot, shotBrake, sineInOut, springAt, type V3 } from "../lib/math";
import { pxToLocal, pxToWorld, REF, toWorld } from "../lib/world";
import { useSceneFrame } from "../lib/seq";
import { SceneOverlay } from "../overlay/SceneOverlay";
import { registerLineBoost } from "../three/Line";
import { registerBurst } from "../three/sparks";
import { registerFlash } from "../three/Stage";
import { CSS_FONT, layoutLine } from "../lib/fonts";

const ID = "offer" as const;
const S = SCENES.offer;

const PRICE_SIZE = 260;
const BASELINE = 990;
const CX = (SAFE.left + 1080 - SAFE.right) / 2;
const DIGITS = String(TEXT.offer.price).split("");
// atterrissage de chaque rouleau (frames locales), le dernier pile sur le temps (f1470)
const LAND = DIGITS.map((_, i) => 60 - (DIGITS.length - 1 - i) * 7);
const EURO_T = 60;
const UNDER = [66, 86] as const; // soulignement
const BOOM = 90; // explosion (f1500)
const SUB_T = [94, 100];

const priceLayout = () => {
  const digits = layoutLine(TEXT.offer.price.toString(), PRICE_SIZE, { tracking: -0.04 });
  const euro = layoutLine(TEXT.offer.currency, PRICE_SIZE * 0.62, { tracking: 0 });
  const gap = PRICE_SIZE * 0.08;
  const width = digits.width + gap + euro.width;
  const x0 = CX - width / 2;
  return { digits, euro, x0, euroX: x0 + digits.width + gap, width, cap: digits.capHeight };
};

export const offerLine = (T: TrackBuilder) => {
  const f = (lf: number) => S.start + lf;
  const L = priceLayout();
  const c = pxToLocal(CX, BASELINE - L.cap / 2);
  // orbite autour du compteur pendant qu'il défile (passe derrière puis devant les chiffres)
  const orbit = (u: number): V3 => {
    const a = Math.PI * 0.95 + u * Math.PI * 3.1;
    return toWorld(ID, [c[0] + 2.35 * Math.cos(a), c[1] + 0.95 * Math.sin(a) + 0.25 * Math.sin(u * 9), 1.3 * Math.sin(a + 0.6)]);
  };
  T.go(f(14), [orbit(0)], shotBrake);
  T.fn(f(56), orbit, (t) => sineInOut(t) * 0.5 + t * 0.5);
  // soulignement du prix
  const uy = BASELINE + 48;
  const P = (x: number, y: number, z = 0) => pxToWorld(ID, x, y, z);
  T.go(f(UNDER[0]), [P(L.x0 - 40, uy + 4, 0.3)], shot);
  T.go(f(UNDER[1]), [P(CX, uy + 2), P(L.x0 + L.width + 10, uy)], (t) => shot(t) * 0.7 + t * 0.3);
  // l'explosion la projette vers le haut, puis elle flotte et prend son élan vers la scène 8
  T.go(f(BOOM + 10), [P(L.x0 + L.width + 50, uy - 150, 1), P(L.x0 + L.width - 40, 560, 1.4)], shotBrake);
  T.go(f(140), [P(500, 470, 1.2), P(260, 640, 0.8)], sineInOut);
};

export const offerUnderline = () => {
  const L = priceLayout();
  return { x0: L.x0 - 40, x1: L.x0 + L.width + 10, y: BASELINE + 48 };
};

export const offerSetup = () => {
  registerCamera(ID, (lf) => {
    const k = clamp(lf / 150);
    return { pos: [lerp(0.5, -0.4, sineInOut(k)), lerp(-0.3, 0.2, k), REF.distance + 0.3 - 1.1 * expoOut(k)], look: [0, 0, 0], roll: lerp(-0.025, 0.01, k) };
  });
  // la ligne ramène la caméra au point de départ (scène 8), en un long vol
  registerTransition({ at: SCENES.logo.start, pre: 6, post: 46, ease: expoInOut, arc: [6, 4, 6], rollKick: -0.18 });
  const u = offerUnderline();
  for (let i = 0; i < 6; i++) {
    const x = lerp(u.x0, u.x1, i / 5);
    registerBurst(S.start + BOOM + (i % 2), pxToWorld(ID, x, u.y, 0.2), 26, 0.11, 30, 0.5);
  }
  registerShake(S.start + BOOM, 0.012, 6);
  registerFlash(S.start + BOOM, 0.035, 5);
  registerLineBoost(S.start + BOOM - 6, S.start + BOOM + 12, 2.4);
  DIGITS.forEach((_, i) => registerShake(S.start + LAND[i], 0.004, 4));
};

// ── Calque : rouleaux, euro, soulignement, sous-titre ──────────────────────
const Reel: React.FC<{ digit: number; lf: number; land: number; spins: number; width: number }> = ({ digit, lf, land, spins, width }) => {
  // position continue du rouleau (en « chiffres »), 0 → spins*10 + digit
  const total = spins * 10 + digit;
  const t = clamp((lf - 4) / (land - 4));
  const pos = total * expoOut(t);
  const vel = (total * (expoOut(clamp((lf - 3) / (land - 4))) - expoOut(clamp((lf - 5) / (land - 4))))) / 2;
  const blur = Math.min(26, Math.abs(vel) * 28);
  const a = lf - land;
  const bounce = a >= 0 ? Math.exp(-a / 6) * Math.sin(a * 0.9) * 0.08 : 0;
  const h = PRICE_SIZE * 1.0;
  const base = Math.floor(pos);
  const frac = pos - base + bounce;
  return (
    <div style={{ position: "relative", width, height: h, overflow: "hidden", display: "inline-block" }}>
      <div style={{ position: "absolute", left: 0, width, top: -frac * h - h, filter: blur > 0.5 ? `url(#vblur-${Math.round(blur)})` : undefined }}>
        {[-1, 0, 1, 2].map((k) => (
          <div key={k} style={{ height: h, lineHeight: `${h}px`, textAlign: "center" }}>
            {(((base + k) % 10) + 10) % 10}
          </div>
        ))}
      </div>
    </div>
  );
};

export const OfferOverlay: React.FC = () => {
  const lf = useSceneFrame();
  const L = priceLayout();
  const u = offerUnderline();
  const exit = clamp((lf - 143) / 8);
  const pre = cubicOut(clamp((lf - 2) / 12));
  const euro = springAt(lf - EURO_T, { stiffness: 230, damping: 12 });
  const under = shot(clamp((lf - UNDER[0]) / (UNDER[1] - UNDER[0])));
  const boom = clamp((lf - BOOM) / 5);
  const top = BASELINE - L.cap;
  const digitW = L.digits.width / DIGITS.length;
  return (
    <SceneOverlay id={ID} style={{ opacity: 1 - exit, filter: exit > 0 ? `blur(${exit * 12}px)` : undefined }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          {Array.from({ length: 27 }, (_, i) => (
            <filter key={i} id={`vblur-${i}`} x="0" y="-50%" width="100%" height="200%">
              <feGaussianBlur stdDeviation={`0 ${i}`} />
            </filter>
          ))}
          <linearGradient id="offer-ul" x1="0" x2="1">
            <stop offset="0" stopColor="#FFE1A8" stopOpacity={0.3} />
            <stop offset="1" stopColor="#FFC46B" />
          </linearGradient>
        </defs>
      </svg>
      {/* « Dès » */}
      <div style={{ position: "absolute", left: L.x0 + 8, top: top - 92, fontFamily: CSS_FONT.body, fontWeight: 500, fontSize: 60, color: PALETTE.mist, letterSpacing: "-0.01em", opacity: pre, transform: `translateY(${(1 - pre) * 30}px)` }}>
        {TEXT.offer.prefix}
      </div>
      {/* rouleaux */}
      <div style={{ position: "absolute", left: L.x0, top: BASELINE - PRICE_SIZE * 0.82, display: "flex", fontFamily: CSS_FONT.display, fontWeight: 600, fontSize: PRICE_SIZE, color: PALETTE.text, letterSpacing: "-0.04em", opacity: pre }}>
        {DIGITS.map((d, i) => (
          <Reel key={i} digit={Number(d)} lf={lf} land={LAND[i]} spins={2 + i} width={digitW} />
        ))}
      </div>
      {/* euro */}
      <div
        style={{
          position: "absolute",
          left: L.euroX,
          top: BASELINE - PRICE_SIZE * 0.62 * 0.82,
          fontFamily: CSS_FONT.display,
          fontWeight: 600,
          fontSize: PRICE_SIZE * 0.62,
          lineHeight: 1,
          backgroundImage: `linear-gradient(180deg, ${PALETTE.accentFrom}, ${PALETTE.accentTo})`,
          WebkitBackgroundClip: "text",
          color: "transparent",
          opacity: clamp(euro * 2),
          transform: `translateX(${(1 - euro) * 80}px) scale(${lerp(1.3, 1, clamp(euro))})`,
          filter: `drop-shadow(0 0 ${18 * (1 - clamp((lf - EURO_T) / 30))}px rgba(255,196,107,.8))`,
        }}
      >
        {TEXT.offer.currency}
      </div>
      {/* soulignement lumineux, qui éclate */}
      {under > 0 && boom < 1 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <path
            d={`M ${u.x0} ${u.y + 4} Q ${(u.x0 + u.x1) / 2} ${u.y + 2} ${u.x1} ${u.y}`}
            stroke="url(#offer-ul)"
            strokeWidth={7 + boom * 10}
            strokeLinecap="round"
            fill="none"
            pathLength={1}
            strokeDasharray={boom > 0 ? "0.04 0.05" : "1 1"}
            strokeDashoffset={boom > 0 ? 0 : 1 - under}
            opacity={1 - boom}
            style={{ filter: "drop-shadow(0 0 12px rgba(255,196,107,.9))" }}
          />
        </svg>
      )}
      {/* sous-titre */}
      {(() => {
        const words = TEXT.offer.subtitle.split(" ");
        const cut = Math.ceil(words.length / 2);
        const lines = [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
        return lines.map((line, i) => {
          const p = expoOut(clamp((lf - SUB_T[i]) / 14));
          return (
            <div key={i} style={{ position: "absolute", left: 0, width: CX * 2, top: BASELINE + 110 + i * 62, textAlign: "center", overflow: "hidden", height: 62 }}>
              <div style={{ fontFamily: CSS_FONT.body, fontWeight: 500, fontSize: 44, lineHeight: "60px", color: i === 0 ? PALETTE.text : PALETTE.mist, letterSpacing: "-0.01em", transform: `translateY(${(1 - p) * 100}%)`, filter: `blur(${(1 - p) * 6}px)` }}>{line}</div>
            </div>
          );
        });
      })()}
    </SceneOverlay>
  );
};
