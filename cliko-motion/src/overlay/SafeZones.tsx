// Calque de contrôle des zones de sécurité (Reels / TikTok / Facebook). Activer dans config.ts.
import React from "react";
import { AbsoluteFill } from "remotion";
import { SAFE, SHOW_SAFE_ZONES } from "../config";

export const SafeZones: React.FC<{ force?: boolean }> = ({ force }) => {
  if (!SHOW_SAFE_ZONES && !force) return null;
  const band = "rgba(255,40,40,.28)";
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: SAFE.top, background: band }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: SAFE.bottom, background: band }} />
      <div style={{ position: "absolute", right: 0, top: SAFE.top, bottom: SAFE.bottom, width: SAFE.right, background: band }} />
    </AbsoluteFill>
  );
};
