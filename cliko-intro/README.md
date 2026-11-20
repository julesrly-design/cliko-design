# Cliko — « GTA VI IS HERE. WE ARE TOO. »

Intro motion design **temps réel** pour l'arrivée sur cliko.be. Le film est calculé en direct par le navigateur, à partir de code et sans aucun fichier média. Il mêle des décors procéduraux en WebGL, une typographie cinétique, le vrai logo Cliko dessiné en néon et une bande-son synthwave originale générée en Web Audio, calée sur l'image au temps près.

- **Poids** : un seul fichier JavaScript de 31 Ko compressé (`dist/cliko-intro.js`), sans dépendance, sans vidéo, sans MP3 ni image.
- **Durée** : 35 s à 110 BPM. L'intro rend la main au site automatiquement à 42 s ; on peut la passer à tout moment.
- **Reel Instagram** : `out/cliko-gta6-reel-9x16.mp4` (1080×1920, 30 i/s, 38 s, H.264 + AAC, son à −14 LUFS), même film et même musique.

## Déroulé (grille musicale : 1 temps = 0,545 s)

| Temps | Scène | Image | Son |
|---|---|---|---|
| 0 – 4,4 s | **1. L'attente** | Noir, lumières de ville floues roses et ambrées qui s'allument une à une, flare anamorphique. « THE WAIT IS OVER. » se pose mot à mot, le flou se résorbe, l'interlettrage se resserre. Poussée caméra et aberration chromatique. | Nappe Am9, battements de cœur sur chaque mot, montée, cymbale inversée |
| 4,4 – 12,5 s | **2. L'annonce** | Traversée vers un coucher de soleil sur l'océan (palmiers en contre-jour, reflets). « GTA » puis « VI » tombent en dégradé coucher de soleil, avec secousse et flash. Whip vers une autoroute néon où « IS HERE. » s'allume comme une enseigne qui grésille. Skyline de nuit et reflets dans l'eau, carton « Bruxelles — 19:47 ». | Impact, batterie à grosse réverb, basse pompée, arpèges, whoosh, grésillements néon, roulement de toms |
| 12,5 – 13,1 s | *Le souffle* | Noir total. | Silence, cymbale inversée |
| 13,1 – 19,6 s | **3. Le reveal** | Impact et flash blanc. Un soleil géant se contracte jusqu'au « o » ambre du logo : **le soleil de la campagne, c'est le point de Cliko**. Les lettres C, l, i, k se dessinent en néon (étincelle au bout du trait, le point du i rebondit), sous des rayons divins. « WE · ARE · TOO. » en chrome, un mot par accord. | Impact massif, basse qui s'ouvre, un grésillement par trait, 3 stabs synchronisés |
| 19,6 – 28,4 s | **4. Ce que nous créons** | 4 « missions », chacune avec son entrée de titre et son visuel animé : **01 Création de sites web** (masque, navigateur néon qui s'assemble, clic) · **02 Expériences digitales** (glitch RVB, téléphone, tunnel de lumière) · **03 Solutions modernes** (bascule 3D, cartes FR·NL·EN / Hébergement / 24 h) · **04 Développement sur mesure** (machine à écrire, code tapé, balayage laser). | Mélodie principale ; blips UI, glitchs, whooshes et frappe clavier calés sur chaque élément |
| 28,4 – 35 s | **5. La signature** | Coucher de soleil final, palmiers, oiseaux. Le logo Cliko apparaît, « THE FUTURE IS DIGITAL. » lettre à lettre, puis **cliko.be** et les boutons « Entrer sur le site » / « Demander un devis ». Les barres cinéma s'ouvrent. | Refrain à l'octave, scintillement sur les lettres, cloche sur cliko.be, accord final |
| Sortie | | Le logo final **vole jusqu'au logo de l'en-tête du site** pendant que l'intro se fond dans le bleu nuit de cliko.be. | Fondu |

## Intégration à cliko.be (Next.js)

Le code source du site n'est pas dans ce dépôt. L'intro a donc été conçue comme un module autonome et vérifiée **injectée dans la vraie page de production** (`npm run check`, 30 vérifications sur ordinateur et mobile).

1. Copier `dist/cliko-intro.js` dans `public/cliko-intro.js` du site.
2. Copier `integration/ClikoIntro.tsx` dans `components/`.
3. Dans `app/layout.tsx`, ajouter les deux lignes marquées ★ de `integration/layout.example.tsx` : le petit script anti-flash dans `<head>` et `<ClikoIntro />` avant `</body>`.

Rien d'autre ne change dans le site :

- **CSP** respectée : script servi en `self`, styles inline déjà autorisés, aucune requête réseau, aucune police externe (l'intro réutilise Schibsted Grotesk et Geist Mono déjà chargées par `next/font`).
- **Isolation** : tout est dans un Shadow DOM. Le CSS Tailwind du site ne touche pas l'intro, et l'intro ne touche pas le site.
- **Lenis / défilement** : molette et toucher sont bloqués pendant l'intro, puis tout est restauré à la sortie (vérifié sur le site réel).
- **Accessibilité** : boîte de dialogue modale, site rendu `inert` derrière, focus géré, Échap pour passer, M pour couper le son, résumé textuel pour les lecteurs d'écran.
- **Fréquence** : une fois par session (configurable). `?intro` force la lecture, `?nointro` la désactive. Les robots d'indexation ne la voient pas, et le HTML du site reste intact pour le SEO.
- **Langues** : FR / NL / EN selon la page (`/`, `/nl`, `/en`). Les slogans restent en anglais.

### Options de `ClikoIntro.mount({ … })`

| Option | Défaut | Effet |
|---|---|---|
| `frequency` | `"session"` | `"session"`, `"once"` (une seule fois par navigateur) ou `"always"` |
| `autoplay` | écran de lancement | `"muted"` démarre tout de suite, sans son, avec un bouton pour l'activer |
| `lang` | `<html lang>` | `"fr"`, `"nl"`, `"en"` |
| `contactHref` | `"#contact"` | Cible du bouton « Demander un devis » |
| `startAt` | `0` | Démarrer en cours de film, en secondes (contrôle qualité : `?intro&t=28`) |

`ClikoIntro.play()` rejoue le trailer, par exemple depuis un bouton « Revoir le trailer » (`ReplayTrailer` dans le composant).

### Pourquoi un écran « Lancer le trailer » ?

Les navigateurs interdisent de lancer du son sans geste de l'utilisateur. Comme la musique porte la moitié de l'émotion, le premier écran (logo, bokeh, « Une production Cliko · Bruxelles ») propose de lancer le trailer **avec le son**, comme une bande-annonce de jeu. Le lien « Entrer directement sur le site » reste toujours visible. Avec `autoplay: "muted"`, le film démarre sans attendre de clic, en silence.

## Mouvement réduit, performances, compatibilité

- **`prefers-reduced-motion`** : aucune animation. On affiche l'affiche finale fixe (logo, « GTA VI is here. We are too. », « The future is digital. », cliko.be) avec les boutons, plus « Lire le trailer » pour qui le souhaite quand même.
- **Performances** : le shader est rendu à résolution plafonnée (environ 1,35 Mpx sur ordinateur, 0,6 Mpx sur mobile). La résolution baisse automatiquement si l'appareil descend sous 38 images/s. Les styles ne sont écrits que s'ils changent, les scènes inactives sont retirées du rendu, la lecture se met en pause quand l'onglet est masqué, et la musique est ordonnancée à la volée.
- **Sans WebGL** : un dégradé coucher de soleil en CSS remplace les décors, et le reste fonctionne.
- **Données mobiles** : avec le mode économie de données, l'intro ne se lance pas.

## Musique

« Sunset Drive », composition originale (aucun sample, aucun emprunt) : La mineur, 110 BPM, grille Am9 · Fmaj7 · Cadd9 · G6. On y trouve des nappes de dents de scie désaccordées, une basse en croches pompée par la grosse caisse (sidechain), une caisse claire à grosse réverb, des arpèges en délai ping-pong et une mélodie à vibrato. La structure monte progressivement : intro planante, entrée de la batterie, souffle, impact du reveal, refrain, final à l'octave. Plus d'une centaine d'effets sonores (frappes, blips, glitchs, whooshes, impacts) sont calés sur les animations. Mix autour de −15 LUFS dans le navigateur ; Reel masterisé à −14 LUFS, crête à −1 dBTP.

## Développement

Les scripts de contrôle et de rendu utilisent Playwright (déjà présent dans `cliko-reel`) et ffmpeg.

```bash
npm i
npm run build            # dist/cliko-intro.js (+ .esm.js, .debug.js)
python3 -m http.server 8765 --bind 127.0.0.1 &
open http://127.0.0.1:8765/demo/        # démo avec un faux fond de site
npm run check            # test d'intégration sur le vrai cliko.be (Playwright)
npm run audio            # out/cliko-intro-music.wav (rendu hors ligne de la musique)
node scripts/render-video.mjs 1080x1920 out/cliko-gta6-reel-9x16.mp4   # Reel Instagram
node scripts/snap.mjs out/snaps 1280x720 8 24.5 26 52      # planches de contrôle (temps en temps musicaux)
```

Code : `src/timeline.js` (grille et courbes), `src/intro.js` (montage et rendu image par image), `src/gl.js` (6 décors en GLSL), `src/silhouettes.js` (palmiers, oiseaux), `src/audio.js` (synthés, effets, partition), `src/markup.js` / `src/styles.js` (structure et matières typographiques), `src/i18n.js` (textes).

## Note sur la marque GTA VI

Aucun élément protégé n'est repris : ni logo, ni police, ni illustration, ni musique de Rockstar Games. « GTA VI » apparaît seulement comme texte, dans la typographie de Cliko. Les couleurs coucher de soleil, les palmiers et le néon relèvent d'une esthétique générique (Miami, synthwave). Une campagne qui cite une marque tierce peut tout de même attirer l'attention de son titulaire : à faire valider avant une diffusion payante.
