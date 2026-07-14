# Gouvernance de l'IA

> Traduction de l'original anglais (`AI-GOVERNANCE.md`) ; la version anglaise fait foi.

QCR Workbench peut, en option, utiliser des modèles d'IA. Selon le cadre du
NIST AI RMF, de l'ISO/IEC 42001 et de l'EU AI Act, cette application est un
**déployeur** de modèles tiers à usage général, et non un fournisseur : elle
n'embarque aucun modèle, n'entraîne rien, et c'est l'utilisateur qui choisit et
authentifie chaque modèle utilisé.

## Principes (appliqués dans le code, pas seulement par la politique)

1. **L'IA ne fait jamais les calculs.** Chaque résultat quantitatif —
   décomposition FAIR, perte attendue, statistiques Monte Carlo, économie des
   traitements — est calculé de manière déterministe dans `src/lib/qcr/`. Les
   invites IA *intègrent* les chiffres déjà calculés
   (`src/lib/qcr/aiFeatures.js`) et ordonnent au modèle de ne pas inventer ni
   recalculer de nombres. Une panne de l'IA ne change rien à l'analyse.
2. **Un humain dans la boucle pour tout ce qui entre dans le modèle.** Les
   hypothèses de cadrage suggérées par l'IA sont mises en attente dans
   l'interface et n'entrent dans le scénario que lorsque l'utilisateur accepte
   chacune d'elles individuellement. La synthèse IA est un brouillon étiqueté
   joint au rapport ; elle ne modifie jamais les estimations, les résultats ni
   le cadrage du scénario.
3. **Transparence et provenance** (schéma de l'art. 50 de l'EU AI Act). Chaque
   sortie de l'IA est affichée avec un bandeau explicite de divulgation IA ; le
   fournisseur, le modèle et l'horodatage sont apposés sur la synthèse
   enregistrée, affichés dans l'interface, écrits dans le journal d'audit et
   inclus dans le bloc de divulgation du rapport téléchargé.
4. **Détection de l'obsolescence.** La synthèse enregistre un hachage des
   données d'entrée à partir desquelles elle a été rédigée ; si le modèle ou
   les hypothèses changent ensuite, l'interface signale la synthèse comme
   obsolète jusqu'à ce qu'elle soit rédigée à nouveau (et les modifications des
   estimations FAIR l'effacent purement et simplement).
5. **Confidentialité par l'architecture.** Les appels IA vont directement du
   navigateur au fournisseur choisi par l'utilisateur, avec la clé de
   l'utilisateur — pas de proxy, pas d'intermédiaire, pas de couche de
   journalisation. Les options entièrement locales (WebLLM via WebGPU, l'IA
   intégrée de Chrome, un Ollama local) sont des options de premier rang et
   conservent tout le contenu sur l'appareil. Voir `DATA-PRIVACY.md`.
6. **Auditabilité.** Chaque génération IA écrit un `AuditEvent` (catégorie
   `ai`) nommant le fournisseur, de sorte qu'un réviseur puisse reconstituer ce
   qui a été assisté par l'IA.

## À quoi sert l'IA

| Fonctionnalité | Données envoyées | Traitement de la sortie |
|---|---|---|
| Brouillon de synthèse exécutive | Texte de cadrage du scénario + chiffres calculés | Enregistré avec provenance + hachage des entrées ; affiché avec divulgation ; ajouté à l'export du rapport sous un titre de divulgation explicite |
| Suggestions d'hypothèses | Texte de cadrage du scénario + hypothèses existantes | Mises en attente ; chaque suggestion requiert une acceptation explicite de l'utilisateur |
| Suggestions de traitements | Texte de cadrage du scénario + chiffres de référence calculés + noms des traitements existants | Mises en attente ; accepter une suggestion l'ouvre pré-remplie dans le formulaire de traitement pour que l'analyste la révise, l'ajuste et l'enregistre explicitement (consigné dans le journal d'audit) ; l'économie des traitements est toujours recalculée de manière déterministe à partir de ce qui est enregistré |

## Ce pour quoi l'IA n'est **pas** utilisée

- Estimer ou modifier les cinq facteurs FAIR
- Tout calcul, simulation ou comparaison
- Tout ce qui est automatique ou planifié — chaque appel IA est un clic de
  l'utilisateur

## Risques résiduels acceptés par l'utilisateur

- **Erreur du modèle** : les synthèses peuvent mal caractériser les résultats
  calculés ; le bandeau de divulgation le précise, et les chiffres des tableaux
  du rapport restent la référence.
- **Exposition au fournisseur** : l'utilisation d'un fournisseur cloud envoie
  le texte du scénario à ce fournisseur dans le cadre de l'accord propre de
  l'utilisateur avec celui-ci. Les contenus réglementés devraient utiliser les
  options sur l'appareil.
