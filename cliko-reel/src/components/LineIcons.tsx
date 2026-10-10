import React from "react";
import { B } from "../brand";

// Icônes au trait fin, dans le style des illustrations de cliko.be (aucun logo de marque).
const P: Record<string, React.ReactNode> = {
  thumb: <path d="M7 10.5V20H4v-9.5h3zm0 0 3.6-7a2.6 2.6 0 0 1 2.6 2.6V9h5.2a2 2 0 0 1 2 2.3l-1.2 6.9A2.2 2.2 0 0 1 17 20H7" />,
  pin: (
    <>
      <path d="M12 21.5s6.8-6 6.8-11.6a6.8 6.8 0 1 0-13.6 0c0 5.6 6.8 11.6 6.8 11.6z" />
      <circle cx="12" cy="9.8" r="2.5" />
    </>
  ),
  camera: (
    <>
      <rect x="2.5" y="7" width="19" height="13.5" rx="3" />
      <path d="M8.2 7l1.5-2.8h4.6L15.8 7" />
      <circle cx="12" cy="13.6" r="3.8" />
    </>
  ),
  phone: (
    <path d="M21.5 16.6v2.9a2 2 0 0 1-2.2 2 19.4 19.4 0 0 1-8.5-3 19.1 19.1 0 0 1-5.9-5.9A19.4 19.4 0 0 1 2 4.1 2 2 0 0 1 4 2h2.9a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L7.9 9.6a15.6 15.6 0 0 0 5.9 5.9l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.8 2.1z" />
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="9" cy="9.5" r="1.8" />
      <path d="M3.5 17.5l5.2-5 3.8 3.6 2.6-2.4 5.4 4.8" />
    </>
  ),
  heart: <path d="M12 20.3S3.4 15 3.4 8.9A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.6 2.3C20.6 15 12 20.3 12 20.3z" />,
  bubble: <path d="M20.5 11.3a8.2 8.2 0 0 1-12 7.3L3.5 20.5l1.8-4.8A8.2 8.2 0 1 1 20.5 11.3z" />,
  send: <path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5 21 3z" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
    </>
  ),
  check: <path d="M4.5 12.5l4.8 4.8L19.5 7" />,
  cloud: <path d="M7.2 18.5h10.3a4.3 4.3 0 0 0 .5-8.6 5.8 5.8 0 0 0-11.1 1.4 3.6 3.6 0 0 0 .3 7.2z" />,
  refresh: (
    <>
      <path d="M19.5 11A7.5 7.5 0 0 0 6 6.6L4.5 8" />
      <path d="M4.5 3.5V8H9" />
      <path d="M4.5 13A7.5 7.5 0 0 0 18 17.4l1.5-1.4" />
      <path d="M19.5 20.5V16H15" />
    </>
  ),
  robot: (
    <>
      <rect x="4.5" y="8" width="15" height="11.5" rx="3" />
      <path d="M12 8V4.5M9.5 4.5h5" />
      <circle cx="9.3" cy="13.6" r="1.3" />
      <circle cx="14.7" cy="13.6" r="1.3" />
      <path d="M2.5 12.5v3M21.5 12.5v3M9.5 17h5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.4 2" />
    </>
  ),
};

export type LineIconName = keyof typeof P;

export const LineIcon: React.FC<{ name: LineIconName; size?: number; color?: string; stroke?: number; fill?: string; style?: React.CSSProperties }> = ({
  name, size = 64, color = B.text, stroke = 1.6, fill = "none", style,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ overflow: "visible", ...style }}>
    {P[name]}
  </svg>
);
