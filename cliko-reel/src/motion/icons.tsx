import React from "react";

// Icônes de métiers au trait (24×24), génériques.
const P: Record<string, React.ReactNode> = {
  pizza: (<><path d="M12 21.5 3.2 5.8a17.5 17.5 0 0 1 17.6 0z" /><path d="M4.6 8.4a14.6 14.6 0 0 1 14.8 0" /><circle cx="10.2" cy="11.4" r="1.2" /><circle cx="13.6" cy="14.6" r="1.1" /></>),
  scissors: (<><circle cx="6" cy="6.5" r="2.8" /><circle cx="6" cy="17.5" r="2.8" /><path d="M8.3 8.1 20 18.5M8.3 15.9 20 5.5" /></>),
  flower: (<><path d="M7 3.5l2.6 3L12 3l2.4 3.5L17 3.5V9a5 5 0 0 1-10 0z" /><path d="M12 14v7.5M12 18.5c-1.6-1.8-3.4-2.3-5-2.2M12 18.5c1.6-1.8 3.4-2.3 5-2.2" /></>),
  bread: (<><path d="M3.5 12.5a8.5 5.5 0 0 1 17 0V19h-17z" /><path d="M8.5 9.4v3M12 8.6v3.4M15.5 9.4v3" /></>),
  wrench: (<path d="M14.7 6.3a4.2 4.2 0 0 0 5.1 5.6l-8.9 8.9a2.2 2.2 0 0 1-3.1-3.1l8.9-8.9a4.2 4.2 0 0 0-2-2.5z" />),
  bag: (<><path d="M5 8h14l-1.1 13H6.1z" /><path d="M9 10V6.5a3 3 0 0 1 6 0V10" /></>),
  hammer: (<><path d="M13.5 3.5l7 7-2.8 2.8-7-7z" /><path d="M11.6 8.7 4 16.3a2.1 2.1 0 0 0 3 3l7.6-7.6" /></>),
  cloche: (<><path d="M3 18.5h18M5 18.5a7 7 0 0 1 14 0" /><path d="M12 11.5V9M10.3 9h3.4" /></>),
  cup: (<><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M16 10.5h1.5a2.6 2.6 0 0 1 0 5.2H16M8 3v3M12 3v3" /></>),
  bed: (<><path d="M3 19V7M3 15h18v4M21 15v-2.5A3.5 3.5 0 0 0 17.5 9H11v6" /><circle cx="6.8" cy="11.8" r="1.8" /></>),
  dumbbell: (<path d="M6.5 7.5v9M17.5 7.5v9M3.5 10v4M20.5 10v4M6.5 12h11" />),
  glasses: (<><circle cx="6.8" cy="14.5" r="3.4" /><circle cx="17.2" cy="14.5" r="3.4" /><path d="M10.2 14.5h3.6M3.5 13.5 5.2 7.5M20.5 13.5 18.8 7.5" /></>),
  plus: (<path d="M12 5v14M5 12h14" />),
  mic: (<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" /></>),
  up: (<path d="M12 19V5M6 11l6-6 6 6" />),
  chevron: (<path d="M6 9l6 6 6-6" />),
};

export const Icon: React.FC<{ name: keyof typeof P | string; size: number; color?: string; stroke?: number; style?: React.CSSProperties }> = ({ name, size, color = "currentColor", stroke = 1.8, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", ...style }}>
    {P[name]}
  </svg>
);
