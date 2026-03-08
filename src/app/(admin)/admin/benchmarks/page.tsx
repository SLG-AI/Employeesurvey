"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Download,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { INDUSTRIES } from "@/lib/industries";
import { COMPANY_SIZES } from "@/lib/company-sizes";
import {
  getBenchmarkThemes,
  saveBenchmarkTheme,
  deleteBenchmarkTheme,
  seedBenchmarkThemes,
} from "../actions";
import type { BenchmarkThemeData } from "../actions";

type ThemeFormData = {
  id?: string;
  code: string;
  label_fr: string;
  label_en: string;
  market_average: string;
  p25: string;
  p50: string;
  p75: string;
  by_industry: Record<string, string>;
  by_company_size: Record<string, string>;
  questions: {
    code: string;
    text_fr: string;
    text_en: string;
    market_average: string;
    p25: string;
    p50: string;
    p75: string;
  }[];
};

const emptyForm: ThemeFormData = {
  code: "",
  label_fr: "",
  label_en: "",
  market_average: "",
  p25: "",
  p50: "",
  p75: "",
  by_industry: {},
  by_company_size: {},
  questions: [],
};

function QuestionsList({ questions }: { questions: BenchmarkThemeData["benchmark_questions"] }) {
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const sorted = [...questions].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="mt-4">
      <p className="text-sm font-medium mb-2">Questions de référence</p>
      <div className="space-y-2">
        {sorted.map((q) => (
          <div key={q.code} className="rounded border text-sm">
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/50"
              onClick={() => setExpandedQ(expandedQ === q.code ? null : q.code)}
            >
              <div className="flex items-center gap-2">
                {expandedQ === q.code ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                <span className="font-mono text-xs text-muted-foreground">{q.code}</span>
                <span>{q.text_fr}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary">{q.market_average}</Badge>
                {q.p25 != null && q.p75 != null && (
                  <span className="text-xs text-muted-foreground">[{q.p25}–{q.p75}]</span>
                )}
              </div>
            </div>
            {expandedQ === q.code && (q.by_industry && Object.keys(q.by_industry).length > 0 || q.by_company_size && Object.keys(q.by_company_size).length > 0) && (
              <div className="border-t px-2 py-2 grid gap-3 sm:grid-cols-2 bg-muted/30">
                {q.by_industry && Object.keys(q.by_industry).length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">Par secteur</p>
                    <div className="space-y-0.5 text-xs">
                      {Object.entries(q.by_industry).map(([code, detail]) => {
                        const ind = INDUSTRIES.find((i) => i.code === code);
                        return (
                          <div key={code} className="flex justify-between text-muted-foreground">
                            <span className="truncate mr-2">{ind?.label_fr || code}</span>
                            <span className="font-mono">
                              {detail.avg}
                              {detail.p25 != null && detail.p75 != null && (
                                <span className="ml-1 text-muted-foreground/60">[{detail.p25}–{detail.p75}]</span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {q.by_company_size && Object.keys(q.by_company_size).length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">Par taille</p>
                    <div className="space-y-0.5 text-xs">
                      {Object.entries(q.by_company_size).map(([code, detail]) => {
                        const size = COMPANY_SIZES.find((s) => s.code === code);
                        return (
                          <div key={code} className="flex justify-between text-muted-foreground">
                            <span className="truncate mr-2">{size?.label_fr || code}</span>
                            <span className="font-mono">
                              {detail.avg}
                              {detail.p25 != null && detail.p75 != null && (
                                <span className="ml-1 text-muted-foreground/60">[{detail.p25}–{detail.p75}]</span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminBenchmarksPage() {
  const [themes, setThemes] = useState<BenchmarkThemeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ThemeFormData>(emptyForm);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [showIndustryDetails, setShowIndustryDetails] = useState(false);
  const [showSizeDetails, setShowSizeDetails] = useState(false);

  const loadThemes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBenchmarkThemes();
      setThemes(data);
    } catch {
      toast.error("Erreur chargement des benchmarks");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  async function handleSeed() {
    if (!confirm("Importer les benchmarks par défaut ? Cette action créera les 11 thèmes standards.")) return;
    setSeeding(true);
    const result = await seedBenchmarkThemes();
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`${result.count} thèmes importés`);
      loadThemes();
    }
    setSeeding(false);
  }

  function openEditDialog(theme: BenchmarkThemeData) {
    const extractAvg = (val: unknown): string => {
      if (val === null || val === undefined) return "";
      if (typeof val === "number") return String(val);
      if (typeof val === "object" && val !== null && "avg" in val) return String((val as {avg: number}).avg);
      return "";
    };
    setForm({
      id: theme.id,
      code: theme.code,
      label_fr: theme.label_fr,
      label_en: theme.label_en,
      market_average: String(theme.market_average),
      p25: theme.p25 != null ? String(theme.p25) : "",
      p50: theme.p50 != null ? String(theme.p50) : "",
      p75: theme.p75 != null ? String(theme.p75) : "",
      by_industry: Object.fromEntries(
        Object.entries(theme.by_industry || {}).map(([k, v]) => [k, extractAvg(v)])
      ),
      by_company_size: Object.fromEntries(
        Object.entries(theme.by_company_size || {}).map(([k, v]) => [k, extractAvg(v)])
      ),
      questions: (theme.benchmark_questions || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((q) => ({
          code: q.code,
          text_fr: q.text_fr,
          text_en: q.text_en,
          market_average: String(q.market_average),
          p25: q.p25 != null ? String(q.p25) : "",
          p50: q.p50 != null ? String(q.p50) : "",
          p75: q.p75 != null ? String(q.p75) : "",
        })),
    });
    setShowIndustryDetails(false);
    setShowSizeDetails(false);
    setDialogOpen(true);
  }

  function openCreateDialog() {
    setForm(emptyForm);
    setShowIndustryDetails(false);
    setShowSizeDetails(false);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.code || !form.label_fr || !form.label_en || !form.market_average) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    setSaving(true);
    // When editing via the form, we only have avg values for industry/size.
    // Preserve the full detail objects from the original theme if editing.
    const originalTheme = themes.find((t) => t.id === form.id);

    const buildIndustryMap = () => {
      const result: Record<string, { avg: number; p25: number; p50: number; p75: number }> = {};
      for (const [k, v] of Object.entries(form.by_industry)) {
        if (v === "") continue;
        const avg = parseFloat(v);
        const orig = originalTheme?.by_industry?.[k];
        if (orig && typeof orig === "object" && "p25" in orig) {
          result[k] = { ...orig, avg };
        } else {
          result[k] = { avg, p25: Math.max(1, avg - 1.2), p50: avg, p75: Math.min(10, avg + 0.8) };
        }
      }
      return result;
    };

    const buildSizeMap = () => {
      const result: Record<string, { avg: number; p25: number; p50: number; p75: number }> = {};
      for (const [k, v] of Object.entries(form.by_company_size)) {
        if (v === "") continue;
        const avg = parseFloat(v);
        const orig = originalTheme?.by_company_size?.[k];
        if (orig && typeof orig === "object" && "p25" in orig) {
          result[k] = { ...orig, avg };
        } else {
          result[k] = { avg, p25: Math.max(1, avg - 1.2), p50: avg, p75: Math.min(10, avg + 0.8) };
        }
      }
      return result;
    };

    const saveResult = await saveBenchmarkTheme({
      id: form.id || undefined,
      code: form.code,
      label_fr: form.label_fr,
      label_en: form.label_en,
      market_average: parseFloat(form.market_average),
      p25: form.p25 ? parseFloat(form.p25) : null,
      p50: form.p50 ? parseFloat(form.p50) : null,
      p75: form.p75 ? parseFloat(form.p75) : null,
      by_industry: buildIndustryMap(),
      by_company_size: buildSizeMap(),
      questions: form.questions
        .filter((q) => q.code && q.text_fr)
        .map((q) => ({
          ...q,
          market_average: parseFloat(q.market_average) || 0,
          p25: q.p25 ? parseFloat(q.p25) : null,
          p50: q.p50 ? parseFloat(q.p50) : null,
          p75: q.p75 ? parseFloat(q.p75) : null,
        })),
    });
    const result = saveResult;

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(form.id ? "Thème mis à jour" : "Thème créé");
      setDialogOpen(false);
      loadThemes();
    }
    setSaving(false);
  }

  async function handleDelete(theme: BenchmarkThemeData) {
    if (!confirm(`Supprimer le thème "${theme.label_fr}" ?`)) return;

    const result = await deleteBenchmarkTheme(theme.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Thème supprimé");
      loadThemes();
    }
  }

  function addQuestion() {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { code: "", text_fr: "", text_en: "", market_average: "", p25: "", p50: "", p75: "" },
      ],
    }));
  }

  function removeQuestion(index: number) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  }

  function updateQuestion(index: number, field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Benchmarks
          </h1>
          <p className="text-muted-foreground">
            Gérez les valeurs de référence marché pour la comparaison des résultats
          </p>
        </div>
        <div className="flex gap-2">
          {themes.length === 0 && (
            <Button variant="outline" onClick={handleSeed} disabled={seeding}>
              {seeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Download className="mr-2 h-4 w-4" />
              Importer les valeurs par défaut
            </Button>
          )}
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau thème
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : themes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucun benchmark configuré. Importez les valeurs par défaut pour commencer.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {themes.map((theme) => (
            <Card key={theme.id}>
              <CardHeader
                className="cursor-pointer pb-3"
                onClick={() =>
                  setExpandedTheme(expandedTheme === theme.id ? null : theme.id)
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedTheme === theme.id ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-base">
                        {theme.label_fr}
                      </CardTitle>
                      <CardDescription>
                        {theme.code} · {theme.benchmark_questions?.length || 0} question(s)
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-sm">
                      Moy. marché : {theme.market_average}
                      {theme.p25 != null && theme.p75 != null && (
                        <span className="ml-1 text-muted-foreground">(P25: {theme.p25} / P75: {theme.p75})</span>
                      )}
                    </Badge>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(theme)}
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(theme)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {expandedTheme === theme.id && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium mb-2">Par secteur</p>
                      <div className="space-y-1 text-sm">
                        {Object.entries(theme.by_industry || {}).map(
                          ([code, val]) => {
                            const ind = INDUSTRIES.find((i) => i.code === code);
                            const detail = typeof val === "number" ? { avg: val, p25: null, p50: null, p75: null } : val;
                            return (
                              <div key={code} className="flex justify-between text-muted-foreground">
                                <span className="truncate mr-2">{ind?.label_fr || code}</span>
                                <span className="font-mono">
                                  {detail.avg}
                                  {detail.p25 != null && detail.p75 != null && (
                                    <span className="text-xs ml-1 text-muted-foreground/60">[{detail.p25}–{detail.p75}]</span>
                                  )}
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Par taille</p>
                      <div className="space-y-1 text-sm">
                        {Object.entries(theme.by_company_size || {}).map(
                          ([code, val]) => {
                            const size = COMPANY_SIZES.find((s) => s.code === code);
                            const detail = typeof val === "number" ? { avg: val, p25: null, p50: null, p75: null } : val;
                            return (
                              <div key={code} className="flex justify-between text-muted-foreground">
                                <span className="truncate mr-2">{size?.label_fr || code}</span>
                                <span className="font-mono">
                                  {detail.avg}
                                  {detail.p25 != null && detail.p75 != null && (
                                    <span className="text-xs ml-1 text-muted-foreground/60">[{detail.p25}–{detail.p75}]</span>
                                  )}
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                  {theme.benchmark_questions?.length > 0 && (
                    <QuestionsList questions={theme.benchmark_questions} />
                  )}
                  {theme.updated_at && (
                    <p className="text-xs text-muted-foreground mt-4">
                      Dernière mise à jour : {new Date(theme.updated_at).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Modifier le thème" : "Nouveau thème"}</DialogTitle>
            <DialogDescription>
              Définissez les valeurs de benchmark pour ce thème
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="ENGAGEMENT"
                />
              </div>
              <div className="space-y-1">
                <Label>Moyenne marché *</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.market_average}
                  onChange={(e) => setForm({ ...form, market_average: e.target.value })}
                  placeholder="6.4"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>P25</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.p25}
                  onChange={(e) => setForm({ ...form, p25: e.target.value })}
                  placeholder="5.2"
                />
              </div>
              <div className="space-y-1">
                <Label>P50 (médiane)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.p50}
                  onChange={(e) => setForm({ ...form, p50: e.target.value })}
                  placeholder="6.3"
                />
              </div>
              <div className="space-y-1">
                <Label>P75</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.p75}
                  onChange={(e) => setForm({ ...form, p75: e.target.value })}
                  placeholder="7.2"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Libellé FR *</Label>
                <Input
                  value={form.label_fr}
                  onChange={(e) => setForm({ ...form, label_fr: e.target.value })}
                  placeholder="Engagement"
                />
              </div>
              <div className="space-y-1">
                <Label>Libellé EN *</Label>
                <Input
                  value={form.label_en}
                  onChange={(e) => setForm({ ...form, label_en: e.target.value })}
                  placeholder="Engagement"
                />
              </div>
            </div>

            <Separator />

            {/* Industry averages */}
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowIndustryDetails(!showIndustryDetails)}
                className="mb-2"
              >
                {showIndustryDetails ? <ChevronDown className="mr-1 h-4 w-4" /> : <ChevronRight className="mr-1 h-4 w-4" />}
                Moyennes par secteur ({Object.values(form.by_industry).filter(v => v).length}/{INDUSTRIES.length})
              </Button>
              {showIndustryDetails && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {INDUSTRIES.map((ind) => (
                    <div key={ind.code} className="flex items-center gap-2">
                      <Label className="text-xs w-48 truncate" title={ind.label_fr}>{ind.label_fr}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        className="w-20 h-8 text-sm"
                        value={form.by_industry[ind.code] || ""}
                        onChange={(e) => setForm({ ...form, by_industry: { ...form.by_industry, [ind.code]: e.target.value } })}
                        placeholder="—"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Size averages */}
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSizeDetails(!showSizeDetails)}
                className="mb-2"
              >
                {showSizeDetails ? <ChevronDown className="mr-1 h-4 w-4" /> : <ChevronRight className="mr-1 h-4 w-4" />}
                Moyennes par taille ({Object.values(form.by_company_size).filter(v => v).length}/{COMPANY_SIZES.length})
              </Button>
              {showSizeDetails && (
                <div className="space-y-2">
                  {COMPANY_SIZES.map((size) => (
                    <div key={size.code} className="flex items-center gap-2">
                      <Label className="text-xs w-64 truncate" title={size.label_fr}>{size.label_fr}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        className="w-20 h-8 text-sm"
                        value={form.by_company_size[size.code] || ""}
                        onChange={(e) => setForm({ ...form, by_company_size: { ...form.by_company_size, [size.code]: e.target.value } })}
                        placeholder="—"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Questions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Questions de référence</Label>
                <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                  <Plus className="mr-1 h-3 w-3" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-3">
                {form.questions.map((q, i) => (
                  <div key={i} className="rounded border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-24 h-8 text-sm"
                        value={q.code}
                        onChange={(e) => updateQuestion(i, "code", e.target.value.toUpperCase())}
                        placeholder="Code"
                      />
                      <Input
                        type="number"
                        step="0.1"
                        className="w-20 h-8 text-sm"
                        value={q.market_average}
                        onChange={(e) => updateQuestion(i, "market_average", e.target.value)}
                        placeholder="Moy."
                      />
                      <Input
                        type="number"
                        step="0.1"
                        className="w-16 h-8 text-sm"
                        value={q.p25}
                        onChange={(e) => updateQuestion(i, "p25", e.target.value)}
                        placeholder="P25"
                      />
                      <Input
                        type="number"
                        step="0.1"
                        className="w-16 h-8 text-sm"
                        value={q.p50}
                        onChange={(e) => updateQuestion(i, "p50", e.target.value)}
                        placeholder="P50"
                      />
                      <Input
                        type="number"
                        step="0.1"
                        className="w-16 h-8 text-sm"
                        value={q.p75}
                        onChange={(e) => updateQuestion(i, "p75", e.target.value)}
                        placeholder="P75"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => removeQuestion(i)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <Input
                      value={q.text_fr}
                      onChange={(e) => updateQuestion(i, "text_fr", e.target.value)}
                      placeholder="Question (FR)"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={q.text_en}
                      onChange={(e) => updateQuestion(i, "text_en", e.target.value)}
                      placeholder="Question (EN)"
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {form.id ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
