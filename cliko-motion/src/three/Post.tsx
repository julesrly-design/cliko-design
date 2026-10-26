// Post-processing : bloom (seule la lumière HDR brille), flou de mouvement directionnel piloté par
// la vitesse de la caméra (whip-pans), aberration chromatique sur les bords, tone mapping ACES,
// vignettage et grain fin déterministe.
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { EffectComposer, Bloom, ChromaticAberration, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, Effect, EffectAttribute, ToneMappingMode } from "postprocessing";
import { POST } from "../config";
import { cameraScreenVelocity } from "../lib/camera";
import { W, H } from "../lib/world";

class DirectionalBlurEffect extends Effect {
  constructor() {
    super(
      "DirectionalBlur",
      /* glsl */ `
uniform vec2 uVel;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (length(uVel) < 0.0006) { outputColor = inputColor; return; }
  vec4 acc = vec4(0.0);
  float tot = 0.0;
  for (int i = 0; i < 28; i++) {
    float t = float(i) / 27.0 - 0.5;
    float w = 1.0 - abs(t) * 0.8;
    acc += texture2D(inputBuffer, uv + uVel * t) * w;
    tot += w;
  }
  outputColor = acc / tot;
}`,
      { attributes: EffectAttribute.CONVOLUTION, uniforms: new Map([["uVel", new THREE.Uniform(new THREE.Vector2())]]) },
    );
  }
}

// Garde-fou : un seul pixel NaN / infini (rare, dans le rendu logiciel) suffirait à noircir toute
// l'image via le flou du bloom. On le neutralise avant, dans une passe séparée.
class SanitizeEffect extends Effect {
  constructor() {
    super(
      "Sanitize",
      /* glsl */ `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 c = inputColor;
  bool bad = any(isnan(c)) || any(isinf(c)) || abs(c.r) > 6e4 || abs(c.g) > 6e4 || abs(c.b) > 6e4;
  outputColor = bad ? vec4(0.0, 0.0, 0.0, 1.0) : clamp(c, vec4(0.0), vec4(400.0));
}`,
      { attributes: EffectAttribute.CONVOLUTION },
    );
  }
}

class GrainEffect extends Effect {
  constructor() {
    super(
      "Grain",
      /* glsl */ `
uniform float uSeed;
uniform float uAmount;
float rnd(vec2 p) { p += uSeed * vec2(37.0, 17.0); vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 px = floor(uv * vec2(${W.toFixed(1)}, ${H.toFixed(1)}));
  float n = (rnd(px) + rnd(px + 17.3) - 1.0);
  float l = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));
  // grain plus présent dans les ombres et les tons moyens, discret dans les hautes lumières
  vec3 c = inputColor.rgb + n * uAmount * (0.35 + 0.65 * (1.0 - l));
  outputColor = vec4(c, inputColor.a);
}`,
      {
        blendFunction: BlendFunction.NORMAL,
        uniforms: new Map<string, THREE.Uniform>([
          ["uSeed", new THREE.Uniform(0)],
          ["uAmount", new THREE.Uniform(POST.grain)],
        ]),
      },
    );
  }
}

export const Post: React.FC = () => {
  const frame = useCurrentFrame();
  const blur = useMemo(() => new DirectionalBlurEffect(), []);
  const grain = useMemo(() => new GrainEffect(), []);
  const sanitize = useMemo(() => new SanitizeEffect(), []);
  const caOffset = useMemo(() => new THREE.Vector2(POST.chromaticAberration, POST.chromaticAberration * 0.6), []);

  useLayoutEffect(() => {
    const [vx, vy] = cameraScreenVelocity(frame);
    // px/frame → uv, l'axe y de l'UV monte quand celui de l'écran descend ; plafonné pour rester lisible
    const k = POST.motionBlurShutter;
    const ux = THREE.MathUtils.clamp((vx * k) / W, -0.12, 0.12);
    const uy = THREE.MathUtils.clamp((-vy * k) / H, -0.08, 0.08);
    (blur.uniforms.get("uVel") as THREE.Uniform<THREE.Vector2>).value.set(ux, uy);
    (grain.uniforms.get("uSeed") as THREE.Uniform<number>).value = (frame % 97) * 1.37;
  }, [frame, blur, grain]);

  return (
    <EffectComposer multisampling={0}>
      <primitive object={sanitize} />
      <Bloom mipmapBlur intensity={POST.bloomIntensity} luminanceThreshold={POST.bloomThreshold} luminanceSmoothing={POST.bloomSmoothing} radius={POST.bloomRadius} levels={8} />
      <primitive object={blur} />
      <ChromaticAberration offset={caOffset} radialModulation modulationOffset={0.32} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette darkness={POST.vignette} offset={0.32} />
      <primitive object={grain} />
    </EffectComposer>
  );
};
