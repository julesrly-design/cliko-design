"use client";
// Intro « GTA VI IS HERE. WE ARE TOO. » pour cliko.be (Next.js App Router).
// 1. Copier dist/cliko-intro.js dans public/cliko-intro.js
// 2. Dans app/layout.tsx : <head><script dangerouslySetInnerHTML={{ __html: CLIKO_INTRO_PREPAINT }} /></head>
//    puis <ClikoIntro /> juste avant </body>.
import Script from "next/script";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    ClikoIntro?: { mount: (o?: Record<string, unknown>) => unknown; play: (o?: Record<string, unknown>) => unknown };
  }
}

// Pages d'accueil uniquement (FR, NL, EN)
const HOME = /^\/(nl|en)?\/?$/;

// Anti-flash : masque le site d'un voile noir jusqu'au montage de l'intro (au plus 4 s, même si le script échoue).
// Mêmes règles que l'intro : ?nointro, déjà vue dans la session, robots → rien n'est masqué.
export const CLIKO_INTRO_PREPAINT = `(function(){try{var q=location.search,p=location.pathname;
if(!/^\\/(nl|en)?\\/?$/.test(p)||/[?&]nointro\\b/.test(q))return;
if(!/[?&]intro\\b/.test(q)&&sessionStorage.getItem("cliko-intro:v1"))return;
if(/bot|crawl|spider|slurp/i.test(navigator.userAgent)||(navigator.connection&&navigator.connection.saveData))return;
var d=document.documentElement;d.classList.add("ck-intro-pending");
var s=document.createElement("style");s.textContent="html.ck-intro-pending body::after{content:'';position:fixed;inset:0;background:#05030a;z-index:2147483646}";
document.head.appendChild(s);setTimeout(function(){d.classList.remove("ck-intro-pending")},4000)}catch(e){}})();`;

export default function ClikoIntro() {
  const pathname = usePathname() || "/";
  if (!HOME.test(pathname)) return null;
  const lang = pathname.startsWith("/nl") ? "nl" : pathname.startsWith("/en") ? "en" : "fr";
  return (
    <Script
      src="/cliko-intro.js"
      strategy="afterInteractive"
      onReady={() => window.ClikoIntro?.mount({ lang, frequency: "session", contactHref: "#contact" })}
    />
  );
}

// Bouton « Revoir le trailer » (facultatif, par ex. dans le footer) :
export function ReplayTrailer({ children = "Revoir le trailer" }: { children?: React.ReactNode }) {
  return (
    <button type="button" onClick={() => window.ClikoIntro?.play()}>
      {children}
    </button>
  );
}
