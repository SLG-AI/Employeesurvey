"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Copy,
  Download,
  Link2,
  QrCode,
  Code,
  Users,
  BarChart3,
  Mail,
  Send,
  Bell,
  Loader2,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  KeyRound,
  Globe,
  Info,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type DistributionMode,
  type SelfDeclarationField,
  type SurveyFilters,
  SELF_DECLARATION_FIELDS,
  SELF_DECLARATION_LABELS,
} from "@/lib/types";
import { toast } from "sonner";
import Link from "next/link";
import { TargetedSendPanel } from "./_components/targeted-send-panel";
import QRCode from "qrcode";
import FilterPanel from "@/components/survey-filters/filter-panel";

type TokenInfo = {
  id: string;
  token: string;
  societe_name: string | null;
  direction_name: string | null;
  department_name: string | null;
  service_name: string | null;
};

export default function DistributePage() {
  const params = useParams();
  const surveyId = params.id as string;
  const supabase = createClient();

  const [survey, setSurvey] = useState<{
    title_fr: string;
    status: string;
    societe_id: string | null;
    survey_type: string;
    filters: Record<string, unknown>;
    distribution_mode: DistributionMode;
    open_self_declaration_fields: SelfDeclarationField[];
    estimated_population: number | null;
  } | null>(null);
  const [hasSurveyTokens, setHasSurveyTokens] = useState(false);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [responseCount, setResponseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [qrSvg, setQrSvg] = useState<string>("");
  const [genericLink, setGenericLink] = useState("");
  const [emailStats, setEmailStats] = useState<{
    total: number;
    invited: number;
    responded: number;
  }>({ total: 0, invited: 0, responded: 0 });
  const [sendingInvitations, setSendingInvitations] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [teamsConfigured, setTeamsConfigured] = useState<boolean | null>(null);
  const [teamsStats, setTeamsStats] = useState<{
    total: number;
    invited: number;
    responded: number;
  }>({ total: 0, invited: 0, responded: 0 });
  const [sendingTeamsInvitations, setSendingTeamsInvitations] = useState(false);
  const [sendingTeamsReminders, setSendingTeamsReminders] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [distributionFilters, setDistributionFilters] = useState<SurveyFilters>({});
  const [previewEmployees, setPreviewEmployees] = useState<{
    id: string;
    employee_name: string | null;
    email: string | null;
    fonction: string | null;
    societe_name: string | null;
    direction_name: string | null;
    department_name: string | null;
    service_name: string | null;
    lieu_travail: string | null;
  }[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [applyingSelection, setApplyingSelection] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    totalTokens: number;
    newForEmail: number;
    newForTeams: number;
    totalWithEmail: number;
    totalResponses: number;
    societeName: string | null;
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);

    // Load survey
    const { data: surveyData } = await supabase
      .from("surveys")
      .select("title_fr, status, societe_id, survey_type, filters, distribution_mode, open_self_declaration_fields, estimated_population")
      .eq("id", surveyId)
      .single();

    if (surveyData) {
      setSurvey(surveyData);
      setDistributionFilters((surveyData.filters as SurveyFilters) || {});
    }

    // Check if survey_tokens exist for this survey
    const { count: stCount } = await supabase
      .from("survey_tokens")
      .select("id", { count: "exact", head: true })
      .eq("survey_id", surveyId);

    let useSurveyTokens = (stCount ?? 0) > 0;

    // Auto-generate survey_tokens if survey has filters but none exist yet
    if (!useSurveyTokens && surveyData?.filters && Object.keys(surveyData.filters).length > 0) {
      try {
        const genRes = await fetch(`/api/surveys/${surveyId}/generate-tokens`, { method: "POST" });
        if (genRes.ok) {
          const genData = await genRes.json();
          useSurveyTokens = (genData.inserted ?? 0) > 0;
        }
      } catch {
        // silent
      }
    }

    setHasSurveyTokens(useSurveyTokens);

    if (useSurveyTokens) {
      // Load tokens via survey_tokens
      const { data: stData } = await supabase
        .from("survey_tokens")
        .select("token_id, invitation_sent_at, teams_invitation_sent_at, anonymous_tokens!inner(id, token, societe_id, direction_id, department_id, service_id)")
        .eq("survey_id", surveyId);

      if (stData && stData.length > 0) {
        const { data: orgs } = await supabase
          .from("organizations")
          .select("id, name");
        const orgMap = new Map((orgs || []).map((o) => [o.id, o.name]));

        setTokens(
          stData.map((st: any) => ({
            id: st.anonymous_tokens.id,
            token: st.anonymous_tokens.token,
            societe_name: st.anonymous_tokens.societe_id ? orgMap.get(st.anonymous_tokens.societe_id) || null : null,
            direction_name: st.anonymous_tokens.direction_id ? orgMap.get(st.anonymous_tokens.direction_id) || null : null,
            department_name: st.anonymous_tokens.department_id ? orgMap.get(st.anonymous_tokens.department_id) || null : null,
            service_name: st.anonymous_tokens.service_id ? orgMap.get(st.anonymous_tokens.service_id) || null : null,
          }))
        );
      }
    } else {
      // Legacy: load tokens by societe_id
      let tokensQuery = supabase
        .from("anonymous_tokens")
        .select("id, token, societe_id, direction_id, department_id, service_id")
        .eq("active", true);

      if (surveyData?.societe_id) {
        tokensQuery = tokensQuery.eq("societe_id", surveyData.societe_id);
      }

      const { data: tokensData } = await tokensQuery;

      if (tokensData && tokensData.length > 0) {
        const { data: orgs } = await supabase
          .from("organizations")
          .select("id, name");
        const orgMap = new Map((orgs || []).map((o) => [o.id, o.name]));

        setTokens(
          tokensData.map((t) => ({
            id: t.id,
            token: t.token,
            societe_name: t.societe_id ? orgMap.get(t.societe_id) || null : null,
            direction_name: t.direction_id ? orgMap.get(t.direction_id) || null : null,
            department_name: t.department_id ? orgMap.get(t.department_id) || null : null,
            service_name: t.service_id ? orgMap.get(t.service_id) || null : null,
          }))
        );
      }
    }

    // Count responses (token + open)
    const { count } = await supabase
      .from("responses")
      .select("id", { count: "exact", head: true })
      .eq("survey_id", surveyId);

    const { count: openCount } = await supabase
      .from("open_responses")
      .select("id", { count: "exact", head: true })
      .eq("survey_id", surveyId);

    setResponseCount((count || 0) + (openCount || 0));

    if (useSurveyTokens) {
      // Email stats from survey_tokens
      const { data: stEmailData } = await supabase
        .from("survey_tokens")
        .select("invitation_sent_at, anonymous_tokens!inner(id, email)")
        .eq("survey_id", surveyId);

      const withEmail = (stEmailData || []).filter((st: any) => st.anonymous_tokens?.email);
      const invitedCount = withEmail.filter((st: any) => st.invitation_sent_at !== null).length;

      setEmailStats({
        total: withEmail.length,
        invited: invitedCount,
        responded: count || 0,
      });

      // Teams stats from survey_tokens
      const { data: stTeamsData } = await supabase
        .from("survey_tokens")
        .select("teams_invitation_sent_at, anonymous_tokens!inner(id, email)")
        .eq("survey_id", surveyId);

      const withTeamsEmail = (stTeamsData || []).filter((st: any) => st.anonymous_tokens?.email);
      const teamsInvitedCount = withTeamsEmail.filter((st: any) => st.teams_invitation_sent_at !== null).length;

      setTeamsStats({
        total: withTeamsEmail.length,
        invited: teamsInvitedCount,
        responded: count || 0,
      });
    } else {
      // Legacy email stats
      let emailQuery = supabase
        .from("anonymous_tokens")
        .select("id, email, invitation_sent_at")
        .eq("active", true)
        .not("email", "is", null);

      if (surveyData?.societe_id) {
        emailQuery = emailQuery.eq("societe_id", surveyData.societe_id);
      }

      const { data: tokensWithEmail } = await emailQuery;

      const withEmail = tokensWithEmail || [];
      const invitedCount = withEmail.filter(
        (t) => t.invitation_sent_at !== null
      ).length;

      setEmailStats({
        total: withEmail.length,
        invited: invitedCount,
        responded: count || 0,
      });

      // Legacy Teams stats
      let teamsQuery = supabase
        .from("anonymous_tokens")
        .select("id, email, teams_invitation_sent_at")
        .eq("active", true)
        .not("email", "is", null);

      if (surveyData?.societe_id) {
        teamsQuery = teamsQuery.eq("societe_id", surveyData.societe_id);
      }

      const { data: tokensWithTeams } = await teamsQuery;
      const withTeams = tokensWithTeams || [];
      const teamsInvitedCount = withTeams.filter(
        (t) => t.teams_invitation_sent_at !== null
      ).length;

      setTeamsStats({
        total: withTeams.length,
        invited: teamsInvitedCount,
        responded: count || 0,
      });
    }

    // Check Teams configuration
    try {
      const teamsRes = await fetch("/api/teams-config");
      const teamsData = await teamsRes.json();
      setTeamsConfigured(teamsData.configured);
    } catch {
      setTeamsConfigured(false);
    }

    // Generate generic link and QR
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/s/${surveyId}`;
    setGenericLink(link);

    try {
      const svg = await QRCode.toString(link, { type: "svg", width: 300, margin: 2 });
      setQrSvg(svg);
    } catch {
      // QR generation failed silently
    }

    setLoading(false);
  }, [supabase, surveyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers");
  }

  function downloadQR() {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `survey-${surveyId}-qr.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadDistributionCSV() {
    if (tokens.length === 0) {
      toast.error("Aucun token disponible. Importez d'abord la structure organisationnelle.");
      return;
    }

    const baseUrl = window.location.origin;
    const rows = [
      ["token", "lien_sondage", "société", "direction", "département", "service"],
      ...tokens.map((t) => [
        t.token,
        `${baseUrl}/s/${surveyId}?t=${t.token}`,
        t.societe_name || "",
        t.direction_name || "",
        t.department_name || "",
        t.service_name || "",
      ]),
    ];

    const csvContent = rows
      .map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `distribution-${surveyId}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("CSV de distribution téléchargé");
  }

  async function sendInvitations() {
    setSendingInvitations(true);
    try {
      const response = await fetch(`/api/surveys/${surveyId}/send-invitations`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        if (data.sent > 0) {
          toast.success(`${data.sent} invitation(s) envoyée(s) avec succès`);
        }
        if (data.failed > 0) {
          toast.error(`${data.failed} invitation(s) échouée(s)`, { duration: 5000 });
        }
        if (data.sent === 0 && data.failed === 0) {
          toast.info(data.message || "Aucune invitation à envoyer");
        }
        await loadData();
      } else {
        toast.error(data.error || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur réseau lors de l'envoi");
    } finally {
      setSendingInvitations(false);
    }
  }

  async function sendReminders() {
    setSendingReminders(true);
    try {
      const response = await fetch(`/api/surveys/${surveyId}/send-reminders`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        if (data.sent > 0) {
          toast.success(`${data.sent} rappel(s) envoyé(s) avec succès`);
        }
        if (data.failed > 0) {
          toast.error(`${data.failed} rappel(s) échoué(s)`, { duration: 5000 });
        }
        if (data.sent === 0 && data.failed === 0) {
          toast.info(data.message || "Aucun rappel à envoyer");
        }
        await loadData();
      } else {
        toast.error(data.error || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur réseau lors de l'envoi");
    } finally {
      setSendingReminders(false);
    }
  }

  async function sendTeamsInvitations(force = false) {
    setSendingTeamsInvitations(true);
    try {
      const response = await fetch(`/api/surveys/${surveyId}/send-teams-invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = await response.json();

      if (response.ok) {
        if (data.sent > 0) {
          toast.success(`${data.sent} notification(s) Teams envoyée(s)`);
        }
        if (data.failed > 0) {
          toast.error(`${data.failed} notification(s) Teams échouée(s)`, { duration: 5000 });
        }
        if (data.notInstalled > 0) {
          toast.warning(
            `${data.notInstalled} destinataire(s) n'ont pas installé le bot Teams`,
            { duration: 7000 }
          );
        }
        if (data.sent === 0 && data.failed === 0 && (!data.notInstalled || data.notInstalled === 0)) {
          toast.info(data.message || "Aucune notification à envoyer");
        }
        await loadData();
      } else {
        toast.error(data.error || "Erreur lors de l'envoi Teams");
      }
    } catch {
      toast.error("Erreur réseau lors de l'envoi Teams");
    } finally {
      setSendingTeamsInvitations(false);
    }
  }

  async function sendTeamsReminders() {
    setSendingTeamsReminders(true);
    try {
      const response = await fetch(`/api/surveys/${surveyId}/send-teams-reminders`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        if (data.sent > 0) {
          toast.success(`${data.sent} rappel(s) Teams envoyé(s)`);
        }
        if (data.failed > 0) {
          toast.error(`${data.failed} rappel(s) Teams échoué(s)`, { duration: 5000 });
        }
        if (data.notInstalled > 0) {
          toast.warning(
            `${data.notInstalled} destinataire(s) n'ont pas installé le bot Teams`,
            { duration: 7000 }
          );
        }
        if (data.sent === 0 && data.failed === 0 && (!data.notInstalled || data.notInstalled === 0)) {
          toast.info(data.message || "Aucun rappel Teams à envoyer");
        }
        await loadData();
      } else {
        toast.error(data.error || "Erreur lors de l'envoi Teams");
      }
    } catch {
      toast.error("Erreur réseau lors de l'envoi Teams");
    } finally {
      setSendingTeamsReminders(false);
    }
  }

  async function syncFromStructure() {
    setSyncing(true);
    const prevTokenCount = tokens.length;

    // Fetch survey fresh from DB to get current societe_id
    const { data: freshSurvey } = await supabase
      .from("surveys")
      .select("societe_id")
      .eq("id", surveyId)
      .single();

    const societeId = freshSurvey?.societe_id || null;

    // Resolve société name for display
    let societeName: string | null = null;
    if (societeId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", societeId)
        .single();
      societeName = org?.name || null;
    }

    // Fetch all active tokens filtered by survey's company
    let tokensQuery = supabase
      .from("anonymous_tokens")
      .select("id, email, invitation_sent_at, teams_invitation_sent_at, societe_id")
      .eq("active", true);

    if (societeId) {
      tokensQuery = tokensQuery.eq("societe_id", societeId);
    }

    const { data: allTokens } = await tokensQuery;
    const tokensList = allTokens || [];

    const withEmail = tokensList.filter((t) => t.email);
    const newForEmail = withEmail.filter((t) => !t.invitation_sent_at).length;
    const newForTeams = withEmail.filter((t) => !t.teams_invitation_sent_at).length;

    const { count } = await supabase
      .from("responses")
      .select("id", { count: "exact", head: true })
      .eq("survey_id", surveyId);

    setSyncResult({
      totalTokens: tokensList.length,
      newForEmail,
      newForTeams,
      totalWithEmail: withEmail.length,
      totalResponses: count || 0,
      societeName,
    });

    const newTokens = tokensList.length - prevTokenCount;
    if (newTokens > 0) {
      toast.success(`Distribution mise à jour : ${newTokens} nouveau(x) employé(s) détecté(s)`);
    } else {
      toast.success("Distribution synchronisée avec la structure actuelle");
    }

    // Reload all page data to update stats everywhere
    await loadData();
    setSyncing(false);
  }

  async function regeneratePopulation() {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/surveys/${surveyId}/generate-tokens`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Population regénérée : ${data.inserted} personne(s)`);
        await loadData();
      } else {
        toast.error(data.error || "Erreur lors de la régénération");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setRegenerating(false);
  }

  async function handleFiltersChange(newFilters: SurveyFilters) {
    setDistributionFilters(newFilters);
    // Save filters to DB
    const { error } = await supabase
      .from("surveys")
      .update({ filters: newFilters })
      .eq("id", surveyId);
    if (error) {
      toast.error("Erreur lors de la sauvegarde des filtres");
      return;
    }
    setSurvey((prev) => prev ? { ...prev, filters: newFilters } : prev);
    // Load employee preview
    await loadEmployeePreview(newFilters);
  }

  async function loadEmployeePreview(filters: SurveyFilters) {
    setLoadingPreview(true);
    try {
      const res = await fetch("/api/surveys/preview-employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewEmployees(data.employees);
        setSelectedEmployeeIds(new Set(data.employees.map((e: { id: string }) => e.id)));
        setPreviewLoaded(true);
      } else {
        toast.error("Erreur lors du chargement de la prévisualisation");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setLoadingPreview(false);
  }

  async function applyEmployeeSelection() {
    setApplyingSelection(true);
    try {
      const res = await fetch(`/api/surveys/${surveyId}/generate-tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_token_ids: Array.from(selectedEmployeeIds) }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Population mise à jour : ${data.inserted} personne(s)`);
        setPreviewLoaded(false);
        setPreviewEmployees([]);
        await loadData();
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setApplyingSelection(false);
  }

  function toggleEmployee(id: string) {
    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllEmployees() {
    setSelectedEmployeeIds(new Set(filteredPreviewEmployees.map((e) => e.id)));
  }

  function deselectAllEmployees() {
    setSelectedEmployeeIds(new Set());
  }

  const filteredPreviewEmployees = previewEmployees.filter((e) => {
    if (!employeeSearch) return true;
    const search = employeeSearch.toLowerCase();
    return (
      (e.employee_name && e.employee_name.toLowerCase().includes(search)) ||
      (e.email && e.email.toLowerCase().includes(search)) ||
      (e.fonction && e.fonction.toLowerCase().includes(search)) ||
      (e.direction_name && e.direction_name.toLowerCase().includes(search)) ||
      (e.department_name && e.department_name.toLowerCase().includes(search)) ||
      (e.service_name && e.service_name.toLowerCase().includes(search))
    );
  });

  function updateDistributionMode(mode: DistributionMode) {
    setSurvey((prev) => prev ? { ...prev, distribution_mode: mode } : prev);
  }

  function toggleSelfDeclarationField(field: SelfDeclarationField) {
    if (!survey) return;
    const current = survey.open_self_declaration_fields || [];
    const updated = current.includes(field)
      ? current.filter((f) => f !== field)
      : [...current, field];
    setSurvey((prev) => prev ? { ...prev, open_self_declaration_fields: updated } : prev);
  }

  function updateEstimatedPopulation(value: number | null) {
    setSurvey((prev) => prev ? { ...prev, estimated_population: value } : prev);
  }

  const [savingConfig, setSavingConfig] = useState(false);

  async function saveDistributionConfig() {
    if (!survey) return;
    setSavingConfig(true);
    const { error } = await supabase
      .from("surveys")
      .update({
        distribution_mode: survey.distribution_mode,
        open_self_declaration_fields: survey.open_self_declaration_fields,
        estimated_population: survey.estimated_population,
      })
      .eq("id", surveyId);

    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Configuration de distribution enregistrée");
    }
    setSavingConfig(false);
  }

  function getIframeCode() {
    return `<iframe src="${genericLink}" width="100%" height="700" frameborder="0" style="border: 1px solid #e5e7eb; border-radius: 8px;"></iframe>`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/surveys/${surveyId}/edit`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Distribution</h1>
            <p className="text-sm text-muted-foreground">
              {survey?.title_fr}
            </p>
          </div>
          {survey?.survey_type && (
            <Badge variant={survey.survey_type === "pulse" ? "default" : "secondary"}>
              {survey.survey_type === "pulse" ? "Pulse" : "Classique"}
            </Badge>
          )}
        </div>
        <Link href={`/surveys/${surveyId}/results`}>
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Résultats
          </Button>
        </Link>
      </div>

      {/* Distribution Mode Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Mode de distribution</CardTitle>
          <CardDescription>
            Choisissez comment les répondants accèdent au sondage.
            {responseCount > 0 && " Le mode ne peut plus être modifié une fois des réponses reçues."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Token mode */}
            <button
              type="button"
              disabled={responseCount > 0}
              onClick={() => updateDistributionMode("token")}
              className={`relative rounded-lg border-2 p-4 text-left transition-colors ${
                survey?.distribution_mode === "token"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/30"
              } ${responseCount > 0 ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
            >
              {survey?.distribution_mode === "token" && (
                <Badge className="absolute top-2 right-2" variant="default">Recommandé</Badge>
              )}
              {survey?.distribution_mode !== "token" && (
                <Badge className="absolute top-2 right-2" variant="outline">Recommandé</Badge>
              )}
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="h-5 w-5 text-primary" />
                <span className="font-semibold">Distribution par token</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Chaque employé reçoit un lien unique. Empêche les réponses multiples et permet
                de segmenter les résultats selon les variables RH enregistrées.
              </p>
            </button>

            {/* Open mode */}
            <button
              type="button"
              disabled={responseCount > 0}
              onClick={() => updateDistributionMode("open")}
              className={`relative rounded-lg border-2 p-4 text-left transition-colors ${
                survey?.distribution_mode === "open"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/30"
              } ${responseCount > 0 ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">Accès libre</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Toute personne disposant du lien ou du QR code peut répondre.
                Plus simple à diffuser, mais moins de contrôle sur les doublons.
              </p>
            </button>
          </div>

          {survey?.distribution_mode === "token" && (
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Les résultats sont automatiquement segmentés selon la structure organisationnelle
                et les variables RH importées. Un seul réponse par token garanti.
              </p>
            </div>
          )}

          {survey?.distribution_mode === "open" && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Les doublons sont limités par le navigateur (cookie). Pour segmenter les résultats,
                  configurez les variables d&apos;auto-déclaration ci-dessous. Elles seront présentées
                  au répondant en fin de questionnaire.
                </p>
              </div>

              {/* Self-declaration fields */}
              <div>
                <Label className="text-sm font-medium">
                  Variables d&apos;auto-déclaration (obligatoires pour le répondant)
                </Label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {SELF_DECLARATION_FIELDS.map((field) => (
                    <label
                      key={field}
                      className="flex items-center gap-2 rounded-md border p-2 text-sm cursor-pointer hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={(survey.open_self_declaration_fields || []).includes(field)}
                        onCheckedChange={() => toggleSelfDeclarationField(field)}
                        disabled={responseCount > 0}
                      />
                      {SELF_DECLARATION_LABELS[field]}
                    </label>
                  ))}
                </div>
              </div>

              {/* Estimated population */}
              <div>
                <Label htmlFor="estimated-pop" className="text-sm font-medium">
                  Population estimée (pour le calcul du taux de réponse)
                </Label>
                <Input
                  id="estimated-pop"
                  type="number"
                  min={1}
                  placeholder="Ex : 150"
                  className="mt-1 max-w-[200px]"
                  value={survey.estimated_population ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : null;
                    setSurvey((prev) => prev ? { ...prev, estimated_population: val } : prev);
                  }}
                />
              </div>

              {/* Save button */}
              <Button
                onClick={saveDistributionConfig}
                disabled={savingConfig}
                className="w-full sm:w-auto"
              >
                {savingConfig ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Valider la configuration
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Save button for token mode change */}
          {survey?.distribution_mode === "token" && (
            <Button
              onClick={saveDistributionConfig}
              disabled={savingConfig}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {savingConfig ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Valider la configuration
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {survey?.distribution_mode === "open" ? "Population estimée" : "Tokens"}
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {survey?.distribution_mode === "open"
                ? (survey.estimated_population ?? "—")
                : tokens.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Réponses</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{responseCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Taux</span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {survey?.distribution_mode === "open"
                ? (survey.estimated_population && survey.estimated_population > 0
                    ? `${Math.round((responseCount / survey.estimated_population) * 100)}%`
                    : "—")
                : (tokens.length > 0
                    ? `${Math.round((responseCount / tokens.length) * 100)}%`
                    : "—")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Token-only sections ── */}
      {survey?.distribution_mode !== "open" && (
      <>
      {/* Filtres de population */}
      <FilterPanel
        societeIds={distributionFilters.societe_ids || (survey?.societe_id ? [survey.societe_id] : [])}
        filters={distributionFilters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Load preview button */}
      {!previewLoaded && !loadingPreview && (
        <Button
          variant="outline"
          onClick={() => loadEmployeePreview(distributionFilters)}
          disabled={loadingPreview}
        >
          <Users className="mr-2 h-4 w-4" />
          Voir / sélectionner les employés
        </Button>
      )}

      {/* Employee preview & selection */}
      {(loadingPreview || previewLoaded) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Employés correspondants
                {previewLoaded && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedEmployeeIds.size} / {previewEmployees.length} sélectionné(s)
                  </Badge>
                )}
              </div>
              {previewLoaded && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllEmployees}>
                    Tout sélectionner
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAllEmployees}>
                    Tout désélectionner
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingPreview ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des employés...
              </div>
            ) : (
              <>
                <Input
                  placeholder="Rechercher par nom, email, fonction, direction..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                />
                <div className="max-h-96 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={filteredPreviewEmployees.length > 0 && filteredPreviewEmployees.every((e) => selectedEmployeeIds.has(e.id))}
                            onCheckedChange={(checked) => {
                              setSelectedEmployeeIds((prev) => {
                                const next = new Set(prev);
                                for (const e of filteredPreviewEmployees) {
                                  if (checked) next.add(e.id);
                                  else next.delete(e.id);
                                }
                                return next;
                              });
                            }}
                          />
                        </TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Fonction</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead>Département</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPreviewEmployees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            {employeeSearch ? "Aucun résultat pour cette recherche" : "Aucun employé trouvé avec ces filtres"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPreviewEmployees.map((emp) => (
                          <TableRow
                            key={emp.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleEmployee(emp.id)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedEmployeeIds.has(emp.id)}
                                onCheckedChange={() => toggleEmployee(emp.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {emp.employee_name || "—"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {emp.email || "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {emp.fonction || "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {emp.direction_name || "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {emp.department_name || "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployeeIds.size} employé(s) sélectionné(s) sur {previewEmployees.length}
                  </p>
                  <Button onClick={applyEmployeeSelection} disabled={applyingSelection || selectedEmployeeIds.size === 0}>
                    {applyingSelection ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Application...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Appliquer la sélection ({selectedEmployeeIds.size})
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sync from Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Synchronisation avec la structure employé
          </CardTitle>
          <CardDescription>
            Mettez à jour les canaux de distribution en fonction de la dernière
            structure organisationnelle importée.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={syncFromStructure} disabled={syncing}>
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Synchronisation...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rafraîchir depuis la structure
                </>
              )}
            </Button>
            <Button onClick={regeneratePopulation} disabled={regenerating} variant="outline">
              {regenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regénération...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regénérer la population
                </>
              )}
            </Button>
          </div>

          {syncResult && (
            <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Distribution synchronisée
                  {syncResult.societeName && (
                    <span className="font-normal text-muted-foreground">
                      {" "}— filtrée sur {syncResult.societeName}
                    </span>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total employés</p>
                  <p className="text-lg font-bold">{syncResult.totalTokens}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avec email</p>
                  <p className="text-lg font-bold">{syncResult.totalWithEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    <Mail className="mr-1 inline h-3 w-3" />
                    Non invités (email)
                  </p>
                  <p className="text-lg font-bold text-blue-600">{syncResult.newForEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    <MessageSquare className="mr-1 inline h-3 w-3" />
                    Non notifiés (Teams)
                  </p>
                  <p className="text-lg font-bold text-purple-600">{syncResult.newForTeams}</p>
                </div>
              </div>
              {syncResult.newForEmail > 0 && (
                <p className="text-sm text-green-700">
                  {syncResult.newForEmail} employé(s) peuvent recevoir une invitation par email.
                </p>
              )}
              {syncResult.newForTeams > 0 && (
                <p className="text-sm text-purple-700">
                  {syncResult.newForTeams} employé(s) peuvent recevoir une notification Teams.
                </p>
              )}
              {syncResult.newForEmail === 0 && syncResult.newForTeams === 0 && syncResult.totalWithEmail > 0 && (
                <p className="text-sm text-muted-foreground">
                  Tous les employés avec email ont déjà été contactés.
                </p>
              )}
              {syncResult.totalWithEmail === 0 && (
                <p className="text-sm text-amber-600">
                  Aucun employé avec email. Importez la structure avec des adresses email pour activer la distribution par email et Teams.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      </>
      )}

      {/* Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Lien de partage
          </CardTitle>
          <CardDescription>
            {survey?.distribution_mode === "open"
              ? "Partagez ce lien pour permettre à quiconque de répondre au sondage."
              : "Lien générique (sans token). Les répondants devront saisir leur token manuellement, ou utilisez le CSV pour des liens personnalisés."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={genericLink} readOnly className="font-mono text-sm" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(genericLink)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code
          </CardTitle>
          <CardDescription>
            Imprimez ou affichez ce QR code pour un accès rapide au sondage
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {qrSvg && (
            <div
              className="h-48 w-48 rounded border overflow-hidden [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          )}
          <Button variant="outline" onClick={downloadQR}>
            <Download className="mr-2 h-4 w-4" />
            Télécharger QR Code
          </Button>
        </CardContent>
      </Card>

      {/* Iframe embed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Intégration iframe
          </CardTitle>
          <CardDescription>
            Intégrez le sondage directement dans un site ou intranet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
            {getIframeCode()}
          </pre>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(getIframeCode())}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copier le code
          </Button>
        </CardContent>
      </Card>

      {/* ── Token-only: Email, Teams, CSV ── */}
      {survey?.distribution_mode !== "open" && (
      <>
      {/* Targeted send (relances ciblées) */}
      <TargetedSendPanel
        surveyId={surveyId}
        surveyPublished={survey?.status === "published"}
        teamsConfigured={teamsConfigured === true}
        onSent={loadData}
      />

      {/* Email Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Distribution par email
          </CardTitle>
          <CardDescription>
            Envoyez des invitations et des rappels directement depuis
            Loud&amp;Clear. Chaque email contient un lien unique et anonyme.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/50 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Emails disponibles</p>
              <p className="text-2xl font-bold">{emailStats.total}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Invitations envoyées</p>
              <p className="text-2xl font-bold">{emailStats.invited}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Non-répondants</p>
              <p className="text-2xl font-bold">
                {Math.max(0, emailStats.invited - emailStats.responded)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={sendInvitations}
              disabled={
                sendingInvitations ||
                emailStats.total === 0 ||
                survey?.status !== "published"
              }
              className="flex-1"
            >
              {sendingInvitations ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer les invitations
                </>
              )}
            </Button>

            <Button
              onClick={sendReminders}
              disabled={
                sendingReminders ||
                emailStats.invited === 0 ||
                emailStats.invited <= emailStats.responded ||
                survey?.status !== "published"
              }
              variant="outline"
              className="flex-1"
            >
              {sendingReminders ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Envoyer des rappels
                </>
              )}
            </Button>
          </div>

          {/* Status messages */}
          {survey?.status !== "published" && (
            <p className="text-sm text-amber-600">
              Le sondage doit être publié pour envoyer des emails.
            </p>
          )}
          {emailStats.total === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun email disponible. Importez d&apos;abord la structure
              organisationnelle avec les emails des employés.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Teams Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Distribution via Microsoft Teams
          </CardTitle>
          <CardDescription>
            Envoyez des notifications directement dans Microsoft Teams.
            Chaque message contient un lien unique et anonyme.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {teamsConfigured === false && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Microsoft Teams non configuré</p>
                <p className="mt-1">
                  Pour activer les notifications Teams, un administrateur Azure doit
                  configurer les variables suivantes dans le fichier{" "}
                  <code className="rounded bg-amber-100 px-1">.env.local</code> :
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li><code className="rounded bg-amber-100 px-1">AZURE_TENANT_ID</code></li>
                  <li><code className="rounded bg-amber-100 px-1">AZURE_CLIENT_ID</code></li>
                  <li><code className="rounded bg-amber-100 px-1">AZURE_CLIENT_SECRET</code></li>
                </ul>
              </div>
            </div>
          )}

          {teamsConfigured && (
            <>
              {/* Teams Stats */}
              <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Destinataires disponibles</p>
                  <p className="text-2xl font-bold">{teamsStats.total}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Notifications envoyées</p>
                  <p className="text-2xl font-bold">{teamsStats.invited}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Non-répondants</p>
                  <p className="text-2xl font-bold">
                    {Math.max(0, teamsStats.invited - teamsStats.responded)}
                  </p>
                </div>
              </div>

              {/* Teams Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => sendTeamsInvitations(false)}
                  disabled={
                    sendingTeamsInvitations ||
                    teamsStats.total === 0 ||
                    survey?.status !== "published"
                  }
                  className="flex-1"
                >
                  {sendingTeamsInvitations ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer via Teams
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => {
                    if (confirm("Envoyer les notifications Teams à tous les destinataires, y compris ceux déjà notifiés ?")) {
                      sendTeamsInvitations(true);
                    }
                  }}
                  disabled={
                    sendingTeamsInvitations ||
                    teamsStats.total === 0 ||
                    survey?.status !== "published"
                  }
                  variant="outline"
                  title="Envoyer à tous les destinataires, même ceux déjà notifiés"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Renvoyer à tous
                </Button>

                <Button
                  onClick={sendTeamsReminders}
                  disabled={
                    sendingTeamsReminders ||
                    teamsStats.invited === 0 ||
                    teamsStats.invited <= teamsStats.responded ||
                    survey?.status !== "published"
                  }
                  variant="outline"
                  className="flex-1"
                >
                  {sendingTeamsReminders ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Bell className="mr-2 h-4 w-4" />
                      Rappels Teams
                    </>
                  )}
                </Button>
              </div>

              {survey?.status !== "published" && (
                <p className="text-sm text-amber-600">
                  Le sondage doit être publié pour envoyer des notifications Teams.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* CSV Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Distribution par email (CSV)
          </CardTitle>
          <CardDescription>
            Téléchargez un CSV contenant un lien personnalisé par token.
            Utilisez ce fichier avec votre outil d&apos;emailing pour envoyer
            un lien unique à chaque employé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadDistributionCSV}>
            <Download className="mr-2 h-4 w-4" />
            Télécharger CSV ({tokens.length} liens)
          </Button>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}
