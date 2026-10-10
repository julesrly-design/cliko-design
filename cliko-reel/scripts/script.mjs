// Script voix off. `say` = texte envoyé à la synthèse (forme phonétique),
// `show` = forme écrite affichée en sous-titre. Les mots-clés (`key`) sont surlignés en accent.
export const HOOKS = {
  A: "Votre commerce mérite mieux qu'un site fait à la chaîne.",
  B: "Les agences web vous traitent comme un numéro ? Pas nous.",
};

export const BODY = [
  { scene: "probleme", say: "Une page Facebook, une fiche Google, des photos sur un téléphone… tout est éparpillé." },
  { scene: "solution", say: "Cliko rassemble tout à une seule adresse : la vôtre." },
  {
    scene: "offre",
    say: "Un site sur-mesure, pensé pour votre activité. Parfait sur téléphone. Hébergé, mis à jour, en français, néerlandais et anglais. Et on peut même gérer vos réseaux sociaux.",
  },
  {
    scene: "humain",
    say: "Mais surtout, on vous écoute. Pas de ticket, pas de robot : vous parlez directement à Jules et Louis, ceux qui construisent votre site. Une question ? Réponse en vingt-quatre heures.",
  },
  { scene: "cta", say: "Cliko. Votre commerce mérite d'être trouvé. Devis gratuit sur cliko point be." },
];

// Remplacements phonétique → écrit pour les sous-titres (appliqués sur les mots alignés).
export const DISPLAY = [
  [/vingt-quatre heures/gi, "24 h"],
  [/cliko point be/gi, "cliko.be"],
];

// Si « Cliko » est mal prononcé, on remplace ici (ex. « Clicko », « Kliko ») sans toucher aux sous-titres.
export const PHONETIC = [[/\bCliko\b/g, process.env.CLIKO_SAY ?? "Cliko"]];
export const toSay = (t) => PHONETIC.reduce((s, [re, r]) => s.replace(re, r), t);
