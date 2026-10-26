// Assemblage : chaque scène enregistre sa caméra, ses transitions et ses impacts, puis ajoute
// ses segments au trajet unique de la ligne lumineuse, dans l'ordre chronologique.
import { TrackBuilder, setTrack } from "./lib/track";
import { toWorld } from "./lib/world";
import { HOOK_START, hookLine, hookSetup } from "./scenes/S1Hook";
import { siteLine, siteSetup } from "./scenes/S2Site";
import { servicesLine, servicesSetup } from "./scenes/S3Services";
import { forWhoLine, forWhoSetup } from "./scenes/S4ForWho";
import { mobileLine, mobileSetup } from "./scenes/S5Mobile";
import { languagesLine, languagesSetup } from "./scenes/S6Languages";
import { offerLine, offerSetup } from "./scenes/S7Offer";
import { logoLine, logoSetup } from "./scenes/S8Logo";

let built = false;
export const buildTimeline = () => {
  if (built) return;
  built = true;
  for (const setup of [hookSetup, siteSetup, servicesSetup, forWhoSetup, mobileSetup, languagesSetup, offerSetup, logoSetup]) setup();
  const T = new TrackBuilder(toWorld("hook", HOOK_START), 0);
  for (const line of [hookLine, siteLine, servicesLine, forWhoLine, mobileLine, languagesLine, offerLine, logoLine]) line(T);
  setTrack(T);
};
