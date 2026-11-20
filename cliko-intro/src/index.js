// Point d'entrée navigateur : window.ClikoIntro
import { mountClikoIntro, play, shouldShow, createIntro } from "./intro.js";
import { renderOffline } from "./audio.js";
import { VIDEO_END, BEAT } from "./timeline.js";

const api = { mount: mountClikoIntro, play, shouldShow, createIntro, renderOffline, VIDEO_END, BEAT, version: "1.0.0" };
window.ClikoIntro = api;

// <script src="/cliko-intro.js" data-auto defer></script> : montage automatique
const me = document.currentScript;
if (me && me.hasAttribute("data-auto")) {
  const ds = me.dataset;
  const t = /[?&]t=([\d.]+)/.exec(location.search);
  const go = () => mountClikoIntro({ frequency: ds.frequency || "session", autoplay: ds.autoplay, contactHref: ds.contact, lang: ds.lang, startAt: t ? +t[1] : 0 });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go, { once: true });
  else go();
}
export default api;
