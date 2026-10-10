# Cliko — Reel de présentation · Storyboard

**Format** : 1080×1920 · 30 fps · cible 36 s (fenêtre 30–38 s) · H.264
**Promesse** : un site unique, fait par deux humains qui écoutent, contre le site « à la chaîne ».
**Fil rouge visuel** : *la chaîne de montage se casse*. On ouvre sur l'industriel et le gris, on finit sur la couleur et l'humain. Chaque scène retire un peu de machine et ajoute un peu de vie.

> **Timings** : les valeurs ci-dessous sont des estimations (débit ≈ 3 mots/s). Le timing réel de chaque coupe, sous-titre et punch-in est calculé à partir des timestamps mot à mot renvoyés par ElevenLabs (`public/voice/alignment.json`). Seuls l'ordre, les ancrages (« sur le mot X ») et les durées minimales sont fixés ici.

---

## Grammaire visuelle

| Élément | Règle |
|---|---|
| Couleurs | Palette Cliko (extraite du site) : fond clair crème/blanc, encre sombre, **accent Cliko** réservé aux mots-clés et aux moments de « vie ». Scène 1 et 2 désaturées, la couleur gagne du terrain scène après scène. |
| Typo | Police titre du site, en gras (800–900) pour les sous-titres. Police texte du site pour les UI (barre d'adresse, chat). |
| Mouvement | Tout en `spring()` (damping 12–18, mass 0.6–1). Entrées avec léger dépassement, sorties rapides et sèches. Aucun fondu enchaîné « PowerPoint ». |
| Profondeur | 3 plans par scène minimum : fond (grille/flou), sujet, éléments flottants en avant-plan avec parallaxe ×1,3. |
| Flou de mouvement | `<Trail>` / `CameraMotionBlur` sur les déplacements > 40 px/frame (whip-pans, aspirations, chaîne de montage). |
| Grain | Bruit animé 4 % en overlay `soft-light` sur toute la durée. |
| Punch-in | Micro-zoom 1,00 → 1,06 en 4 frames (spring raide) sur les mots forts : *mieux*, *éparpillé*, *vôtre*, *sur-mesure*, *écoute*, *Jules et Louis*, *24 h*, *trouvé*. |
| Coupes | Chaque coupe tombe sur le début d'un mot (timestamp) **et** est arrondie au temps de musique le plus proche (±2 frames) à 122 BPM (1 temps ≈ 14,75 frames). |
| Sous-titres | 1 à 3 mots, centrés à y ≈ 1220 px (entre la zone utile et la zone basse), 96–110 px, gras, contour/ombre portée pour le contraste, mot-clé en accent Cliko. Pop d'entrée (scale 0,8 → 1, 5 frames) + petit « pop » sonore discret (-24 dB). |
| Zones de sécurité | Rien d'important dans y < 250, y > 1470, x > 930. Zone utile : x 60–930, y 250–1470. Overlay de contrôle activable dans Studio. |

---

## SCÈNE 1 — ACCROCHE · 0,0 → ~2,6 s

**VO** : « Votre commerce mérite **mieux** qu'un site fait à la **chaîne**. »
(Variante B : « Les agences web vous traitent comme un **numéro** ? **Pas nous**. »)

| Plan | Timing | Visuel | Texte à l'écran | Son |
|---|---|---|---|---|
| 1A | 0,0–0,9 s | **Frame 0 = miniature** : vue en plongée ¾ d'un tapis roulant industriel qui traverse l'écran en diagonale. Sur le tapis, une file de maquettes de sites gris, toutes identiques (header gris, bloc image gris, 3 lignes grises), chacune frappée d'un tampon « MODÈLE N°… ». Au centre, un site est déjà légèrement teinté de l'accent Cliko : l'œil sait qu'il va se passer quelque chose. Défilement rapide, flou de mouvement, éclairage d'usine froid. | « Votre commerce » | Tampon industriel *CLANK* sur le 1er frame, puis cliquetis mécanique en boucle. |
| 1B | 0,9–1,6 s | Un bras-tampon descend sur chaque site au rythme des temps (2 coups). Punch-in sur « mieux ». | « mérite **mieux** » | 2 tampons calés sur les temps. |
| 1C | 1,6–2,6 s | **Arrêt brutal** du tapis (frein, léger recul spring). Le site du centre se soulève hors de la file (translateZ + ombre qui s'élargit), pivote vers la caméra. La couleur se propage depuis son centre (masque radial) : photo, typographie, boutons. Il devient un site unique et vivant. Les autres restent gris, flous, en arrière-plan. | « qu'un site » → « fait à la **chaîne** » | Frein métallique + *whoosh* montant, la musique démarre sur le temps 1 au moment où la couleur explose. |

**Note A/B** : en variante B, le site de la file porte un gros numéro « #00347 » ; sur « Pas nous », le numéro se décolle et la couleur envahit le site. Même plan, seul le texte change (prop `hook`).

---

## SCÈNE 2 — PROBLÈME · ~2,6 → ~6,8 s

**VO** : « Une page Facebook, une fiche Google, des photos sur un téléphone… tout est **éparpillé**. »

| Plan | Timing | Visuel | Texte à l'écran | Son |
|---|---|---|---|---|
| 2A | sur « Une page Facebook » | Whip-pan vers le bas : un téléphone (maquette sombre, écran vide) au centre. Une icône **pouce levé** générique (trait épais, pas de logo) jaillit du téléphone vers le haut-gauche. | « Une page » → « Facebook » | Pop + whoosh court. |
| 2B | sur « une fiche Google » | Une **épingle de carte** générique jaillit vers la droite. | « une fiche » → « Google » | Pop. |
| 2C | sur « des photos » | Un **appareil photo** stylisé + 3 vignettes photo floues jaillissent en bas-gauche. | « des photos » → « sur un téléphone » | Pop ×2. |
| 2D | sur « téléphone » | Un **combiné** (icône téléphone) sonne et tremble. | | Mini-sonnerie. |
| 2E | sur « éparpillé » | Toutes les icônes dérivent loin du téléphone, tremblent (shake bruité 2–3 px), légère rotation chaotique, profondeur différente (parallaxe). Le téléphone se désature. Punch-in. | « tout est » → « **éparpillé** » | Dissonance légère, la musique se fait plus « sèche ». |

Fond : grille fine qui se déforme légèrement (vague), pour le chaos.

---

## SCÈNE 3 — SOLUTION · ~6,8 → ~9,8 s

**VO** : « **Cliko** rassemble tout à une seule adresse : **la vôtre**. »

| Plan | Timing | Visuel | Texte à l'écran | Son |
|---|---|---|---|---|
| 3A | sur « Cliko rassemble » | Une barre d'adresse de navigateur apparaît au centre (spring). Les icônes de la scène 2 sont **aspirées** vers elle (trajectoires courbes, flou de mouvement, rétrécissement), et s'aimantent sur sa gauche en petite pile. Inspiré de l'animation « Votre présence en ligne est éparpillée » du site. | « **Cliko** » → « rassemble tout » | *Whoosh* d'aspiration (reverse), « clacs » magnétiques. |
| 3B | sur « une seule adresse » | La barre tape `votrecommerce.be` lettre par lettre (caret clignotant, 1 lettre ≈ 1,5 frame), calé pour finir sur « la vôtre ». | « une seule » → « adresse » | Frappes clavier légères. |
| 3C | sur « la vôtre » | Validation : la touche « Entrée » s'enfonce, la barre s'illumine en accent Cliko, punch-in, onde de choc douce. | « **la vôtre** » | **Clic sonore** de validation (clic signature, version courte). |

---

## SCÈNE 4 — CE QU'ON FAIT · ~9,8 → ~20,0 s

**VO** : « Un site **sur-mesure**, pensé pour votre activité. **Parfait sur téléphone**. Hébergé, mis à jour, en **français, néerlandais et anglais**. Et on peut même gérer vos **réseaux sociaux**. »

| Plan | Timing | Visuel | Texte à l'écran | Son |
|---|---|---|---|---|
| 4A | sur « Un site sur-mesure » | La barre d'adresse se transforme (morph) en encoche d'un **téléphone 3D** qui pivote (rotateY −25° → 10°, spring lent) avec reflet spéculaire mobile. À l'écran : capture vidéo réelle du hero de cliko.be (scroll fluide). | « Un site » → « **sur-mesure** » | Whoosh profond. |
| 4B | sur « pensé pour » / « votre activité » | Changement d'écran à chaque mot-clé (balayage vertical à l'intérieur de l'écran) : démo **Atelier Verso** → **Forno Nero** → **Maison Célest**, captures interactives réelles. Petite étiquette discrète sous le téléphone : « Exemple de style » (jamais présentées comme des clients). | « pensé pour » → « votre **activité** » | Tick à chaque changement d'écran. |
| 4C | sur « Parfait sur téléphone » | Le téléphone se redresse face caméra, punch-in, la démo défile en douceur. | « **Parfait** » → « sur téléphone » | |
| 4D | sur « Hébergé, mis à jour » | Le téléphone recule ; une **tablette** puis un **ordinateur** glissent en parallaxe derrière lui, chacun montrant la version adaptée (capture desktop réelle). Chips flottantes : un nuage ✓ (« Hébergé »), une flèche circulaire ✓ (« Mis à jour »). | « Hébergé » → « mis à jour » | Deux pops. |
| 4E | sur « français, néerlandais et anglais » | 3 tuiles **FR · NL · EN** se retournent (flip 3D 180°, spring, décalage 4 frames) une par mot. | « **FR** » → « **NL** » → « **EN** » | 3 « flaps » de tuiles. |
| 4F | en parallèle de 4D–4E | Badge texte non lu par la voix, en haut de la zone utile : « **En ligne en 1 à 3 semaines** » (pilule accent, entrée spring, reste ≥ 2 s). | | |
| 4G | sur « réseaux sociaux » | Les 3 écrans se resserrent ; autour, des bulles de posts stylisées (icônes génériques cœur, bulle, partage — aucun logo officiel) se publient en cascade. | « Et on peut même » → « gérer vos » → « **réseaux sociaux** » | Pops en cascade. |

---

## SCÈNE 5 — L'HUMAIN · ~20,0 → ~31,3 s

**VO** : « Mais surtout, on vous **écoute**. Pas de ticket, pas de robot : vous parlez directement à **Jules et Louis**, ceux qui construisent votre site. Une question ? Réponse en **vingt-quatre heures**. »

| Plan | Timing | Visuel | Texte à l'écran | Son |
|---|---|---|---|---|
| 5A | sur « Mais surtout » (+0,5 s de respiration) | **Respiration** : la musique se coupe en filtre passe-bas pendant ~0,5 s. Les écrans s'effacent, fond qui se réchauffe (gradient crème → pêche chaud, lumière douce), grain plus présent. | « Mais surtout, » → « on vous **écoute** » | Silence musical, room tone chaud. Punch-in doux sur « écoute ». |
| 5B | sur « Pas de ticket » | Un ticket de support « **#48213** » (style reçu, bord dentelé) entre et se fait **barrer** d'un trait accent tracé à la main (stroke-dashoffset), puis tombe. | « Pas de **ticket** » | Trait de marqueur. |
| 5C | sur « pas de robot » | Une icône de **robot** grésille (glitch RGB, scanlines), clignote et s'**éteint** (écran CRT qui se referme). | « pas de **robot** » | Grésillement + extinction. La musique revient en douceur. |
| 5D | sur « vous parlez directement à Jules et Louis » | **Photo de Jules et Louis** : entrée en carte inclinée, qui se redresse (spring), légère parallaxe du sujet/fond, cadre arrondi. Punch-in sur leurs noms. | « vous parlez » → « directement à » → « **Jules et Louis** » | Accord chaud. |
| 5E | sur « ceux qui construisent votre site » | La photo glisse en haut ; dessous, petit plan de « construction » : blocs du site qui s'empilent. | « ceux qui » → « construisent » → « votre site » | |
| 5F | sur « Une question ? » | **Conversation** type messagerie : bulle client « Pouvez-vous changer mes horaires ? » (indicateur de saisie 3 points avant). | « Une question ? » | Son d'envoi. |
| 5G | sur « Réponse en vingt-quatre heures » | Bulle de réponse « C'est fait ✓ » (avatar J&L), puis badge **« < 24 h »** qui tamponne la conversation (scale 1,4 → 1 spring). | « Réponse » → « en **24 h** » | Son de réception + tampon doux. |

---

## SCÈNE 6 — APPEL À L'ACTION · ~31,3 → ~37,0 s

**VO** : « **Cliko**. Votre commerce mérite d'être **trouvé**. Devis gratuit sur **cliko point be**. »

| Plan | Timing | Visuel | Texte à l'écran | Son |
|---|---|---|---|---|
| 6A | sur « Cliko » | Tout converge en un point → **révélation du logo Cliko** (tracé/scale spring, éclat). | « **Cliko** » | **Clic signature** pleine version. |
| 6B | sur « Votre commerce mérite d'être trouvé » | Logo monte ; une épingle de carte se plante sous le logo avec une petite onde. | « Votre commerce » → « mérite d'être » → « **trouvé** » | Pop + accent musical. |
| 6C | sur « Devis gratuit sur cliko point be » → fin | **Plan final, lisible ≥ 2 s** : logo, **cliko.be** (gros), **@cliko_be**, puis pilule « **Devis gratuit · Bruxelles et toute la Belgique** ». Tout est dans la zone sûre. | « Devis gratuit » → « sur **cliko.be** » | Fin musicale sur le temps. |
| 6D | 0,4 dernières s | **Raccord de boucle** : en arrière-plan, le tapis roulant gris réapparaît et défile, dans le même cadrage que le frame 0, pour que la boucle Reels/TikTok soit invisible. | | Cliquetis mécanique qui reprend (identique au début). |

---

## Mixage
- Voix : priorité absolue, -16 LUFS court terme, léger compresseur + de-esser.
- Musique : ducking -12 dB sous la voix (sidechain par l'enveloppe des timestamps), remonte entre les phrases et sur la scène 6.
- Bruitages : -18 à -24 dB, jamais sur une consonne forte de la voix.
- Master : **-14 LUFS intégrés**, true peak ≤ -1 dBTP (passage `ffmpeg loudnorm` en 2 passes).

## Livrables
`out/cliko-reel.mp4` (accroche A) · `out/cliko-reel-accroche-B.mp4` · `out/cliko-reel-voix-seule.mp4` · `out/couverture.png` · `out/legende.txt`
