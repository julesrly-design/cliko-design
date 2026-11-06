/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setPixelFormat("yuv420p"); // format lisible partout (iPhone, navigateurs)
Config.setColorSpace("bt709");
Config.setOverwriteOutput(true);
Config.setBrowserExecutable(process.env.REMOTION_BROWSER ?? null);
Config.setChromiumOpenGlRenderer("angle");
