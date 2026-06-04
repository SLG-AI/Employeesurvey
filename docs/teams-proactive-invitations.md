# Invitations Teams sans « hello » préalable (provisioning proactif)

## Le problème

L'envoi de notifications Teams passe par un **bot** (Bot Framework). Un message
proactif exige une **référence de conversation** entre le bot et l'employé.
Cette référence n'existe que si l'app a été **installée** dans le scope
personnel de l'employé. Historiquement, elle n'était capturée que lorsque
l'employé ouvrait un chat avec le bot (« hello »), d'où des invitations qui
n'aboutissaient pas, sans erreur visible.

## La solution

Au moment de l'envoi, pour tout destinataire sans référence de conversation
stockée, le serveur :

1. résout l'id AAD de l'employé depuis son email (Graph) ;
2. **installe silencieusement** l'app PulseSurvey dans son scope personnel
   (idempotent — un 409 « déjà installé » est traité comme un succès) ;
3. récupère le **chat 1:1** de l'app installée pour obtenir l'id de conversation ;
4. envoie le message proactif via le Bot Connector et **mémorise** la référence
   pour les envois suivants.

Aucune action n'est requise de la part de l'employé.

Code : `src/lib/teams/graph-provision.ts` (provisioning) branché en repli dans
`sendBotMessages` (`src/lib/teams/bot.ts`).

## Prérequis Azure (à réaliser par un administrateur)

Ces étapes ne sont **pas** automatisables par le code.

### 1. Permissions Graph (application) avec consentement admin

Sur l'app Azure AD derrière `AZURE_CLIENT_ID` :

| Permission | Usage |
|---|---|
| `TeamsAppInstallation.ReadWriteForUser.All` | Installer l'app et lire le chat |
| `User.Read.All` | Résoudre l'utilisateur depuis son email |

→ « Grant admin consent » obligatoire.

### 2. Publier l'app au catalogue Teams de l'organisation

L'app PulseSurvey doit être présente dans le catalogue Teams de l'org pour
disposer d'un **catalog app id** (le `id` de la ressource
`appCatalogs/teamsApps`).

## Variables d'environnement

| Variable | Requis | Description |
|---|---|---|
| `AZURE_TENANT_ID` | oui | Tenant de l'organisation |
| `AZURE_CLIENT_ID` | oui | App Azure AD (mêmes credentials que le flux Graph existant) |
| `AZURE_CLIENT_SECRET` | oui | Secret de l'app |
| `TEAMS_CATALOG_APP_ID` | oui | Id de l'app PulseSurvey dans le catalogue Teams de l'org |
| `TEAMS_BOT_APP_ID` / `TEAMS_BOT_APP_SECRET` | oui | Bot Framework (envoi proactif) |
| `TEAMS_BOT_SERVICE_URL` | non | Service URL du Bot Connector. Défaut : `https://smba.trafficmanager.net/teams/` (cloud public). À adapter pour GCC/DoD/autres clouds. |

## Vérification

`GET /api/teams/debug` (admin/RH) renvoie l'état de configuration, dont
`graphProvisioningConfigured` et la présence de `TEAMS_CATALOG_APP_ID`.

## Notes

- Le provisioning ne s'active que si `TEAMS_CATALOG_APP_ID` **et** les
  credentials Azure sont présents ; sinon le comportement historique
  (référence issue du webhook d'installation) reste en place.
- Si la résolution de l'utilisateur échoue (email introuvable dans l'annuaire),
  le destinataire reste compté comme « non installé » et apparaît dans
  l'avertissement de l'interface d'envoi.
