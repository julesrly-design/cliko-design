// Composition principale : un seul monde 3D (la ligne ne disparaît jamais), et une <Sequence>
// par scène, côté 3D (dans le canvas) comme côté texte (calques HTML nets au-dessus).
import React, { useEffect, useState } from "react";
import { AbsoluteFill, getInputProps, useDelayRender } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { PALETTE, VIDEO } from "./config";
import { fontsReady, loadAllFonts } from "./lib/fonts";
import { buildTimeline } from "./timeline";
import { Background, CameraRig, Grid, Particles, StudioEnvironment } from "./three/Stage";
import { Line } from "./three/Line";
import { Post } from "./three/Post";
import { SyncCamera } from "./three/SyncCamera";
import { SceneSeq } from "./lib/seq";
import { HookOverlay } from "./scenes/S1Hook";
import { Site3D, SiteOverlay } from "./scenes/S2Site";
import { Services3D, ServicesOverlay } from "./scenes/S3Services";
import { ForWho3D, ForWhoOverlay } from "./scenes/S4ForWho";
import { Mobile3D, MobileOverlay } from "./scenes/S5Mobile";
import { LanguagesOverlay } from "./scenes/S6Languages";
import { OfferOverlay } from "./scenes/S7Offer";
import { FlashOverlay, Logo3D, LogoOverlay } from "./scenes/S8Logo";
import { SafeZones } from "./overlay/SafeZones";
import { Soundtrack } from "./Soundtrack";

// Attend les polices (les contours des lettres pilotent le trajet de la ligne), puis construit la timeline.
export const useReady = () => {
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = useState(() => (fontsReady() ? null : delayRender("Polices")));
  const [ready, setReady] = useState(fontsReady());
  useEffect(() => {
    if (ready) return;
    loadAllFonts().then(() => {
      buildTimeline();
      setReady(true);
      if (handle !== null) continueRender(handle);
    });
  }, [ready, handle, continueRender]);
  if (ready) buildTimeline();
  return ready;
};

// Diagnostic : --props='{"hide":["post","line"]}' masque des éléments du monde 3D.
const HIDE: string[] = ((getInputProps() as { hide?: string[] }).hide ?? []) as string[];
const on = (k: string) => !HIDE.includes(k);

export const World: React.FC = () => (
  <ThreeCanvas width={VIDEO.width} height={VIDEO.height} flat gl={{ antialias: false, powerPreference: "high-performance" }} camera={{ fov: 40, near: 0.05, far: 400 }}>
    <SyncCamera />
    {on("bg") && <Background />}
    {on("env") && <StudioEnvironment />}
    <CameraRig />
    <ambientLight intensity={0.08} />
    {on("grid") && <Grid />}
    {on("particles") && <Particles />}
    {on("line") && <Line />}
    {/* objets 3D de chaque scène, montés seulement autour de leur fenêtre de temps */}
    <SceneSeq id="site" layout="none" pre={30} post={40}>
      <Site3D />
    </SceneSeq>
    <SceneSeq id="services" layout="none" pre={30} post={30}>
      {on("services") && <Services3D />}
    </SceneSeq>
    <SceneSeq id="forWho" layout="none" pre={40} post={30}>
      <ForWho3D />
    </SceneSeq>
    <SceneSeq id="mobile" layout="none" pre={30} post={30}>
      <Mobile3D />
    </SceneSeq>
    <SceneSeq id="logo" layout="none" pre={0} post={0}>
      <Logo3D />
    </SceneSeq>
    {on("post") && <Post />}
  </ThreeCanvas>
);

export const ClikoMotion: React.FC = () => {
  const ready = useReady();
  if (!ready) return <AbsoluteFill style={{ background: PALETTE.bg }} />;
  return (
    <AbsoluteFill style={{ background: PALETTE.bg, overflow: "hidden" }}>
      <World />
      <AbsoluteFill>
        <SceneSeq id="hook" pre={0} post={30}>
          <HookOverlay />
        </SceneSeq>
        <SceneSeq id="site" pre={10} post={20}>
          <SiteOverlay />
        </SceneSeq>
        <SceneSeq id="services" pre={0} post={20}>
          <ServicesOverlay />
        </SceneSeq>
        <SceneSeq id="forWho" pre={0} post={20}>
          <ForWhoOverlay />
        </SceneSeq>
        <SceneSeq id="mobile" pre={0} post={20}>
          <MobileOverlay />
        </SceneSeq>
        <SceneSeq id="languages" pre={0} post={20}>
          <LanguagesOverlay />
        </SceneSeq>
        <SceneSeq id="offer" pre={0} post={20}>
          <OfferOverlay />
        </SceneSeq>
        <SceneSeq id="logo" pre={0} post={0}>
          <LogoOverlay />
        </SceneSeq>
        <FlashOverlay />
      </AbsoluteFill>
      <SafeZones />
      <Soundtrack />
    </AbsoluteFill>
  );
};
