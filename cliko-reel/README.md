# Cliko — Reel de présentation (Remotion)

Reel vertical 1080×1920 / 30 fps, ≈ 29 s, sur la charte de cliko.be. Le storyboard est dans [`STORYBOARD.md`](STORYBOARD.md).

## Livrables (`out/`)

| Fichier | Contenu |
|---|---|
| `cliko-reel.mp4` | Accroche A, musique et bruitages temporaires, sous-titres incrustés, son à −14 LUFS |
| `cliko-reel-accroche-B.mp4` | Variante B (« Les agences web vous traitent comme un numéro ? Pas nous. ») |
| `couverture.png`, `couverture-accroche-B.png` | Miniatures 1080×1920 ; l'accroche reste lisible dans le recadrage 4:5 de la grille |
| `legende.txt` | Légendes Instagram et TikTok, hashtags, commentaire épinglé |

`cliko-reel-voix-seule.mp4` sera produit dès que la voix ElevenLabs existera (composition `ClikoReelVoixSeule` : sans musique, avec voix et bruitages).

## Commandes

```bash
npm i
npm run fx          # trames de grain (public/fx)
npm run audio       # timeline + musique temporaire 122 BPM + bruitages (public/music, public/sfx)
npx remotion studio # prévisualisation (compositions ClikoReel, ClikoReelB, Scene-*, Couverture)

# rendus
npx remotion render src/index.ts ClikoReel out/raw-A.mp4 --crf=17 --audio-bitrate=256k
scripts/master.sh out/raw-A.mp4 out/cliko-reel.mp4          # −14 LUFS, crête ≤ −1 dBTP
npx remotion still src/index.ts Couverture out/couverture.png
```

Dans ce conteneur cloud, il faut d'abord exporter `REMOTION_BROWSER=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/*/)headless_shell`.

## Brancher la voix ElevenLabs

1. Mettre la clé dans `.env` (`ELEVENLABS_API_KEY=…`). Le fichier est ignoré par git.
2. `npm run casting:list`, puis `npm run casting:gen -- <id1> <id2> <id3>` : génère l'accroche avec 3 voix, pour en choisir une.
3. `VOICE_ID=<id> npm run voice` : produit `public/voice/voix-A.mp3`, `voix-B.mp3` et leurs timestamps mot à mot.
4. `npm run audio` recale la musique et les bruitages sur ces timestamps, puis on relance les rendus.

Les compositions détectent la voix toute seule (`src/voice.ts`). Les timestamps pilotent alors les sous-titres, les coupes et les bruitages, et la musique passe en retrait. Si « Cliko » est mal prononcé, il faut relancer avec `CLIKO_SAY=Kliko` (par exemple) ; les sous-titres gardent « Cliko ».

## Remplacer / compléter les éléments

- **Photo de Jules et Louis** : déposer `public/brand/jules-louis.jpg` (ou `.png` / `.webp`). Elle remplace automatiquement les initiales de la scène 5.
- **Musique** : déposer `public/music/music.mp3`. Elle remplace la piste temporaire.
- **Captures de cliko.be** : `npm run capture` (vidéos, horloge pilotée) et `npm run capture-demos` (démos en images nettes, chiffres floutés).
- **Couleurs, polices, courbes** : tout est dans `src/brand.ts`.
- **Texte** : `src/script.json` contient la voix, `src/captions.ts` le découpage des sous-titres et les mots en ambre.

## Règles de contenu respectées

Pas de prix, pas de chiffre ni d'avis inventé, pas de client. Les démos Atelier Verso, Forno Nero et Maison Célest sont présentées comme des *exemples de styles*, et leurs chiffres fictifs sont floutés. Les icônes sont génériques, sans logo Facebook, Google ou Instagram.
