# Cliko — reel motion design 3D (Remotion + React Three Fiber)

Vidéo verticale 1080×1920, 60 fps, 30 s (1800 frames), pour Instagram Reels, TikTok et Facebook.
Une seule ligne de lumière traverse toute la vidéo et relie toutes les informations. La dernière
frame rejoint la première : la vidéo boucle sans couture.

## Livrables (`out/`)

| Fichier | Contenu |
|---|---|
| `cliko-motion.mp4` | Rendu final H.264, 1080×1920, 60 fps, bruitages inclus (sans musique) |
| `miniature.png` | Couverture du Reel : logo complet, ligne à son éclat maximum (frame 1725) |
| `stills/` | Images de contrôle (non versionnées) |

## Commandes

```bash
npm i
npx remotion studio                 # prévisualisation
npm run stills -- 0 60 240 600 1200 1700   # images de contrôle → out/stills/
npx remotion render src/index.ts ClikoMotion out/cliko-motion.mp4
npm run thumbnail                   # miniature (frame THUMBNAIL_FRAME de config.ts)
npm run sfx:list                    # régénère SFX.md (frames exactes des bruitages)
```

Dans le conteneur cloud (sans GPU), il faut d'abord :
`export REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`.
Le rendu WebGL passe alors par `swangle` (ANGLE + SwiftShader, réglé dans `remotion.config.ts`),
à environ 2 à 4 s par frame. Sur une machine avec GPU, `--gl=angle` est beaucoup plus rapide.

## Tout modifier depuis `src/config.ts`

- **Couleurs** : `PALETTE = PALETTES.brand` (charte de cliko.be : nuit, ambre du logo, royal).
  `PALETTES.electric` reprend la palette du brief (cyan #00E5FF → violet #7C4DFF).
- **Textes** : `TEXT` (accroche, services, cibles, notifications, langues, prix, CTA).
- **Timings** : `SCENES` (début et fin de chaque scène, en frames à 60 fps).
- **Ligne** : `LINE` (intensité HDR, longueur de traînée, épaisseur, lumière, étincelles).
- **Post-processing** : `POST` (bloom, aberration chromatique, grain, vignettage, flou de mouvement).
- **Audio** : `AUDIO` (musique, bruitages, volumes). **Zones sûres** : `SAFE`, calque `SHOW_SAFE_ZONES`.

## Musique

Déposer la musique (120 BPM) dans `public/music.mp3`, passer `AUDIO.music` à `true`, puis relancer
le rendu. On peut aussi ajouter la musique directement dans l'application du réseau social : la
vidéo est montée sur une grille de 120 BPM (une noire = 30 frames, une croche = 15 frames), et les
coupes et impacts tombent sur cette grille.

## Bruitages

`SFX.md` liste chaque déclenchement : frame, temps, position sur la grille, type et événement.
`sfx-cues.json` contient la même liste en JSON. La source est `src/sfx.ts`. `whoosh`, `whooshDeep`
et `tick` viennent d'ElevenLabs (`npm run sfx`, quota épuisé pour le reste). `impact`, `riser`, `pop`,
`flap` et `sparkle` sont synthétisés (`npm run sfx:synth`). Pour remplacer un son, il suffit de
changer le fichier dans `SFX_FILES`.

## Architecture

```
src/
  config.ts            tout ce qui se règle (couleurs, textes, timings, effets, audio)
  ClikoMotion.tsx      composition : un monde 3D (ThreeCanvas) + un calque HTML, une <SceneSeq> par scène
  timeline.ts          assemble caméras, transitions et le trajet unique de la ligne
  scenes/S1…S8         chaque scène : trajet de la ligne, caméra, objets 3D, textes
  lib/
    track.ts           trajet de la tête (segments chaînés, fonction pure de la frame, bouclage)
    camera.ts          caméra pure de la frame, whip-pans, tremblements, projection
    world.ts           placement des scènes dans le monde (la caméra plonge, pivote, bascule)
    homography.ts      textes HTML posés sur les plans 3D (matrix3d) : nets et solidaires de la 3D
    fonts.ts           polices + contours vectoriels (opentype.js) pour tracer les lettres
  three/
    Line.tsx           traînée HDR, tête, pointLight, étincelles
    Stage.tsx          fond, grille 3D réactive, particules (fausse profondeur de champ), éclairage
    Post.tsx           bloom, flou directionnel, aberration, ACES, vignettage, grain
    GlowPath.tsx       tracés persistants (bords de fenêtre, cartes, rues)
    Icons.tsx, Phone.tsx  icônes chromées extrudées, smartphone titane
  overlay/             calques texte (lettres tracées, zones sûres)
```

Pas de grain animé (`POST.grain = 0`) : le fond reste noir et calme. Les trajets de la ligne
sont des courbes centripètes, ses coins arrondis, sa tête un disque parfaitement rond.

Tout est piloté par la frame (`useCurrentFrame`), sans aucune animation en temps réel. Le
hasard (étincelles, particules, palettes) est tiré de graines fixes : deux rendus donnent
exactement la même image.

## Contenu à vérifier

- **Prix** : « Dès 750 € », le prix de départ affiché sur cliko.be (`TEXT.offer.price`).
- **Sous-titre de l'offre** : « Hébergement, domaine, maintenance compris ». Le « et » a été retiré
  pour tenir la règle des 6 mots à l'écran (`TEXT.offer.subtitle`).
- L'écran du smartphone montre la démo « Maison Célest » de cliko.be (exemple de style).
