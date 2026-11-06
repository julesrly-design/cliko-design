# Cliko — film motion design · storyboard

**Format** : 1080×1920 · 30 fps · 25 s · **sans musique ni voix** : tout passe par le sound design (≈ 250 bruitages calés à la frame). Le découpage reste sur une grille de 120 BPM (1 temps = 15 frames).
**Inspirations** : (1) lancement produit lumineux, coupe franche vers un fond clair, typographie cinétique mot à mot avec mots accentués, ruban qui traverse le cadre, bascules 3D, mot qui devient bouton, pile de pilules qui se rabattent, aplat de marque ; (2) flamme chaude sur noir, logo qui s'embrase, puces lumineuses et curseur, brief tapé, code qui file en flou de mouvement, carte de site en 3D qui se recolore, lettres qui se posent en arc.
**Fil rouge** : le point ambre du logo « Cliko. » — il s'allume, clique, envoie, et revient en point final.

| Frames | Temps | Scène | Ce qu'on voit | Son |
|---|---|---|---|---|
| 0–72 | 0–2,4 s | Allumage | Noir, flamme ambrée qui ondule. Le point ambre éclate en rayons ; « Cliko » sort de derrière lui, lettre par lettre, et le repousse en point final. | Boom, étincelle |
| 72–150 | 2,4–5 s | Les métiers | Trois rangées de puces en verre (Pizzeria, Coiffeur, Fleuriste…) inclinées en 3D, qui dérivent. Le curseur clique « Pizzeria » ; les autres s'envolent. | Whip, pops, clic |
| 150–240 | 5–8 s | Le brief | La puce s'ouvre en composeur : « Je veux un **site** pour ma **pizzeria**. », destinataire **Jules & Louis** (pas un robot). Envoi : le composeur fonce vers la caméra. | Clavier, montée, envoi |
| 240–300 | 8–10 s | Drop | Le code file vers la caméra (langues fr/nl/en, hébergement inclus…), une maquette fil de fer s'assemble, un balayage révèle la vraie capture. | Impact, data, pops |
| 300–420 | 10–14 s | Trois styles | Carte 3D : Forno Nero (flamme rouge) → « Plus **sobre** ? » → la même pizzeria en version sobre, dessinée en code (noir, filets fins, braise rouge ; flamme argent) → « Plus **chic** ? » → Maison Célest (or). Étiquette « Exemple de style ». | Whips, flips |
| 420–600 | 14–20 s | Coupe vers le clair | Papier clair, ruban ambré. « Un site qui vous **ressemble**. » · « Hébergé, mis à jour, en **3 langues**. » · « Vous parlez à **Jules & Louis**. » · « Directement. » devient une pilule ; « Réponse en 24 h » et « Devis gratuit » se rabattent par-dessus. | Hit, whips, flaps |
| 600–645 | 20–21,5 s | Aplat ambre | La pilule s'ouvre en plein écran ambre ; pilule nuit « Cliko. » qui grandit et avale l'écran. | Stab, roulement |
| 645–750 | 21,5–25 s | Plan final | Nuit étoilée : « Cliko. » s'embrase ; « Votre commerce mérite d'être **trouvé.** » (titre du site) se pose lettre par lettre en arc ; **cliko.be** + « Demander un devis gratuit ». | Impact, accord final |

Règles de contenu conservées : pas de prix, pas de chiffre ni d'avis inventé ; les démos sont étiquetées « Exemple de style » et leurs chiffres restent floutés.

## Son

Pas de musique : le film repose sur un sound design très présent. `src/motion/cues.ts` calcule chaque son à partir des animations elles-mêmes :
une touche de clavier par caractère tapé, un tic par puce, par mot et par lettre du titre final, un claquement par bloc de la maquette,
un whoosh pour chaque ligne de code qui frôle la caméra, des whips et flips sur les bascules, un coup de marqueur sur chaque mot-clé,
des pops sur les pilules, des impacts sur les trois coupes (8 s, 14 s, 21,5 s), et une ambiance de flamme sous les scènes sombres.
Les sons répétés varient légèrement en hauteur pour ne pas sonner « mitraillette ». Le film se termine sur un curseur qui clique
« Demander un devis gratuit ».

## Fabrication

```bash
npm run sfx:motion     # 16 bruitages ElevenLabs → public/motion/sfx (déjà générés et versionnés)
npm run sfx:mix        # feuille de bruitages → public/motion/sfx-mix.wav (piste son unique du film)
npx remotion studio    # composition « ClikoMotion »
npx remotion render src/index.ts ClikoMotion out/raw-motion.mp4 --crf=16 --audio-bitrate=320k
scripts/master.sh out/raw-motion.mp4 out/cliko-motion.mp4   # −14 LUFS, crête ≤ −1 dBTP
```

Code : `src/motion/` (`timeline.ts` pour tous les timings, `kit.tsx` pour la flamme, le ruban, le curseur, les rayons).
Pour déplacer ou ajouter un son : modifier `src/motion/cues.ts`, puis `npm run sfx:mix`. L'ancienne musique synthétisée reste disponible (`npm run music:motion`) mais n'est plus utilisée.
