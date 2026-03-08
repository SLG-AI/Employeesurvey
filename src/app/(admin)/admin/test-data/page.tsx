"use client";

import { useEffect, useState } from "react";
import {
  FlaskConical,
  Play,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getPublishedSurveys,
  generateTestResponses,
  purgeResponses,
  closeSurvey,
  type PublishedSurveyInfo,
  type ResponseProfile,
  type GenerationResult,
} from "./actions";

const PROFILE_OPTIONS: { value: ResponseProfile; label: string; description: string }[] = [
  { value: "positive", label: "Positif", description: "Scores eleves (60% top, 30% milieu, 10% bas)" },
  { value: "negative", label: "Negatif", description: "Scores bas (60% bas, 30% milieu, 10% haut)" },
  { value: "neutral", label: "Neutre", description: "Scores centres (70% milieu, 15% extremes)" },
  { value: "random", label: "Aleatoire", description: "Distribution uniforme sur toute l'echelle" },
  { value: "mixed", label: "Mixte", description: "Chaque repondant a un profil aleatoire (positif, negatif ou neutre)" },
];

export default function TestDataPage() {
  const [surveys, setSurveys] = useState<PublishedSurveyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<string | null>(null);
  const [count, setCount] = useState(20);
  const [profile, setProfile] = useState<ResponseProfile>("mixed");
  const [generating, setGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<GenerationResult | null>(null);
  const [purging, setPurging] = useState<string | null>(null);
  const [purgeConfirmId, setPurgeConfirmId] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);
  const [closeConfirmId, setCloseConfirmId] = useState<string | null>(null);

  const loadSurveys = () => {
    setLoading(true);
    getPublishedSurveys()
      .then(setSurveys)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  const selected = surveys.find((s) => s.id === selectedSurvey);

  const maxCount =
    selected?.distribution_mode === "token"
      ? selected.available_tokens
      : 500;

  const handleGenerate = async () => {
    if (!selectedSurvey) return;
    setGenerating(true);
    setLastResult(null);
    try {
      const result = await generateTestResponses(selectedSurvey, count, profile);
      setLastResult(result);
      loadSurveys(); // Refresh counts
    } finally {
      setGenerating(false);
    }
  };

  const handlePurge = async (surveyId: string) => {
    setPurging(surveyId);
    setPurgeConfirmId(null);
    try {
      await purgeResponses(surveyId);
      loadSurveys();
    } finally {
      setPurging(null);
    }
  };

  const handleClose = async (surveyId: string) => {
    setClosing(surveyId);
    setCloseConfirmId(null);
    try {
      await closeSurvey(surveyId);
      loadSurveys();
    } finally {
      setClosing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FlaskConical className="h-6 w-6" />
          Donnees de test
        </h1>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-24 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FlaskConical className="h-6 w-6" />
          Donnees de test
        </h1>
        <Button variant="outline" size="sm" onClick={loadSurveys}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Generez des reponses fictives pour tester la visualisation des resultats.
        Selectionnez un sondage publie, configurez le profil de reponse et le nombre souhaite.
      </p>

      {surveys.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucun sondage publie trouve.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Publiez d&apos;abord un sondage depuis le backoffice.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Survey list */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Sondages publies</h2>
            {surveys.map((survey) => (
              <Card
                key={survey.id}
                className={`cursor-pointer transition-all ${
                  selectedSurvey === survey.id
                    ? "ring-2 ring-primary"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => {
                  setSelectedSurvey(survey.id);
                  setLastResult(null);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{survey.title_fr}</h3>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {survey.distribution_mode === "token" ? "Token" : "Open"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {survey.tenant_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                      <div className="flex items-center gap-1" title="Questions">
                        <MessageSquare className="h-3 w-3" />
                        {survey.question_count}
                      </div>
                      {survey.distribution_mode === "token" && (
                        <div className="flex items-center gap-1" title="Tokens disponibles">
                          <Users className="h-3 w-3" />
                          {survey.available_tokens}/{survey.total_tokens}
                        </div>
                      )}
                      <div className="flex items-center gap-1" title="Reponses existantes">
                        <BarChart3 className="h-3 w-3" />
                        {survey.existing_responses}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-orange-600 hover:text-orange-700"
                        title="Cloturer le sondage"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCloseConfirmId(survey.id);
                        }}
                        disabled={closing === survey.id}
                      >
                        {closing === survey.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Lock className="h-3 w-3" />
                        )}
                      </Button>
                      {survey.existing_responses > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          title="Purger les reponses"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPurgeConfirmId(survey.id);
                          }}
                          disabled={purging === survey.id}
                        >
                          {purging === survey.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Config panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selected ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Selectionnez un sondage
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Nombre de reponses</Label>
                      <Input
                        type="number"
                        min={1}
                        max={maxCount}
                        value={count}
                        onChange={(e) => setCount(Math.max(1, Math.min(maxCount, parseInt(e.target.value) || 1)))}
                      />
                      {selected.distribution_mode === "token" && (
                        <p className="text-xs text-muted-foreground">
                          Max: {selected.available_tokens} tokens disponibles
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Profil de reponse</Label>
                      <Select
                        value={profile}
                        onValueChange={(v) => setProfile(v as ResponseProfile)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROFILE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div>
                                <span className="font-medium">{opt.label}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {opt.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleGenerate}
                      disabled={generating || (selected.distribution_mode === "token" && selected.available_tokens === 0)}
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generation en cours...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Generer {count} reponse{count > 1 ? "s" : ""}
                        </>
                      )}
                    </Button>

                    {selected.distribution_mode === "token" && selected.available_tokens === 0 && (
                      <p className="text-xs text-destructive text-center">
                        Tous les tokens ont deja repondu. Purgez les reponses pour regenerer.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            {lastResult && (
              <Card className={lastResult.success ? "border-green-200" : "border-red-200"}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {lastResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    Resultat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reponses creees</span>
                    <span className="font-medium">{lastResult.created}</span>
                  </div>
                  {lastResult.skipped > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ignorees (pas de token)</span>
                      <span className="font-medium">{lastResult.skipped}</span>
                    </div>
                  )}
                  {lastResult.summary.likert_avg != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Moyenne Likert</span>
                      <span className="font-medium">{lastResult.summary.likert_avg}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Questions choix</span>
                    <span className="font-medium">{lastResult.summary.choice_questions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Questions texte libre</span>
                    <span className="font-medium">{lastResult.summary.free_text_questions}</span>
                  </div>
                  {lastResult.errors.length > 0 && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700 space-y-1">
                      {lastResult.errors.map((err, i) => (
                        <p key={i}>{err}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Close confirmation dialog */}
      <Dialog open={!!closeConfirmId} onOpenChange={() => setCloseConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cloturer le sondage</DialogTitle>
            <DialogDescription>
              Cette action cloturera le sondage de maniere anticipee. Il ne sera plus possible d&apos;y repondre.
              Le matching des benchmarks sera lance automatiquement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseConfirmId(null)}>
              Annuler
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => closeConfirmId && handleClose(closeConfirmId)}
            >
              <Lock className="h-4 w-4 mr-2" />
              Cloturer maintenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purge confirmation dialog */}
      <Dialog open={!!purgeConfirmId} onOpenChange={() => setPurgeConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purger les reponses</DialogTitle>
            <DialogDescription>
              Cette action supprimera toutes les reponses de ce sondage (y compris les reponses reelles).
              Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurgeConfirmId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => purgeConfirmId && handlePurge(purgeConfirmId)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer toutes les reponses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
