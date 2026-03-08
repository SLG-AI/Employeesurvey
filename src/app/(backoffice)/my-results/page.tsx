"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye } from "lucide-react";
import Link from "next/link";

type SurveyInfo = {
  id: string;
  title_fr: string;
  status: string;
  published_at: string | null;
  closed_at: string | null;
  societe_id: string | null;
  societe: { id: string; name: string } | null;
};

export default function MyResultsPage() {
  const supabase = createClient();
  const [surveys, setSurveys] = useState<SurveyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSociete, setFilterSociete] = useState<string>("all");

  const loadSurveys = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from("surveys")
      .select("id, title_fr, status, published_at, closed_at, societe_id, societe:organizations!societe_id(id, name)")
      .eq("status", "closed")
      .order("published_at", { ascending: false });

    setSurveys((data as unknown as SurveyInfo[]) || []);
    setLoading(false);
  }, [supabase]);

  const societes = [
    ...new Map(
      surveys
        .filter((s) => s.societe)
        .map((s) => [s.societe!.id, s.societe!])
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const filteredSurveys = surveys.filter((s) => {
    if (filterSociete !== "all" && s.societe?.id !== filterSociete) return false;
    return true;
  });

  useEffect(() => {
    loadSurveys();
  }, [loadSurveys]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mes résultats</h1>
        <p className="text-muted-foreground">
          Consultez les résultats des sondages pour votre périmètre. Les
          résultats sont filtrés selon vos unités organisationnelles assignées.
        </p>
      </div>

      {!loading && societes.length > 1 && (
        <div className="flex gap-4">
          <Select value={filterSociete} onValueChange={setFilterSociete}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Societe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les societes</SelectItem>
              {societes.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : filteredSurveys.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucun sondage clôturé pour le moment.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredSurveys.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{s.title_fr}</CardTitle>
                  <Badge
                    variant={s.status === "published" ? "default" : "outline"}
                  >
                    {s.status === "published" ? "En cours" : "Clôturé"}
                  </Badge>
                </div>
                <CardDescription>
                  {s.societe?.name && <span>{s.societe.name} · </span>}
                  {s.closed_at
                    ? <>Clôturé le {new Date(s.closed_at).toLocaleDateString("fr-FR")}</>
                    : s.published_at && <>Publié le {new Date(s.published_at).toLocaleDateString("fr-FR")}</>
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/surveys/${s.id}/results`}>
                  <Button variant="outline" className="w-full">
                    <Eye className="mr-2 h-4 w-4" />
                    Voir les résultats
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
