"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { INDUSTRIES } from "@/lib/industries";
import { COMPANY_SIZES } from "@/lib/company-sizes";

type ThemeScore = {
  theme_code: string;
  theme_label: string;
  survey_score: number;
  market_average: number;
  industry_average: number | null;
  size_average: number | null;
  combined_average: number | null;
  question_count: number;
};

type BenchmarkData = {
  available: boolean;
  message?: string;
  survey_title?: string;
  industry_code?: string | null;
  company_size?: string | null;
  global?: {
    survey_score: number;
    market_average: number;
  };
  themes?: ThemeScore[];
};

function DiffBadge({ diff }: { diff: number }) {
  if (diff > 0.3) {
    return (
      <Badge variant="default" className="bg-green-600 text-xs">
        <TrendingUp className="mr-1 h-3 w-3" />+{diff.toFixed(1)}
      </Badge>
    );
  }
  if (diff < -0.3) {
    return (
      <Badge variant="destructive" className="text-xs">
        <TrendingDown className="mr-1 h-3 w-3" />{diff.toFixed(1)}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs">
      <Minus className="mr-1 h-3 w-3" />{diff >= 0 ? "+" : ""}{diff.toFixed(1)}
    </Badge>
  );
}

function RadarCard({
  title,
  description,
  themes,
  referenceKey,
  referenceLabel,
  referenceColor,
}: {
  title: string;
  description?: string;
  themes: ThemeScore[];
  referenceKey: "market_average" | "industry_average" | "size_average" | "combined_average";
  referenceLabel: string;
  referenceColor: string;
}) {
  const filteredThemes = themes.filter(
    (t) => t[referenceKey] !== null && t[referenceKey] !== undefined
  );

  if (filteredThemes.length < 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Données insuffisantes pour afficher ce graphique.
            {referenceKey === "industry_average" && " Vérifiez que le secteur d'activité est défini pour la société."}
            {referenceKey === "size_average" && " Vérifiez que la taille d'entreprise est définie pour la société."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = filteredThemes.map((t) => ({
    theme: t.theme_label.length > 20 ? t.theme_label.substring(0, 18) + "…" : t.theme_label,
    fullLabel: t.theme_label,
    "Votre score": t.survey_score,
    [referenceLabel]: t[referenceKey] as number,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis
                dataKey="theme"
                tick={{ fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 10]}
                tick={{ fontSize: 10 }}
              />
              <Radar
                name="Votre score"
                dataKey="Votre score"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Radar
                name={referenceLabel}
                dataKey={referenceLabel}
                stroke={referenceColor}
                fill={referenceColor}
                fillOpacity={0.1}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function BenchmarkTab({ surveyId }: { surveyId: string }) {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBenchmarks = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/surveys/${surveyId}/benchmarks`);
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, [surveyId]);

  useEffect(() => {
    loadBenchmarks();
  }, [loadBenchmarks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.available) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {data?.message || "Benchmarks non disponibles."}
        </CardContent>
      </Card>
    );
  }

  const themes = data.themes || [];
  const industryLabel = data.industry_code
    ? INDUSTRIES.find((i) => i.code === data.industry_code)?.label_fr
    : null;
  const sizeLabel = data.company_size
    ? COMPANY_SIZES.find((s) => s.code === data.company_size)?.label_fr
    : null;

  return (
    <div className="space-y-6">
      {/* Global summary */}
      <Card>
        <CardHeader>
          <CardTitle>Score global</CardTitle>
          <CardDescription>
            Moyenne de tous les thèmes comparée au marché
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">
                {data.global?.survey_score}
              </p>
              <p className="text-sm text-muted-foreground">Votre score</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-muted-foreground">
                {data.global?.market_average}
              </p>
              <p className="text-sm text-muted-foreground">Moyenne marché</p>
            </div>
            <div className="text-center">
              <DiffBadge
                diff={
                  (data.global?.survey_score || 0) -
                  (data.global?.market_average || 0)
                }
              />
              <p className="text-sm text-muted-foreground mt-1">Écart</p>
            </div>
          </div>
          {(industryLabel || sizeLabel) && (
            <div className="flex justify-center gap-2 mt-4">
              {industryLabel && (
                <Badge variant="outline">{industryLabel}</Badge>
              )}
              {sizeLabel && <Badge variant="outline">{sizeLabel}</Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme detail table */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par thème</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {themes.map((t) => (
              <div
                key={t.theme_code}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{t.theme_label}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.question_count} question(s) mappée(s)
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">
                      {t.survey_score}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-muted-foreground">
                      {t.market_average}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Marché</p>
                  </div>
                  <DiffBadge diff={t.survey_score - t.market_average} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4 Radar charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <RadarCard
          title="vs Moyenne marché"
          description="Comparaison avec la moyenne globale du marché"
          themes={themes}
          referenceKey="market_average"
          referenceLabel="Moyenne marché"
          referenceColor="#6b7280"
        />
        <RadarCard
          title={`vs Secteur${industryLabel ? ` (${industryLabel})` : ""}`}
          description="Comparaison avec la moyenne de votre secteur d'activité"
          themes={themes}
          referenceKey="industry_average"
          referenceLabel="Moy. secteur"
          referenceColor="#ea580c"
        />
        <RadarCard
          title={`vs Taille${sizeLabel ? ` (${sizeLabel})` : ""}`}
          description="Comparaison avec la moyenne des entreprises de taille similaire"
          themes={themes}
          referenceKey="size_average"
          referenceLabel="Moy. taille"
          referenceColor="#9333ea"
        />
        <RadarCard
          title="vs Combiné (Secteur + Taille)"
          description="Moyenne combinée secteur et taille d'entreprise"
          themes={themes}
          referenceKey="combined_average"
          referenceLabel="Moy. combinée"
          referenceColor="#16a34a"
        />
      </div>
    </div>
  );
}
