// Script voix off : texte source dans src/script.json (forme envoyée à la synthèse).
// Les sous-titres affichent la forme écrite (voir src/components/Captions.tsx).
import script from "../src/script.json" with { type: "json" };

// Source unique du texte : src/script.json (partagé avec la composition Remotion).
export const HOOKS = script.hooks;
export const BODY = script.body;

// Remplacements phonétique → écrit pour les sous-titres (appliqués sur les mots alignés).
export const DISPLAY = [
  [/vingt-quatre heures/gi, "24 h"],
  [/cliko point be/gi, "cliko.be"],
];

// Si « Cliko » est mal prononcé, on remplace ici (ex. « Clicko », « Kliko ») sans toucher aux sous-titres.
export const PHONETIC = [[/\bCliko\b/g, process.env.CLIKO_SAY ?? "Cliko"]];
export const toSay = (t) => PHONETIC.reduce((s, [re, r]) => s.replace(re, r), t);
