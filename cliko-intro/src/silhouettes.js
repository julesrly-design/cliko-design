// Silhouettes au premier plan (Canvas 2D, net à toutes les résolutions) : palmiers qui ondulent et vol d'oiseaux.
// Coordonnées « monde » identiques au shader : y vers le haut, 1 unité = hauteur de l'écran, origine au centre.
import { hash } from "./timeline.js";

function palm(ctx, toPx, s, x, y, h, lean, t, seed, fronds = 10, fsc = 1) {
  // Tronc : courbe quadratique qui s'affine
  const top = [x + lean * h, y + h];
  const ctl = [x + lean * h * 0.15 + h * 0.1 * Math.sign(lean || 1), y + h * 0.5];
  const P = (u) => [
    (1 - u) * (1 - u) * x + 2 * (1 - u) * u * ctl[0] + u * u * top[0],
    (1 - u) * (1 - u) * y + 2 * (1 - u) * u * ctl[1] + u * u * top[1],
  ];
  const L = [], Rr = [];
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = P(Math.max(0, u - 0.01)), b = P(Math.min(1, u + 0.01));
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const w = h * 0.03 * (1 - u * 0.5) * (1 + 0.08 * Math.sin(u * 60));
    const c = P(u);
    L.push(toPx(c[0] - (dy / len) * w, c[1] + (dx / len) * w));
    Rr.push(toPx(c[0] + (dy / len) * w, c[1] - (dx / len) * w));
  }
  ctx.beginPath();
  ctx.moveTo(L[0][0], L[0][1]);
  for (const p of L) ctx.lineTo(p[0], p[1]);
  for (let i = Rr.length - 1; i >= 0; i--) ctx.lineTo(Rr[i][0], Rr[i][1]);
  ctx.closePath();
  ctx.fill();

  // Palmes : nervure arquée + folioles denses qui retombent (lecture « plumeuse » en contre-jour)
  const tp = top;
  ctx.lineWidth = Math.max(1, h * s * 0.0065);
  for (let f = 0; f < fronds; f++) {
    const base = (f / (fronds - 1)) * Math.PI * 1.2 - Math.PI * 0.1; // de -18° à 198°
    const a0 = base + (hash(seed + f) - 0.5) * 0.3 + Math.sin(t * 1.1 + f * 0.9 + seed) * 0.045;
    const len = h * fsc * (0.34 + 0.16 * hash(seed * 3 + f));
    const up = 0.35 + 0.35 * Math.max(0, Math.sin(a0)); // les palmes hautes montent avant de retomber
    const droop = 0.9 + 0.5 * hash(seed * 7 + f);
    const M = 26;
    const pts = [];
    for (let k = 0; k <= M; k++) {
      const u = k / M;
      const ax = Math.cos(a0) * len * u;
      const ay = Math.sin(a0) * len * u * up + len * u * 0.25 - droop * len * u * u * 0.8;
      pts.push([tp[0] + ax, tp[1] + ay + h * 0.015]);
    }
    // nervure
    ctx.beginPath();
    pts.forEach((p, k) => {
      const P2 = toPx(p[0], p[1]);
      k ? ctx.lineTo(P2[0], P2[1]) : ctx.moveTo(P2[0], P2[1]);
    });
    ctx.lineWidth = Math.max(1, h * s * 0.009);
    ctx.stroke();
    // folioles
    ctx.beginPath();
    for (let k = 1; k < M; k++) {
      const u = k / M;
      const [px, py] = pts[k];
      const dx = pts[k + 1][0] - pts[k - 1][0], dy = pts[k + 1][1] - pts[k - 1][1], dl = Math.hypot(dx, dy) || 1;
      const tx = dx / dl, ty = dy / dl;
      const ll = h * fsc * 0.12 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.95 + 0.05)), 0.8) * (0.85 + 0.3 * hash(seed + f * 31 + k));
      const sw = Math.sin(t * 1.6 + k * 0.4 + f) * 0.04;
      for (const sgn of [1, -1]) {
        // perpendiculaire, rabattue vers l'arrière et vers le bas
        let ex = -ty * sgn * 0.62 - tx * 0.35, ey = tx * sgn * 0.62 - ty * 0.35 - 0.55;
        const el = Math.hypot(ex, ey) || 1;
        ex = (ex / el) * ll + sw * ll;
        ey = (ey / el) * ll;
        const A = toPx(px, py), B = toPx(px + ex * 0.55 + ex * 0.08, py + ey * 0.45), C = toPx(px + ex, py + ey);
        ctx.moveTo(A[0], A[1]);
        ctx.quadraticCurveTo(B[0], B[1], C[0], C[1]);
      }
    }
    ctx.lineWidth = Math.max(1, h * s * 0.0055);
    ctx.stroke();
  }
  // noix de coco
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const c = toPx(tp[0] + (i - 1.5) * h * 0.018, tp[1] - h * 0.015 - (i % 2) * h * 0.012);
    ctx.moveTo(c[0] + h * s * 0.014, c[1]);
    ctx.arc(c[0], c[1], h * s * 0.014, 0, Math.PI * 2);
  }
  ctx.fill();
}

function birds(ctx, toPx, s, t, k, x0, y0) {
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const bx = x0 + t * 0.03 + i * 0.045 + Math.sin(i * 2.1) * 0.03;
    const by = y0 + Math.cos(i * 1.7) * 0.03 + Math.sin(t * 0.8 + i) * 0.004;
    const w = 0.011 * (1 - i * 0.05);
    const flap = Math.sin(t * 7 + i * 1.3) * 0.006;
    const a = toPx(bx - w, by + flap), b = toPx(bx, by - 0.002), c = toPx(bx + w, by + flap);
    ctx.moveTo(a[0], a[1]);
    ctx.quadraticCurveTo((a[0] + b[0]) / 2, b[1] - w * s * 0.2, b[0], b[1]);
    ctx.quadraticCurveTo((b[0] + c[0]) / 2, b[1] - w * s * 0.2, c[0], c[1]);
  }
  ctx.lineWidth = Math.max(1, s * 0.0022);
  ctx.globalAlpha = k;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function createSilhouettes(canvas) {
  const ctx = canvas.getContext("2d");
  return {
    // cam : { zoom, panX, offX (décalage écran en unités, pour les whips), alpha, layout: 'sunset'|'city', birds }
    draw(t, cams) {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const asp = W / H;
      for (const cam of cams) {
        if (!cam || cam.alpha <= 0.001) continue;
        const z = 1 + (cam.zoom - 1) * cam.fg; // les premiers plans bougent plus que le décor (parallaxe)
        const toPx = (x, y) => [W / 2 + ((x * z) - cam.panX * cam.fg - cam.offX) * H, H / 2 - (y * z + cam.offY) * H];
        ctx.save();
        ctx.globalAlpha = cam.alpha;
        ctx.fillStyle = cam.color || "#0a0410";
        ctx.strokeStyle = cam.color || "#0a0410";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const ex = asp / 2 / z; // bord de l'écran en unités monde
        const k = cam.small || 1; // taille relative des palmiers
        const P = (x, y, h, lean, tt, seed, n, fsc = 1) => palm(ctx, toPx, H * z, x, y, h * k, lean, tt, seed, n, fsc);
        if (asp < 0.8) {
          // portrait : deux palmiers qui encadrent le haut de l'écran, troncs hors champ
          P(-ex - 0.02, -0.62, 1.02, 0.05, t, 3, 13, 0.5);
          P(ex + 0.02, -0.66, 0.92, -0.05, t + 0.6, 17, 13, 0.5);
        } else if (cam.layout === "sunset") {
          P(-ex + 0.03, -0.66, 0.92, 0.14, t, 3, 13);
          P(-ex + 0.24, -0.62, 0.62, 0.08, t + 1.3, 9, 12);
          P(ex - 0.06, -0.68, 0.86, -0.17, t + 0.6, 17, 13);
          if (asp > 1.2) P(ex - 0.34, -0.56, 0.44, -0.05, t + 2.1, 23, 11);
        } else if (cam.layout === "city") {
          P(-ex + 0.04, -0.68, 0.9, 0.12, t, 41, 13);
          if (asp > 1.2) P(ex - 0.1, -0.7, 0.66, -0.12, t + 1.1, 47, 12);
        }
        ctx.restore();
        if (cam.birds) {
          ctx.save();
          ctx.strokeStyle = "#1b0a1e";
          ctx.lineCap = "round";
          birds(ctx, toPx, H * z, t, cam.birds * cam.alpha, -0.25, 0.22);
          ctx.restore();
        }
      }
    },
    clear() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
