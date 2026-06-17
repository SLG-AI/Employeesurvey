"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Send,
  Loader2,
  Users,
  Mail,
  MessageSquare,
  AlertTriangle,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { pollTeamsJob } from "@/lib/teams/poll-client";
import { ManualRecipientPicker } from "./manual-recipient-picker";

type Mode = "non_responders" | "never_invited" | "manual" | "all";

type Channel = "email" | "teams";

type Recipient = {
  token_id: string;
  employee_name: string | null;
  email: string | null;
  has_teams: boolean;
  invitation_sent_at: string | null;
  reminder_sent_at: string | null;
  teams_invitation_sent_at: string | null;
  teams_reminder_sent_at: string | null;
  responded: boolean;
};

type Preview = {
  counts: { total: number; email: number; teams: number; neither: number };
  recipients: Recipient[];
  truncated: boolean;
};

type Props = {
  surveyId: string;
  surveyPublished: boolean;
  teamsConfigured: boolean;
  onSent: () => void | Promise<void>;
};

const MODE_LABELS: Record<Mode, { title: string; help: string }> = {
  non_responders: {
    title: "Non-répondants",
    help: "Les employés qui ont reçu l'invitation mais n'ont pas encore répondu.",
  },
  never_invited: {
    title: "Jamais invités",
    help: "Nouveaux employés ajoutés après le lancement du sondage (aucune invitation envoyée).",
  },
  manual: {
    title: "Sélection manuelle",
    help: "Choisir exactement les destinataires dans une liste.",
  },
  all: {
    title: "Tous — renvoi complet",
    help: "Y compris ceux qui ont déjà répondu. À confirmer avant envoi.",
  },
};

export function TargetedSendPanel({
  surveyId,
  surveyPublished,
  teamsConfigured,
  onSent,
}: Props) {
  const [mode, setMode] = useState<Mode>("non_responders");
  const [channels, setChannels] = useState<Channel[]>(["email"]);
  const [manualTokenIds, setManualTokenIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchPreview = useCallback(
    async (signal?: AbortSignal) => {
      if (mode === "manual" && manualTokenIds.length === 0) {
        setPreview({
          counts: { total: 0, email: 0, teams: 0, neither: 0 },
          recipients: [],
          truncated: false,
        });
        return;
      }

      setLoadingPreview(true);
      try {
        const res = await fetch(
          `/api/surveys/${surveyId}/preview-recipients`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              mode,
              tokenIds: mode === "manual" ? manualTokenIds : undefined,
              channels,
            }),
            signal,
          }
        );
        if (!res.ok) {
          setPreview(null);
          return;
        }
        const data: Preview = await res.json();
        setPreview(data);
      } catch (err) {
        if ((err as { name?: string } | null)?.name !== "AbortError") {
          setPreview(null);
        }
      } finally {
        setLoadingPreview(false);
      }
    },
    [mode, manualTokenIds, channels, surveyId]
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchPreview(controller.signal);
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [fetchPreview]);

  const toggleChannel = (c: Channel) => {
    setChannels((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const effectiveEmailCount = channels.includes("email")
    ? (preview?.counts.email ?? 0)
    : 0;
  const effectiveTeamsCount = channels.includes("teams")
    ? (preview?.counts.teams ?? 0)
    : 0;
  const effectiveTotal = Math.max(effectiveEmailCount, effectiveTeamsCount);

  const sendDisabled =
    !surveyPublished ||
    sending ||
    channels.length === 0 ||
    (preview?.counts.total ?? 0) === 0 ||
    (channels.includes("email") && !effectiveEmailCount && !channels.includes("teams")) ||
    (mode === "manual" && manualTokenIds.length === 0);

  const channelInvalid = channels.includes("teams") && !teamsConfigured;

  const doSend = useCallback(async () => {
    setSending(true);
    try {
      const tasks: Promise<Response>[] = [];
      const endpointByChannel: Record<
        Channel,
        (m: Mode) => { url: string; body: Record<string, unknown> }
      > = {
        email: (m) => ({
          url:
            m === "never_invited"
              ? `/api/surveys/${surveyId}/send-invitations`
              : `/api/surveys/${surveyId}/send-reminders`,
          body: {
            mode: m,
            tokenIds: m === "manual" ? manualTokenIds : undefined,
          },
        }),
        teams: (m) => ({
          url:
            m === "never_invited"
              ? `/api/surveys/${surveyId}/send-teams-invitations`
              : `/api/surveys/${surveyId}/send-teams-reminders`,
          body: {
            mode: m,
            tokenIds: m === "manual" ? manualTokenIds : undefined,
          },
        }),
      };

      for (const ch of channels) {
        const { url, body } = endpointByChannel[ch](mode);
        tasks.push(
          fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          })
        );
      }

      const results = await Promise.allSettled(tasks);
      let sent = 0;
      let failed = 0;
      let notInstalled = 0;
      const errors: string[] = [];

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const ch = channels[i];
        if (r.status === "rejected") {
          errors.push(`Canal ${ch} : erreur réseau`);
          continue;
        }
        if (!r.value.ok) {
          const data = await r.value.json().catch(() => ({}));
          errors.push(`Canal ${ch} : ${data.error ?? r.value.status}`);
          continue;
        }
        const data = await r.value.json();
        // Teams sends run as a background job; poll it to completion.
        if (ch === "teams" && data.jobId) {
          const final = await pollTeamsJob(surveyId, data.jobId);
          sent += final.sent;
          failed += final.failed;
          notInstalled += final.notInstalled;
          if (final.status === "error") {
            errors.push(`Canal teams : ${final.errorMessage ?? "erreur"}`);
          } else if (final.status === "timeout") {
            errors.push("Canal teams : envoi toujours en cours en arrière-plan");
          }
        } else {
          sent += data.sent ?? 0;
          failed += data.failed ?? 0;
          notInstalled += data.notInstalled ?? 0;
        }
      }

      if (sent > 0) {
        toast.success(`${sent} envoi(s) réussi(s)`, {
          description:
            `Mode : ${MODE_LABELS[mode].title} · Canaux : ${channels.join(", ")}` +
            (notInstalled > 0 ? ` · Teams non installé : ${notInstalled}` : ""),
        });
      }
      if (failed > 0) toast.error(`${failed} échec(s)`);
      if (errors.length) toast.error(errors.join(" | "));
      if (sent === 0 && failed === 0 && errors.length === 0) {
        toast.info("Aucun envoi effectué");
      }

      await onSent();
      await fetchPreview();
    } finally {
      setSending(false);
    }
  }, [channels, mode, manualTokenIds, surveyId, onSent, fetchPreview]);

  const handleSendClick = () => {
    if (mode === "all") {
      setConfirmOpen(true);
    } else {
      doSend();
    }
  };

  const displayedRecipients = useMemo(
    () => preview?.recipients.slice(0, 20) ?? [],
    [preview]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Envois ciblés
        </CardTitle>
        <CardDescription>
          Relancer les non-répondants, envoyer l&apos;invitation à de nouveaux
          employés, ou cibler une sélection précise.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">1. Qui recevra l&apos;envoi ?</Label>
          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as Mode)}
            className="grid gap-2 sm:grid-cols-2"
          >
            {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
              <label
                key={m}
                htmlFor={`mode-${m}`}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition ${
                  mode === m ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <RadioGroupItem id={`mode-${m}`} value={m} className="mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium">{MODE_LABELS[m].title}</div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {MODE_LABELS[m].help}
                  </p>
                </div>
              </label>
            ))}
          </RadioGroup>

          {mode === "manual" && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {manualTokenIds.length === 0
                  ? "Aucun destinataire sélectionné"
                  : `${manualTokenIds.length} destinataire(s) sélectionné(s)`}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => setPickerOpen(true)}
              >
                {manualTokenIds.length === 0 ? "Choisir…" : "Modifier la liste"}
              </Button>
            </div>
          )}
        </div>

        {/* Channel selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">2. Par quel canal ?</Label>
          <div className="flex flex-wrap gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <Checkbox
                checked={channels.includes("email")}
                onCheckedChange={() => toggleChannel("email")}
              />
              <Mail className="h-4 w-4" />
              Email
            </label>
            <label
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                teamsConfigured ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              }`}
            >
              <Checkbox
                checked={channels.includes("teams")}
                onCheckedChange={() => teamsConfigured && toggleChannel("teams")}
                disabled={!teamsConfigured}
              />
              <MessageSquare className="h-4 w-4" />
              Teams
              {!teamsConfigured && (
                <span className="text-xs text-muted-foreground">(non configuré)</span>
              )}
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">3. Aperçu</Label>
            {loadingPreview && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {!preview ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : preview.counts.total === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun destinataire pour ce ciblage.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              <p>
                <strong>{preview.counts.total}</strong> destinataire(s) au total
                pour ce mode.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant={channels.includes("email") ? "default" : "secondary"}>
                  <Mail className="mr-1 h-3 w-3" />
                  {effectiveEmailCount} via Email
                </Badge>
                <Badge variant={channels.includes("teams") ? "default" : "secondary"}>
                  <MessageSquare className="mr-1 h-3 w-3" />
                  {effectiveTeamsCount} via Teams
                </Badge>
                {preview.counts.neither > 0 && (
                  <Badge variant="outline" className="text-amber-700">
                    {preview.counts.neither} sans canal disponible
                  </Badge>
                )}
              </div>
              {displayedRecipients.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    Voir les {displayedRecipients.length} premiers destinataires
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs">
                    {displayedRecipients.map((r) => (
                      <li
                        key={r.token_id}
                        className="flex items-center gap-2 rounded border bg-background px-2 py-1"
                      >
                        <span className="font-medium">
                          {r.employee_name || "(sans nom)"}
                        </span>
                        <span className="text-muted-foreground">{r.email}</span>
                        {r.has_teams && (
                          <Badge variant="outline" className="text-xs">
                            Teams
                          </Badge>
                        )}
                        {r.responded && (
                          <Badge variant="outline" className="text-xs text-green-700">
                            A répondu
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                  {preview.truncated && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Liste tronquée à 200 entrées pour l&apos;aperçu.
                    </p>
                  )}
                </details>
              )}
            </div>
          )}
        </div>

        {channelInvalid && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Le canal Teams n&apos;est pas configuré sur cet environnement.
          </div>
        )}

        <Button
          onClick={handleSendClick}
          disabled={sendDisabled}
          className="w-full"
          size="lg"
        >
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi en cours…
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Envoyer à {effectiveTotal} destinataire(s)
            </>
          )}
        </Button>

        {!surveyPublished && (
          <p className="text-sm text-amber-600">
            Le sondage doit être publié pour envoyer.
          </p>
        )}
      </CardContent>

      {/* Force resend confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Confirmer le renvoi complet
            </DialogTitle>
            <DialogDescription>
              Vous êtes sur le point d&apos;envoyer à{" "}
              <strong>{preview?.counts.total ?? 0} destinataire(s)</strong>, y
              compris ceux qui ont déjà répondu ou déjà reçu l&apos;invitation.
              Voulez-vous continuer ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={sending}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                setConfirmOpen(false);
                doSend();
              }}
              disabled={sending}
            >
              Confirmer l&apos;envoi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ManualRecipientPicker
        surveyId={surveyId}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selected={manualTokenIds}
        onConfirm={(ids) => {
          setManualTokenIds(ids);
          setPickerOpen(false);
        }}
      />
    </Card>
  );
}
