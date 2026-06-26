"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Copy,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Onboarding } from "@/lib/types";
import { CreateOnboardingDialog } from "./_components/create-onboarding-dialog";

type Filter = "active" | "archived" | "all";

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();
  const [items, setItems] = useState<Onboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("active");
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    let query = supabase
      .from("onboardings")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter === "active") query = query.is("archived_at", null);
    if (filter === "archived") query = query.not("archived_at", "is", null);

    const { data, error } = await query;
    if (error) {
      toast.error("Erreur lors du chargement");
    } else {
      setItems(data as Onboarding[]);
    }
    setLoading(false);
  }, [supabase, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/onboarding/s/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien copié");
  };

  const openLink = (slug: string) => {
    window.open(`/onboarding/s/${slug}`, "_blank");
  };

  const setArchived = async (id: string, archived: boolean) => {
    const res = await fetch(`/api/onboarding/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ archived }),
    });
    if (!res.ok) {
      toast.error("Erreur");
      return;
    }
    toast.success(archived ? "Archivé" : "Restauré");
    load();
  };

  const remove = async (id: string) => {
    if (
      !confirm(
        "Supprimer définitivement cet onboarding ? Le lien public ne fonctionnera plus."
      )
    )
      return;
    const res = await fetch(`/api/onboarding/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Erreur");
      return;
    }
    toast.success("Supprimé");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Onboarding</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Guides d&apos;intégration des nouveaux employés. Toute personne
            ayant le lien peut modifier la page.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel onboarding
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="archived">Archivés</SelectItem>
            <SelectItem value="all">Tous</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>ID employé</TableHead>
              <TableHead>Poste</TableHead>
              <TableHead>Date de début</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin inline" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  Aucun onboarding
                </TableCell>
              </TableRow>
            ) : (
              items.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">
                    {o.first_name} {o.last_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {o.employee_id}
                  </TableCell>
                  <TableCell>{o.job_title}</TableCell>
                  <TableCell>
                    {o.start_date
                      ? new Date(o.start_date).toLocaleDateString("fr-FR")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {o.archived_at ? (
                      <Badge variant="outline">Archivé</Badge>
                    ) : (
                      <Badge>Actif</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyLink(o.slug)}
                        title="Copier le lien"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openLink(o.slug)}
                        title="Ouvrir"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/onboarding/${o.id}/edit`)
                            }
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier le questionnaire
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {o.archived_at ? (
                            <DropdownMenuItem
                              onClick={() => setArchived(o.id, false)}
                            >
                              <ArchiveRestore className="mr-2 h-4 w-4" />
                              Restaurer
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => setArchived(o.id, true)}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archiver
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => remove(o.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateOnboardingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={load}
      />
    </div>
  );
}
