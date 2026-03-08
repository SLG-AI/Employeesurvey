"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Eye, BarChart3, Copy, Clock, CheckCircle2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Link from "next/link";
import type { Survey } from "@/lib/types";

type SurveyWithSociete = Survey & {
  societe: { id: string; name: string } | null;
};

type CompletionData = {
  totalTokens: number;
  totalResponses: number;
  rate: number;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "En préparation",
  published: "Publié",
  closed: "Clôturé",
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  published: "default",
  closed: "outline",
};

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<SurveyWithSociete[]>([]);
  const [loading, setLoading] = useState(true);
  const [societes, setSocietes] = useState<{ id: string; name: string }[]>([]);
  const [filterSociete, setFilterSociete] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [completionMap, setCompletionMap] = useState<Record<string, CompletionData>>({});
  const supabase = createClient();

  const loadSurveys = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("surveys")
      .select("*, societe:organizations!societe_id(id, name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erreur lors du chargement des sondages");
    } else {
      const statusOrder: Record<string, number> = { published: 0, draft: 1, closed: 2 };
      const sorted = (data || []).sort((a, b) => {
        const sa = statusOrder[a.status] ?? 9;
        const sb = statusOrder[b.status] ?? 9;
        if (sa !== sb) return sa - sb;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setSurveys(sorted);

      // Load completion data for published surveys
      const publishedIds = sorted.filter((s) => s.status === "published").map((s) => s.id);
      if (publishedIds.length > 0) {
        const map: Record<string, CompletionData> = {};
        await Promise.all(
          publishedIds.map(async (id) => {
            const [tokensRes, responsesRes] = await Promise.all([
              supabase.from("survey_tokens").select("id", { count: "exact", head: true }).eq("survey_id", id),
              supabase.from("responses").select("id", { count: "exact", head: true }).eq("survey_id", id),
            ]);
            const totalTokens = tokensRes.count ?? 0;
            const totalResponses = responsesRes.count ?? 0;
            map[id] = {
              totalTokens,
              totalResponses,
              rate: totalTokens > 0 ? Math.round((totalResponses / totalTokens) * 100) : 0,
            };
          })
        );
        setCompletionMap(map);
      }
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  useEffect(() => {
    async function loadSocietes() {
      const { data } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("type", "societe")
        .order("name");
      setSocietes(data || []);
    }
    loadSocietes();
  }, [supabase]);

  const filteredSurveys = surveys.filter((s) => {
    if (filterSociete !== "all" && s.societe?.id !== filterSociete) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  async function handleDuplicate(survey: Survey) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Non authentifié");
      return;
    }

    const { data: newSurvey, error: surveyError } = await supabase
      .from("surveys")
      .insert({
        title_fr: `${survey.title_fr} (copie)`,
        status: "draft",
        created_by: user.id,
        societe_id: survey.societe_id,
      })
      .select("id")
      .single();

    if (surveyError || !newSurvey) {
      toast.error("Erreur lors de la duplication");
      return;
    }

    const { data: sections } = await supabase
      .from("survey_sections")
      .select("*")
      .eq("survey_id", survey.id)
      .order("sort_order");

    for (const sec of sections || []) {
      const { data: newSec } = await supabase
        .from("survey_sections")
        .insert({
          survey_id: newSurvey.id,
          title_fr: sec.title_fr,
          sort_order: sec.sort_order,
        })
        .select("id")
        .single();

      if (!newSec) continue;

      const { data: questions } = await supabase
        .from("questions")
        .select("*, question_options(*)")
        .eq("survey_id", survey.id)
        .eq("section_id", sec.id)
        .order("sort_order");

      for (const q of questions || []) {
        const { data: newQ } = await supabase
          .from("questions")
          .insert({
            survey_id: newSurvey.id,
            section_id: newSec.id,
            type: q.type,
            text_fr: q.text_fr,
            text_en: q.text_en,
            question_code: q.question_code,
            sort_order: q.sort_order,
            required: q.required,
          })
          .select("id")
          .single();

        if (!newQ) continue;

        const options = (q.question_options || []).map(
          (o: { text_fr: string; text_en: string | null; value: string | null; sort_order: number }) => ({
            question_id: newQ.id,
            text_fr: o.text_fr,
            text_en: o.text_en,
            value: o.value,
            sort_order: o.sort_order,
          })
        );

        if (options.length > 0) {
          await supabase.from("question_options").insert(options);
        }
      }
    }

    toast.success("Sondage dupliqué");
    loadSurveys();
  }

  async function handleDelete(survey: Survey) {
    if (!confirm(`Supprimer le sondage "${survey.title_fr}" ?`)) return;

    const res = await fetch(`/api/surveys/${survey.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Erreur lors de la suppression");
    } else {
      toast.success("Sondage supprimé");
      loadSurveys();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sondages</h1>
          <p className="text-muted-foreground">
            Créez et gérez vos sondages employés
          </p>
        </div>
        <Link href="/surveys/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau sondage
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <Select value={filterSociete} onValueChange={setFilterSociete}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Societe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les societes</SelectItem>
            {societes.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="draft">En preparation</SelectItem>
            <SelectItem value="published">Publie</SelectItem>
            <SelectItem value="closed">Cloture</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Société</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead>Publié le</TableHead>
              <TableHead>Clôture</TableHead>
              <TableHead>Taux de réponse</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredSurveys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Aucun sondage. Créez votre premier sondage.
                </TableCell>
              </TableRow>
            ) : (
              filteredSurveys.map((survey) => (
                <TableRow key={survey.id}>
                  <TableCell className="font-medium">
                    <Link href={`/surveys/${survey.id}/edit`} className="hover:underline">
                      {survey.title_fr}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {survey.societe?.name || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[survey.status]}>
                      {STATUS_LABELS[survey.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(survey.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    {survey.published_at
                      ? new Date(survey.published_at).toLocaleDateString("fr-FR")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {survey.status === "published" && survey.closes_at ? (
                      (() => {
                        const daysLeft = Math.ceil(
                          (new Date(survey.closes_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                        );
                        return (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`inline-flex items-center gap-1 text-sm ${daysLeft <= 3 ? "text-destructive font-medium" : daysLeft <= 7 ? "text-amber-600" : "text-muted-foreground"}`}>
                                  <Clock className="h-3.5 w-3.5" />
                                  {daysLeft <= 0 ? "Expiré" : `${daysLeft}j`}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Clôture le {new Date(survey.closes_at).toLocaleDateString("fr-FR")}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })()
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {survey.status === "published" && completionMap[survey.id] ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Progress value={completionMap[survey.id].rate} className="h-2 w-16" />
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {completionMap[survey.id].rate}%
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {completionMap[survey.id].totalResponses} / {completionMap[survey.id].totalTokens} réponses
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {survey.status === "closed" && (
                        <Link href={`/surveys/${survey.id}/results`}>
                          <Button variant="ghost" size="icon" title="Voir les resultats">
                            <BarChart3 className="h-4 w-4 text-primary" />
                          </Button>
                        </Link>
                      )}
                      <Link href={`/s/${survey.id}?preview=1`} target="_blank">
                        <Button variant="ghost" size="icon" title="Prévisualiser">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/surveys/${survey.id}/edit`}>
                        <Button variant="ghost" size="icon" title="Editer">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => handleDuplicate(survey)} title="Dupliquer">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(survey)} title="Supprimer">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
