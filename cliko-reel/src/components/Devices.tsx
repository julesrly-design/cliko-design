import React from "react";
import { C, F } from "../brand";

// Maquettes de sites. PROVISOIRE : remplacées par les vraies captures de cliko.be (scripts/capture.mjs).
// Les 3 démos sont des exemples de styles, jamais présentées comme des clients.
export type SiteVariant = "gray" | "cliko" | "verso" | "forno" | "celest";

const THEMES: Record<SiteVariant, { bg: string; ink: string; accent: string; hero: string; title: string; font: string; nav: string }> = {
  gray: { bg: "#E4E6E9", ink: C.gray, accent: C.grayDark, hero: `linear-gradient(135deg, ${C.gray}, #CDD1D6)`, title: "", font: F.display, nav: C.gray },
  cliko: { bg: C.paper, ink: C.ink, accent: C.accent, hero: `radial-gradient(circle at 30% 30%, #FFB199, ${C.accent} 55%, #C2381D)`, title: "Votre commerce, enfin à votre image.", font: F.display, nav: C.ink },
  verso: { bg: "#EFE6D8", ink: "#3B2A1E", accent: "#B4572E", hero: "linear-gradient(160deg, #C98B5E, #7A4A2C)", title: "Atelier Verso", font: F.serif, nav: "#3B2A1E" },
  forno: { bg: "#141110", ink: "#F4EDE4", accent: "#E0452B", hero: "radial-gradient(circle at 50% 60%, #F08A3C, #8E1F12 60%, #2A0F0A)", title: "Forno Nero", font: F.display, nav: "#F4EDE4" },
  celest: { bg: "#F3F0E8", ink: "#24302B", accent: "#B49A5C", hero: "linear-gradient(180deg, #A9BDB1, #5E7A6C)", title: "Maison Célest", font: F.serif, nav: "#24302B" },
};

const Bar: React.FC<{ w: string; c: string; h?: number; mt?: number }> = ({ w, c, h = 0.55, mt = 0.5 }) => (
  <div style={{ width: w, height: `${h}em`, borderRadius: "0.3em", background: c, marginTop: `${mt}em`, opacity: 0.8 }} />
);

export const SiteMock: React.FC<{ variant: SiteVariant; width: number; scroll?: number; desktop?: boolean }> = ({ variant, width, scroll = 0, desktop }) => {
  const t = THEMES[variant];
  const gray = variant === "gray";
  const fs = width / (desktop ? 46 : 24);
  const title = gray ? (
    <>
      <Bar w="90%" c={t.ink} h={1.4} mt={0} />
      <Bar w="60%" c={t.ink} h={1.4} />
    </>
  ) : (
    <div style={{ fontFamily: t.font, fontWeight: t.font === F.serif ? 600 : 850, fontSize: "2.3em", lineHeight: 1.02, letterSpacing: "-0.03em", color: t.ink }}>
      {t.title}
    </div>
  );
  const hero = <div style={{ height: desktop ? "14em" : "12em", borderRadius: "1em", background: t.hero, flex: desktop ? 1 : undefined, position: "relative", overflow: "hidden" }}>
    {!gray && <div style={{ position: "absolute", width: "60%", height: "60%", right: "-10%", bottom: "-15%", borderRadius: "50%", background: "rgba(255,255,255,.18)" }} />}
  </div>;
  return (
    <div style={{ width: "100%", height: "100%", background: t.bg, overflow: "hidden", fontSize: fs, fontFamily: F.text }}>
      <div style={{ transform: `translateY(${-scroll}px)`, padding: "1.2em" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.6em" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4em" }}>
            <div style={{ width: "1em", height: "1em", borderRadius: "50%", background: t.accent }} />
            {gray ? <Bar w="4em" c={t.nav} mt={0} /> : <div style={{ fontWeight: 800, color: t.nav, fontSize: "0.9em" }}>{variant === "cliko" ? "votrecommerce" : t.title}</div>}
          </div>
          <div style={{ display: "flex", gap: "0.3em" }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ width: "1.6em", height: "0.25em", background: t.nav, opacity: 0.6, borderRadius: 4 }} />)}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: desktop ? "row" : "column", gap: "1.2em", alignItems: desktop ? "center" : "stretch" }}>
          <div style={{ flex: 1 }}>
            {title}
            <Bar w="80%" c={t.ink} h={0.45} mt={1} />
            <Bar w="65%" c={t.ink} h={0.45} />
            <div style={{ marginTop: "1.1em", display: "inline-block", padding: "0.7em 1.3em", borderRadius: "2em", background: t.accent, color: gray ? t.accent : "#fff", fontWeight: 800, fontSize: "0.85em" }}>
              Réserver
            </div>
          </div>
          {hero}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: desktop ? "repeat(4, 1fr)" : "1fr 1fr", gap: "0.8em", marginTop: "1.4em" }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} style={{ height: "7em", borderRadius: "0.8em", background: gray ? "#D3D6DA" : t.hero, opacity: gray ? 1 : 0.55 + (i % 3) * 0.15 }} />
          ))}
        </div>
        {[0, 1, 2].map((i) => <Bar key={i} w={`${90 - i * 15}%`} c={t.ink} h={0.45} mt={0.9} />)}
      </div>
    </div>
  );
};

export const Phone: React.FC<{ width: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ width, children, style }) => {
  const h = width * 2.06;
  const b = width * 0.035;
  return (
    <div style={{ width, height: h, borderRadius: width * 0.16, background: "#0E0E10", padding: b, boxShadow: "0 60px 120px -30px rgba(18,18,20,.55), inset 0 0 0 2px #2A2A30", position: "relative", ...style }}>
      <div style={{ width: "100%", height: "100%", borderRadius: width * 0.13, overflow: "hidden", position: "relative", background: "#000" }}>
        {children}
        <div style={{ position: "absolute", top: width * 0.035, left: "50%", width: width * 0.3, height: width * 0.085, marginLeft: -width * 0.15, borderRadius: 99, background: "#0E0E10" }} />
      </div>
    </div>
  );
};

export const Tablet: React.FC<{ width: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ width, children, style }) => (
  <div style={{ width, height: width * 1.36, borderRadius: width * 0.07, background: "#16161A", padding: width * 0.04, boxShadow: "0 50px 100px -30px rgba(18,18,20,.5)", ...style }}>
    <div style={{ width: "100%", height: "100%", borderRadius: width * 0.035, overflow: "hidden" }}>{children}</div>
  </div>
);

export const Laptop: React.FC<{ width: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ width, children, style }) => (
  <div style={{ width, ...style }}>
    <div style={{ width: "100%", height: width * 0.63, borderRadius: `${width * 0.03}px ${width * 0.03}px 0 0`, background: "#16161A", padding: width * 0.022, boxShadow: "0 50px 100px -30px rgba(18,18,20,.5)" }}>
      <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 6 }}>{children}</div>
    </div>
    <div style={{ width: "112%", marginLeft: "-6%", height: width * 0.035, background: "linear-gradient(#C9CCD1, #9EA3AA)", borderRadius: `0 0 ${width * 0.04}px ${width * 0.04}px` }} />
  </div>
);
