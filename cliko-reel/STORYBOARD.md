# Cliko — Reel de présentation · Storyboard v1

**Format** : 1080×1920 · 30 fps · ≈ 29 s · H.264, son masterisé à −14 LUFS
**Promesse** : votre commerce mérite mieux qu'un site fait à la chaîne ; chez Cliko, deux humains vous écoutent.
**Fil rouge** : *le point ambre* du logo « Cliko. ». On le voit dès le frame 0, sur la seule page vivante d'une chaîne de montage grise. C'est lui qui « clique » et sauve la page, qui rassemble la présence éparpillée, qui devient la barre d'adresse, puis le point final du logo.

> Les timings sont ceux de l'estimation actuelle (≈ 3,4 mots/s), sans voix off. Tous les ancrages sont écrits « sur le mot X » dans le code (`useScene(id).at("mot")`) : les timestamps ElevenLabs les recaleront automatiquement.

---

## Charte (extraite de cliko.be)

| Élément | Valeur |
|---|---|
| Fond | Nuit `#0b1020`, lueurs pétrole / marine / indigo / royal du site, champ d'étoiles en parallaxe |
| Accent | Ambre `#ffc46b` (dégradé `#ffd48f` → `#f0a948`), réservé à ~6 mots : *mieux, vôtre, écoute, 24 h, trouvé, cliko.be* (+ *nous* en accroche B) |
| Texte | `#f2f3fa`, secondaire `#b9c0e3` |
| Polices | Schibsted Grotesk (titres, sous-titres, logo) · Geist Mono (étiquettes, « machine ») — embarquées dans `public/fonts` |
| Logo | « Cliko » Schibsted 700, −0,03 em, point final ambre (jamais extrudé ni en minuscules) |
| Matières | Verre dépoli du site (`glass`, `glass-line`), icônes au trait fin comme les illustrations du site |
| Mouvement | Ressorts (spring), courbes d'easing du site, flou de mouvement sur les déplacements rapides, grain 6 % |

**Sous-titres** : rail aligné à gauche (x 80 → 920, au-dessus de y 1425), 1 à 3 mots, Schibsted 800 100 px. Chaque mot sort d'un masque à son instant, et les cartons sortent vers le haut, jamais en fondu. Les « mots héros » (*éparpillé, Cliko, sur-mesure, on vous écoute, Jules & Louis, Cliko., trouvé., Devis gratuit, cliko.be*) sont mis en scène en grand par la scène, et le rail les saute.
**Zones sûres** : rien d'important dans les 250 px du haut, les 450 px du bas et les 150 px de droite ; c'est vérifié image par image avec le calque `showSafeZones`.

---

## 1 · ACCROCHE — « Votre commerce mérite mieux qu'un site fait à la chaîne. » (0,0 → 2,9 s)

| Temps | Visuel | Son |
|---|---|---|
| f0 (miniature) | Plan serré, plongée sur une chaîne de montage nocturne (CSS 3D). Des pages-modèles grises identiques portent le tampon « MODÈLE N° 034x ». Une seule page porte le **point ambre**, posée dans une flaque de lumière chaude. Néon froid « FAIT À LA CHAÎNE ». Sous-titre « Votre commerce » déjà affiché. | *CLANK* de la presse sur le frame 0 |
| f0 → f70 | Plan de poursuite sur la page au point, qui avance d'un cran par temps (122 BPM). Travelling avant : la **presse** entre dans le champ et tamponne chaque page sur le temps. Poussières dans les faisceaux. | Tampon sur chaque temps, convoyeur, montée |
| « chaîne » | La presse descend sur la page au point… **clic** : elle se fige à quelques centimètres, le néon s'éteint. La couleur jaillit du point, la page devient la vraie page d'accueil de cliko.be (vidéo, galaxie), se redresse et fonce vers la caméra. | Clic signature, *whoosh* profond |
| fin | La page remplit le cadre, flash ambré. | Drop de la musique |

**Variante B** : néon « PRENEZ UN NUMÉRO » avec compteur « N° 00344 → 00349 », tampons « N° 0034x ». Le sauvetage tombe sur « Pas nous ».

## 2 · PROBLÈME — « Facebook, Google, vos photos… tout est éparpillé. » (2,9 → 5,9 s)

| Temps | Visuel | Son |
|---|---|---|
| ouverture | Le flash se dissipe sur la nuit étoilée. Un téléphone 3D épais monte au centre ; ses notifications s'empilent. | Impact |
| « Facebook », « Google », « photos », (pause) | Des tuiles en verre jaillissent du téléphone sur leur mot : pouce levé, épingle, appareil photo (avec 3 tirages), combiné (« Téléphone »). Ce sont des icônes génériques au trait, sans logo. Chacune porte un nœud d'étoile et une étiquette, reliée au téléphone par un trait fin : la constellation « éparpillée » du site. | *Whip* + pop par tuile |
| « tout est » | Les tuiles s'écartent et tremblent, les traits se cassent en pointillés. | |
| « éparpillé » | Mot héros géant blanc, lisible ~0,4 s, puis il vole en éclats lettre par lettre. | Grésillement, *whoosh* |

## 3 · SOLUTION — « Cliko rassemble tout à une seule adresse : la vôtre. » (5,9 → 8,9 s)

| Temps | Visuel | Son |
|---|---|---|
| « Cliko » | **Temps suspendu** : la musique se coupe ~9 frames. Le téléphone se résorbe en un point ambre ; « Cliko » s'écrit autour de lui, le point en est le point final. | Silence, *pling* |
| « rassemble tout » | Des traits ambrés partent du point vers chaque tuile (l'animation du site), puis aspirent les tuiles qui s'y fondent. | Aspiration, clics magnétiques |
| « à une seule adresse » | Le point s'étire en barre d'adresse en verre qui tape « votrecommerce.be ». Dessous, les 4 éléments se rangent en puces : Facebook, Google, Photos, Téléphone. Une orbite tourne autour, comme sur le site. | Frappes clavier |
| « la vôtre » | Entrée : le cadenas devient ✓ ambre, les puces se cochent, onde de choc. La barre s'envole vers le haut. | Clic signature |

## 4 · CE QU'ON FAIT — « Un site sur-mesure, parfait sur téléphone. Hébergé, mis à jour, en trois langues. »

| Temps | Visuel | Son |
|---|---|---|
| « Un site » | Un téléphone 3D pivotant monte, avec à l'écran la vraie page d'accueil de cliko.be (vidéo). | *Whoosh* profond |
| « sur-mesure » | Mot héros « sur- / mesure » en ambre, avec un mètre ruban qui se trace. Le téléphone passe à droite ; l'écran glisse sur la démo **Atelier Verso**. Étiquette « Exemple de style · Atelier Verso ». | *Whoosh* |
| « parfait » | Le téléphone se met face caméra (punch-in) et passe à **Forno Nero**. | Tuile |
| « téléphone » | Écran **Maison Célest**. | Tuile |
| « Hébergé » | Plan « maquette produit » : un ordinateur vu de face (écran épais, fine base en aluminium) monte au centre, la tablette entre devant à gauche, le téléphone passe devant à droite. Le même site s'affiche sur les trois écrans (démo Maison Célest, vraies captures) : il s'adapte à toutes les tailles. Puce « ☁ Hébergé ✓ ». | *Whoosh*, pop |
| « mis à jour » | Puce « ↻ Mis à jour ✓ » (flèches qui tournent), reflet de rafraîchissement sur les 3 écrans. Badge non lu « En ligne en 1 à 3 semaines ». | Pops |
| « en trois langues » | Tuiles **FR · NL · EN** en verre qui pivotent depuis la tranche, une par mot, devant l'écran de l'ordinateur. Les puces et les tuiles restent à l'écran jusqu'à la sortie. | 3 *flaps* |
| sortie | Les appareils glissent et se fondent en flou : respiration. | |

Démos : ce sont des **exemples de styles**, toujours étiquetés comme tels. Dans les captures, tout texte qui contient un chiffre est flouté (prix, dates, statistiques fictives des démos).

## 5 · L'HUMAIN — « Et surtout, on vous écoute. Pas de ticket, pas de robot : vous parlez directement à Jules et Louis. Réponse en vingt-quatre heures. » (15,4 → 22,7 s)

| Temps | Visuel | Son |
|---|---|---|
| « Et surtout » | Respiration musicale (passe-bas). La nuit se réchauffe : lumière ambrée qui monte du bas, bokeh chaud. Une tasse de café fume et des notes s'écrivent dans un carnet, au trait (« On se parle… autour d'un café à Bruxelles », comme sur le site). | Nappe chaude |
| « on vous écoute » | Mot héros : « on vous » puis **« écoute. »** en ambre, lettre par lettre. | Marqueur |
| « Pas de ticket » | Ticket « SERVICE CLIENT · FILE D'ATTENTE #48213 — Statut : en attente… » ; un trait de marqueur ambre le barre, puis il tombe. | Marqueur |
| « pas de robot » | Un robot au trait grésille (décalage RVB), puis s'éteint comme un tube cathodique ; il n'en reste qu'un point lumineux ambre. | Grésillement, extinction |
| « vous parlez directement à » | Le point s'ouvre sur deux pastilles **J** et **L** ; une ligne directe se trace vers elles. | Pops |
| « Jules et Louis » | Mot héros « Jules / & Louis », étiquette « Fondateurs de Cliko · Bruxelles » (texte du site). | |
| « Réponse en 24 h » | Conversation : « Pouvez-vous changer mes horaires ? », trois points de saisie, puis « C'est fait ✓ » en ambre. Le tampon **« < 24 h »** frappe : c'est le geste de la presse de l'usine, en version humaine. | Envoi, réception, tampon |

**Photo de Jules et Louis** : emplacement prêt. Si `public/brand/jules-louis.jpg` (ou `.png` / `.webp`) existe, la photo remplace automatiquement les initiales. Aucun visage n'est inventé.

## 6 · APPEL À L'ACTION — « Cliko. Votre commerce mérite d'être trouvé. Devis gratuit sur cliko point be. » (22,7 → 29,3 s)

| Temps | Visuel | Son |
|---|---|---|
| « Cliko » | Retour à la nuit. Le point ambre tombe, rebondit et se pose en **point final du logo « Cliko. »**, avec une onde de choc. | Clic signature, impact |
| « Votre commerce mérite d'être » | Une **galaxie de particules** (three.js), écho du hero de cliko.be « Votre commerce mérite d'être trouvé. », s'épanouit ; le logo monte. | Montée |
| « trouvé » | Mot héros **« trouvé. »** en ambre ; une épingle se plante dans les étoiles avec des ondes. | Pop |
| « Devis gratuit sur cliko.be » | **Plan final lisible ≥ 2 s** : logo, **cliko.be** (« .be » ambre, reflet), **@cliko_be**, pilule ambre « Devis gratuit · Bruxelles et toute la Belgique » (le bouton du site). | Clic, clic signature |
| 0,4 dernière s | Saut en hyperespace : les étoiles filent, et on retombe exactement sur le frame 0 (usine, « Votre commerce ») pour une **boucle** invisible. | *Whoosh* profond, le *CLANK* du frame 0 relance la boucle |

---

## Son (temporaire, en attendant ElevenLabs)
- **Musique** : house minimaliste à 122 BPM, synthétisée (`scripts/synth_audio.py`), calée sur la timeline. Elle comprend une intro mécanique filtrée, un drop sur la scène 2, une coupure sur « Cliko », une respiration sur la scène 5 et un impact final.
- **Bruitages** : 19 sons synthétisés (tampon, convoyeur, clic signature, *whooshes*, pops, frappes, tuiles, marqueur, grésillement, messages…), placés au mot près dans chaque scène.
- **Master** : −14 LUFS intégrés, crête ≤ −1 dBTP (`scripts/master.sh`).
- **Voix off** : à générer avec ElevenLabs (`npm run casting:list`, `casting:gen`, puis `npm run voice`). Les timestamps mot à mot recaleront automatiquement sous-titres, coupes et bruitages.
