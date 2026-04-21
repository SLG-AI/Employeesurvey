"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Users } from "lucide-react";

type Recipient = {
  token_id: string;
  employee_name: string | null;
  email: string | null;
  has_teams: boolean;
  invitation_sent_at: string | null;
  teams_invitation_sent_at: string | null;
  responded: boolean;
};

type Filter =
  | "all"
  | "non_responders"
  | "never_invited"
  | "responded";

type Props = {
  surveyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: string[];
  onConfirm: (tokenIds: string[]) => void;
};

export function ManualRecipientPicker({
  surveyId,
  open,
  onOpenChange,
  selected,
  onConfirm,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [all, setAll] = useState<Recipient[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [chosen, setChosen] = useState<Set<string>>(new Set(selected));

  useEffect(() => {
    if (!open) return;
    setChosen(new Set(selected));
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/surveys/${surveyId}/preview-recipients`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              mode: "all",
              channels: ["email", "teams"],
              limit: 5000,
            }),
          }
        );
        if (cancelled) return;
        if (!res.ok) {
          setAll([]);
          setTruncated(false);
          return;
        }
        const data = await res.json();
        setAll(data.recipients ?? []);
        setTruncated(data.truncated ?? false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, surveyId, selected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((r) => {
      if (q) {
        const haystack = `${r.employee_name ?? ""} ${r.email ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filter === "non_responders") {
        if (r.responded) return false;
        if (!r.invitation_sent_at && !r.teams_invitation_sent_at) return false;
      } else if (filter === "never_invited") {
        if (r.invitation_sent_at || r.teams_invitation_sent_at) return false;
      } else if (filter === "responded") {
        if (!r.responded) return false;
      }
      return true;
    });
  }, [all, search, filter]);

  const toggle = useCallback((id: string) => {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => chosen.has(r.token_id));

  const toggleAllFiltered = () => {
    setChosen((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((r) => next.delete(r.token_id));
      } else {
        filtered.forEach((r) => next.add(r.token_id));
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sélectionner les destinataires
          </DialogTitle>
          <DialogDescription>
            Choisissez exactement les personnes à qui envoyer. La liste affiche
            tous les employés du sondage.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 border-y py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher nom ou email…"
                className="pl-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="filter" className="text-xs">
                Filtre
              </Label>
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as Filter)}
              >
                <SelectTrigger id="filter" className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="non_responders">
                    Invités mais pas de réponse
                  </SelectItem>
                  <SelectItem value="never_invited">Jamais invités</SelectItem>
                  <SelectItem value="responded">Ont répondu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={toggleAllFiltered}
              className="text-primary hover:underline"
            >
              {allFilteredSelected
                ? `Désélectionner les ${filtered.length} affichés`
                : `Sélectionner les ${filtered.length} affichés`}
            </button>
            <Badge variant="secondary">
              {chosen.size} sélectionné(s) / {all.length}
            </Badge>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucun employé ne correspond.
            </p>
          ) : (
            <ul className="divide-y">
              {filtered.map((r) => (
                <li
                  key={r.token_id}
                  className="flex items-center gap-3 px-1 py-2"
                >
                  <Checkbox
                    checked={chosen.has(r.token_id)}
                    onCheckedChange={() => toggle(r.token_id)}
                    id={`pick-${r.token_id}`}
                  />
                  <label
                    htmlFor={`pick-${r.token_id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {r.employee_name || "(sans nom)"}
                      </span>
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
                      {!r.invitation_sent_at && !r.teams_invitation_sent_at && (
                        <Badge variant="outline" className="text-xs">
                          Pas encore invité
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.email || "(pas d'email)"}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {truncated && (
            <p className="mt-2 text-xs text-amber-700">
              Liste tronquée à 5000 entrées. Précisez la recherche pour affiner.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={() => onConfirm(Array.from(chosen))}>
            Valider ({chosen.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
