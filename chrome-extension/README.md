# N’Assist ServiceBag — Extension Chrome

## Installation locale

1. Télécharger ou cloner le dépôt puis ouvrir le dossier `chrome-extension`.
2. Dans Chrome, ouvrir `chrome://extensions`.
3. Activer **Mode développeur**.
4. Cliquer sur **Charger l’extension non empaquetée**.
5. Sélectionner le dossier `chrome-extension`.
6. Ouvrir ServiceBag dans Salesforce et autoriser la caméra au premier lancement.

## Fonctions de la V1

- panneau flottant aimanté à droite et déplaçable ;
- réduction en mode compact ;
- caméra compacte, déplaçable et escamotable ;
- touche **F8** pour ouvrir la caméra ;
- touche **Entrée** pour transmettre le numéro au champ ServiceBag ;
- son de confirmation quand un numéro à huit chiffres est détecté ;
- historique repliable et export CSV ;
- analyse locale des mentions de dépassement, paiement et anomalie ;
- aucune validation automatique et aucun paiement automatique.

## OCR

La lecture automatique utilise l’API native `TextDetector` lorsqu’elle est disponible dans la version de Chrome installée. Si cette API n’est pas disponible, l’extension affiche un message et conserve la saisie manuelle. Une prochaine évolution pourra embarquer un moteur OCR local complet dans l’extension.

## Sécurité métier

L’extension remplit uniquement le champ de recherche ServiceBag. Elle ne clique jamais sur un bouton de validation, de clôture ou de paiement. Toute décision reste sous le contrôle de l’agent.
