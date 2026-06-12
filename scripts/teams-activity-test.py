#!/usr/bin/env python3
"""
Test isolé des notifications d'activité Teams (sendActivityNotification).

Reproduit fidèlement la logique de src/lib/teams/activity.ts :
  - résolution d'identité par $filter mail/UPN (+ ConsistencyLevel: eventual)
  - topic.source=text + deep link Teams stage-view (PAS d'URL externe brute)
  - activityType=systemDefault (texte libre, sans déclaration au manifeste)

Par défaut : DRY-RUN (résolution seule, aucune livraison).
Pour livrer réellement : ajouter --send

Usage :
  python3 scripts/teams-activity-test.py                      # dry-run sur Lorena
  python3 scripts/teams-activity-test.py --send               # envoi réel à Lorena
  python3 scripts/teams-activity-test.py --email x@y.lu --send
  python3 scripts/teams-activity-test.py --survey-link https://employeesurvey.netlify.app/s/abc --send

Prérequis (sinon échecs attendus) :
  - TeamsActivity.Send consentie sur l'app  (sinon 403)
  - manifeste v1.0.1 avec webApplicationInfo déployé + propagé  (sinon 403)
"""
import argparse, base64, json, os, sys, urllib.parse, urllib.request

ENV_PATH = os.path.join(os.path.dirname(__file__), "..", ".env.local")
GRAPH = "https://graph.microsoft.com/v1.0"
TEAMS_APP_ID = "478e9d1c-39e1-4a6b-8b9a-0003135f2b47"

DEFAULT_EMAIL = "Lorena.DEIACO@SLG.lu"
DEFAULT_SURVEY_LINK = "https://employeesurvey.netlify.app"


def load_env():
    if not os.path.exists(ENV_PATH):
        sys.exit(f"Introuvable: {ENV_PATH}")
    for line in open(ENV_PATH):
        s = line.strip()
        if s and not s.startswith("#") and "=" in s:
            k, v = s.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    for k in ("AZURE_TENANT_ID", "AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET"):
        if not os.environ.get(k):
            sys.exit(f"Variable manquante dans .env.local : {k}")


def graph_token():
    t = os.environ["AZURE_TENANT_ID"]
    body = urllib.parse.urlencode({
        "client_id": os.environ["AZURE_CLIENT_ID"],
        "client_secret": os.environ["AZURE_CLIENT_SECRET"],
        "scope": "https://graph.microsoft.com/.default",
        "grant_type": "client_credentials",
    }).encode()
    req = urllib.request.Request(
        f"https://login.microsoftonline.com/{t}/oauth2/v2.0/token",
        data=body, headers={"Content-Type": "application/x-www-form-urlencoded"})
    return json.load(urllib.request.urlopen(req))["access_token"]


def token_has_role(tok, role):
    payload = tok.split(".")[1]
    payload += "=" * (-len(payload) % 4)
    roles = json.loads(base64.urlsafe_b64decode(payload)).get("roles", [])
    return role in roles


def resolve_aad_id(tok, email):
    safe = email.replace("'", "''")
    flt = urllib.parse.quote(f"mail eq '{safe}' or userPrincipalName eq '{safe}'")
    req = urllib.request.Request(
        f"{GRAPH}/users?$filter={flt}&$select=id,displayName,userPrincipalName,mail&$top=1",
        headers={"Authorization": f"Bearer {tok}", "ConsistencyLevel": "eventual"})
    data = json.load(urllib.request.urlopen(req))
    return (data.get("value") or [None])[0]


def build_survey_deeplink(survey_link):
    ctx = urllib.parse.quote(json.dumps({
        "contentUrl": survey_link, "websiteUrl": survey_link, "name": "Sondage"}))
    return f"https://teams.microsoft.com/l/stage/{TEAMS_APP_ID}/0?context={ctx}"


def send_notification(tok, aad_id, preview, survey_link):
    body = {
        "topic": {"source": "text", "value": "PulseSurvey",
                  "webUrl": build_survey_deeplink(survey_link)},
        "activityType": "systemDefault",
        "previewText": {"content": preview},
        "templateParameters": [{"name": "systemDefaultText", "value": preview}],
    }
    req = urllib.request.Request(
        f"{GRAPH}/users/{aad_id}/teamwork/sendActivityNotification",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"},
        method="POST")
    try:
        r = urllib.request.urlopen(req)
        return r.status, None
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:400]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--email", default=DEFAULT_EMAIL)
    ap.add_argument("--survey-link", default=DEFAULT_SURVEY_LINK)
    ap.add_argument("--send", action="store_true", help="livraison réelle (sinon dry-run)")
    args = ap.parse_args()

    load_env()
    tok = graph_token()

    print(f"Permission TeamsActivity.Send : {'OK' if token_has_role(tok, 'TeamsActivity.Send') else 'ABSENTE (403 attendu)'}")

    user = resolve_aad_id(tok, args.email)
    if not user:
        sys.exit(f"Utilisateur introuvable : {args.email}")
    print(f"Résolu -> {user.get('displayName')}  aadId={user['id']}  upn={user.get('userPrincipalName')}  mail={user.get('mail')}")

    preview = f"{user.get('displayName','')} — TEST technique PulseSurvey, vous pouvez ignorer cette notification."

    if not args.send:
        print("\nDRY-RUN : aucune notification envoyée. Ajoute --send pour livrer.")
        print(f"  deep link qui serait utilisé : {build_survey_deeplink(args.survey_link)[:90]}...")
        return

    print("\nEnvoi réel...")
    status, err = send_notification(tok, user["id"], preview, args.survey_link)
    if status in (200, 201, 202, 204):
        print(f">>> SUCCÈS (HTTP {status}) : notification envoyée. Vérifie la cloche Teams du destinataire.")
    else:
        print(f">>> ÉCHEC (HTTP {status}) : {err}")


if __name__ == "__main__":
    main()
