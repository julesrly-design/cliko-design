# Cliko — reel motion design (Remotion)

Vidéo verticale 1080×1920, 60 fps, 30 s (1800 frames), pour Instagram Reels, TikTok et Facebook.
Une seule ligne de lumière traverse toute la vidéo et relie toutes les informations. La dernière
frame rejoint la première : la vidéo boucle sans couture.

Deux compositions :

- **`ClikoNeon`** (version actuelle, `src/neon/`) : direction « néon de marque », inspirée des pubs
  produit type Duolingo. Un univers d'une seule couleur, l'ambre du logo, sur une nuit très sombre.
  Un fil néon fin, lisse et parfaitement rond relie des interfaces épurées (téléphone, liste de
  services, arbre de lumière, compteur de prix). C'est du 2D/2,5D en SVG et HTML, sans WebGL : net,
  et rapide à rendre.
- **`ClikoMotion`** (première version, `src/scenes/`, `src/three/`) : tout en 3D WebGL (React Three
  Fiber, bloom HDR, verre, chrome).

## Livrables (`out/`)

| Fichier | Contenu |
|---|---|
| `cliko-motion.mp4` | Rendu final H.264 1080×1920, 60 fps, 24 Mb/s, musique et bruitages, −14 LUFS |
| `cliko-reel-telephone.mp4` | Même vidéo, plus légère (6 Mb/s, ~23 Mo) |
| `cliko-reel-mini.mp4` | Aperçu 720×1280 (~10 Mo) |
| `miniature.png` / `.jpg` | Couverture du Reel : logo, « cliko.be », « Lien en bio » (frame 1725) |
| `stills/` | Images de contrôle (non versionnées) |

## Commandes

```bash
npm i
npx remotion studio                 # prévisualisation (ClikoNeon, ClikoMotion)
COMP=ClikoNeon npm run stills -- 0 60 240 600 1200 1700   # images de contrôle → out/stills/
npm run render                      # rendu complet + encodages + miniature (scripts/render-all.sh)
npm run thumbnail                   # miniature seule (frame THUMBNAIL_FRAME de config.ts)
npm run sfx:list                    # régénère SFX.md (frames exactes des bruitages)
python3 scripts/synth_music.py      # régénère la musique (public/music.mp3)
```

Dans le conteneur cloud (sans GPU), il faut d'abord :
`export REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`.
`ClikoNeon` se rend en ~1 s par frame. `ClikoMotion` (WebGL via `swangle`) prend 2 à 4 s par frame.

### Version néon : où modifier quoi

- Couleurs, logo et courbes : `src/neon/theme.ts`.
- Textes : `src/config.ts` (`TEXT`, dont `servicesShort` et `offer.included`, pensés pour tenir la
  règle des 6 mots à l'écran).
- Chaque scène se trouve dans `src/neon/scenes/N1…N8`. On y trouve le trajet du fil (points de
  passage et frames), la caméra (images clés), les éléments et leurs frames d'apparition.
- Fil néon, halos, étincelles et onde de choc : `src/neon/Neon.tsx`. Les halos sont des couches de
  traits, sans filtre SVG : Chrome redessine mal les flous SVG sous un parent transformé.
- Interfaces (téléphone, cartes, bulles, drapeaux, texte cinétique, logo, caméra, transitions) :
  `src/neon/UI.tsx`.

## Version 3D : tout modifier depuis `src/config.ts`

- **Couleurs** : `PALETTE = PALETTES.brand` (charte de cliko.be : nuit, ambre du logo, royal).
  `PALETTES.electric` reprend la palette du brief (cyan #00E5FF → violet #7C4DFF).
- **Textes** : `TEXT` (accroche, services, cibles, notifications, langues, prix, CTA).
- **Timings** : `SCENES` (début et fin de chaque scène, en frames à 60 fps).
- **Ligne** : `LINE` (intensité HDR, longueur de traînée, épaisseur, lumière, étincelles).
- **Post-processing** : `POST` (bloom, aberration chromatique, grain, vignettage, flou de mouvement).
- **Audio** : `AUDIO` (musique, bruitages, volumes). **Zones sûres** : `SAFE`, calque `SHOW_SAFE_ZONES`.

## Musique

`public/music.mp3` est une musique originale composée par `scripts/synth_music.py` : électro sombre
en fa mineur à 120 BPM, libre de droits. Elle est calée sur la vidéo : drop à 2,5 s, relances sur les
transitions, suspension puis gros impact sur le logo à 27 s, fin qui reboucle. Pour en utiliser une
autre, il suffit de remplacer le fichier et de relancer `npm run render`, ou de la poser dans
l'application du réseau social (`AUDIO.music = false`). La vidéo est montée sur une grille de
120 BPM (une noire = 30 frames, une croche = 15 frames).

## Bruitages

`SFX.md` liste chaque déclenchement : frame, temps, position sur la grille, type et événement.
`sfx-cues.json` contient la même liste en JSON. La source est `src/neon/sfx.ts` pour la version
néon, `src/sfx.ts` pour la version 3D. `whoosh`, `whooshDeep`
et `tick` viennent d'ElevenLabs (`npm run sfx`, quota épuisé pour le reste). `impact`, `riser`, `pop`,
`flap` et `sparkle` sont synthétisés (`npm run sfx:synth`). Pour remplacer un son, il suffit de
changer le fichier dans `SFX_FILES`.

## Architecture

```
src/
  neon/                version néon (ClikoNeon) : theme, paths (tracés lisses), Neon (fil, halos),
                       UI (interfaces, caméra, transitions), Backdrop, sfx, scenes/N1…N8
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
- **Six mots maximum à l'écran** : dans la version néon, « Création sur mesure » devient « Sur
  mesure » dans la liste des services (juste après « On crée ton site. »). Le sous-titre de l'offre
  devient trois pastilles (« Hébergement », « Domaine », « Maintenance ») suivies de « compris ».
- Le site du téléphone (« La Table ») est un exemple fictif, avec une photo tirée d'une démo de
  cliko.be.
