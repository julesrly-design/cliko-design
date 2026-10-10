import React from "react";
import { C } from "../brand";

// Icônes génériques stylisées (aucun logo de marque).
const P: Record<string, React.ReactNode> = {
  thumb: <path d="M7 10v11H3V10h4zm0 0 4-8a3 3 0 0 1 3 3v3h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 19.1 21H7" />,
  pin: (
    <>
      <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  camera: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="3" />
      <path d="M8 7l1.5-3h5L16 7" />
      <circle cx="12" cy="14" r="4" />
    </>
  ),
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  check: <path d="M4 12.5l5 5L20 6.5" />,
  cloud: <path d="M7 18h10.5a4.5 4.5 0 0 0 .6-9A6 6 0 0 0 6.6 9.6 4.3 4.3 0 0 0 7 18z" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.6-4.5L4 8" />
      <path d="M4 3v5h5" />
      <path d="M4 13a8 8 0 0 0 14.6 4.5L20 16" />
      <path d="M20 21v-5h-5" />
    </>
  ),
  heart: <path d="M12 20.5S3 15 3 8.8A4.8 4.8 0 0 1 12 6.3a4.8 4.8 0 0 1 9 2.5c0 6.2-9 11.7-9 11.7z" />,
  bubble: <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2-5.3A8.4 8.4 0 1 1 21 11.5z" />,
  share: (
    <>
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <path d="M16 6l-4-4-4 4M12 2v13" />
    </>
  ),
  robot: (
    <>
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 8V4M9 4h6" />
      <circle cx="9" cy="14" r="1.4" />
      <circle cx="15" cy="14" r="1.4" />
      <path d="M2 13v3M22 13v3" />
    </>
  ),
};

export type IconName = keyof typeof P;

export const Icon: React.FC<{ name: IconName; size?: number; color?: string; stroke?: number; fill?: string }> = ({
  name, size = 64, color = C.ink, stroke = 2.2, fill = "none",
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {P[name]}
  </svg>
);

// Pastille d'icône flottante (scènes 2 et 3).
export const IconTile: React.FC<{ name: IconName; size?: number; bg?: string; color?: string; style?: React.CSSProperties }> = ({
  name, size = 170, bg = C.white, color = C.ink, style,
}) => (
  <div
    style={{
      width: size, height: size, borderRadius: size * 0.3, background: bg, display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 30px 60px -18px rgba(18,18,20,.35), 0 4px 10px rgba(18,18,20,.08)", ...style,
    }}
  >
    <Icon name={name} size={size * 0.48} color={color} stroke={2} />
  </div>
);
