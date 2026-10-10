import React from "react";

// Pavé CSS 3D (dessus / avant / gauche / droite) dans un espace preserve-3d.
// Repère local : x vers la droite, y vers le bas, z vers la caméra. Le dessous est en z = `z`.
export const Box3D: React.FC<{
  w: number; // largeur (x)
  d: number; // profondeur (y)
  h: number; // hauteur (z)
  x?: number; // centre
  y?: number; // centre
  z?: number; // altitude du dessous
  top: string;
  front: string;
  side: string;
  back?: string;
  children?: React.ReactNode; // contenu de la face du dessus
  style?: React.CSSProperties;
}> = ({ w, d, h, x = 0, y = 0, z = 0, top, front, side, back, children, style }) => {
  const face = (extra: React.CSSProperties): React.CSSProperties => ({ position: "absolute", backfaceVisibility: "hidden", ...extra });
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - d / 2, width: w, height: d, transformStyle: "preserve-3d", transform: `translateZ(${z}px)`, ...style }}>
      {/* dessus */}
      <div style={face({ left: 0, top: 0, width: w, height: d, background: top, transform: `translateZ(${h}px)`, overflow: "hidden" })}>{children}</div>
      {/* avant : plan y = d, normale +y */}
      <div style={face({ left: 0, top: d - h, width: w, height: h, background: front, transformOrigin: "bottom", transform: "rotateX(-90deg)" })} />
      {/* arrière : plan y = 0, normale −y */}
      {back && <div style={face({ left: 0, top: 0, width: w, height: h, background: back, transformOrigin: "top", transform: "rotateX(90deg)" })} />}
      {/* gauche : plan x = 0, normale −x */}
      <div style={face({ left: 0, top: 0, width: h, height: d, background: side, transformOrigin: "left", transform: "rotateY(-90deg)" })} />
      {/* droite : plan x = w, normale +x */}
      <div style={face({ left: w - h, top: 0, width: h, height: d, background: side, transformOrigin: "right", transform: "rotateY(90deg)" })} />
    </div>
  );
};
