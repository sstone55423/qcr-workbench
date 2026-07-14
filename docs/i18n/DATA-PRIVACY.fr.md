# Confidentialité des données

> Traduction de l'original anglais (`DATA-PRIVACY.md`) ; la version anglaise fait foi.

QCR Workbench est conçu pour que **vos données de risque ne puissent pas quitter
votre appareil sans une action de votre part**. Ce document est l'inventaire
complet des emplacements où résident les données et de tous les chemins qu'elles
peuvent emprunter.

## Où résident les données

| Données | Emplacement | Protection |
|---|---|---|
| Projets, scénarios, estimations, traitements, journal d'audit | IndexedDB du navigateur | AES-GCM-256, clé dérivée de votre phrase secrète (PBKDF2-SHA-256, 250 000 itérations, sel aléatoire) |
| Paramètres de l'application, y compris les clés d'API IA | Même magasin chiffré (enregistrement `AppSettings`) | Même chiffrement ; jamais dans localStorage ni en clair |
| Registre des magasins (noms d'espaces de travail, indices facultatifs) | localStorage | Non secret par conception ; ne contient **aucune** phrase secrète et **aucune** donnée de risque |
| Thème, préférences d'interface indépendantes de la langue, minutes de verrouillage automatique | localStorage | Non secret ; nécessaire avant le déverrouillage du coffre |
| Adresse e-mail facultative de l'écran de verrouillage | localStorage | Écrite **uniquement** si vous activez « afficher sur l'écran de verrouillage » ; effacée à la désactivation |

La clé de chiffrement dérivée n'existe qu'en mémoire pendant que le coffre est
déverrouillé. Le verrouillage du coffre (manuel ou par verrouillage automatique)
la supprime. **Une phrase secrète oubliée est irrécupérable** — il n'y a ni
réinitialisation, ni e-mail de récupération, ni éditeur pouvant vous aider.
Exportez des sauvegardes.

## Tous les chemins réseau, de manière exhaustive

L'application n'effectue **aucune** requête de sa propre initiative. Tout ce qui
suit est déclenché par l'utilisateur :

1. **Appels IA dans le cloud** (facultatif) : lorsque vous cliquez sur une
   action IA, l'invite — noms de scénarios, descriptions, hypothèses et chiffres
   déjà calculés — va **directement de votre navigateur au fournisseur que vous
   avez configuré** (Anthropic, OpenAI, Google ou Alibaba), authentifiée avec
   votre propre clé. Il n'y a aucun proxy. Utilisez l'IA sur l'appareil (WebLLM
   ou l'IA intégrée de Chrome) ou un Ollama local pour garder même cela sur
   votre machine.
2. **Téléchargement du modèle sur l'appareil** (facultatif, une seule fois) :
   l'activation de WebLLM télécharge les poids quantifiés du modèle depuis son
   CDN public ; le navigateur les met en cache.
3. **Google Fonts** : les deux polices de l'interface sont chargées depuis le
   CDN de Google.
4. **Rien d'autre.** Pas de télémétrie, pas d'analytique, pas de rapport
   d'erreurs, pas de vérification de mises à jour, pas d'API propriétaire.

## Sauvegardes et exports

- **Sauvegarde chiffrée** (recommandée) : un fichier JSON chiffré avec une
  phrase secrète de votre choix (même schéma PBKDF2 + AES-GCM). Peut être
  stocké n'importe où en toute sécurité.
- **Sauvegarde non chiffrée** (sur choix explicite, avec avertissement) : JSON
  en clair de tout le contenu, y compris les clés d'API enregistrées. Proposée
  uniquement comme garde-fou de dernier recours contre une phrase secrète
  oubliée. Traitez-la comme un fichier de mots de passe.
- **Rapport (.md), journal d'audit (.txt/.doc)** : en clair par nature — c'est
  précisément l'objet de l'export. Partagez-les de manière délibérée.

## Vos responsabilités

- Choisissez une phrase secrète robuste ; elle constitue l'intégralité de la
  frontière de sécurité.
- Si vos scénarios contiennent des informations réglementées ou classifiées,
  privilégiez l'IA sur l'appareil ou l'absence d'IA, et gérez les exports en
  conséquence.
- Sur les machines partagées, utilisez le verrouillage automatique
  (Paramètres → Sécurité) et verrouillez le coffre lorsque vous vous absentez.

Pour les détails d'ingénierie de sécurité (CSP, paramètres cryptographiques,
cadrage réglementaire), voir `SECURITY.md`.
