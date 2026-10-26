// Réglages CLI (studio et rendu). L'API Node ignore ce fichier.
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
// WebGL : « swangle » = ANGLE sur SwiftShader, seul moteur qui crée un contexte WebGL dans ce conteneur sans GPU.
Config.setChromiumOpenGlRenderer("swangle");
// Conteneur cloud : navigateur Playwright préinstallé (voir README).
Config.setBrowserExecutable(process.env.REMOTION_BROWSER ?? null);
// Une scène 3D par onglet : on limite le nombre d'onglets simultanés.
Config.setConcurrency(Number(process.env.CONCURRENCY ?? 2));
Config.setCodec("h264");
Config.setCrf(16);
Config.setPixelFormat("yuv420p");
Config.setX264Preset("slow");
