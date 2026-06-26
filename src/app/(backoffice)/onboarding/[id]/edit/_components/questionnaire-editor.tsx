"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CARD_IDS,
  CARD_META,
  PHASE_LABELS,
  OWNER_OPTIONS,
  OWNER_LABELS,
  type ChecklistItem,
  type ItemOwner,
  type OnboardingContent,
} from "@/lib/onboarding/content";

const MAX_ITEMS_PER_CARD = 30;

type Props = {
  id: string;
  fullName: string;
  jobTitle: string;
  initialContent: OnboardingContent;
};

function newItem(): ChecklistItem {
  return { id: crypto.randomUUID(), fr: "", en: "", owner: "rh" };
}

export function QuestionnaireEditor({
  id,
  fullName,
  jobTitle,
  initialContent,
}: Props) {
  const router = useRouter();
  const [content, setContent] = useState<OnboardingContent>(() =>
    structuredClone(initialContent)
  );
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Group cards by phase for display.
  const phases = useMemo(() => {
    const byPhase = new Map<number, string[]>();
    for (const cardId of CARD_IDS) {
      const p = CARD_META[cardId].phase;
      if (!byPhase.has(p)) byPhase.set(p, []);
      byPhase.get(p)!.push(cardId);
    }
    return [...byPhase.entries()].sort((a, b) => a[0] - b[0]);
  }, []);

  const totalItems = useMemo(
    () => Object.values(content).reduce((n, items) => n + items.length, 0),
    [content]
  );

  const updateItem = (
    cardId: string,
    itemId: string,
    patch: Partial<ChecklistItem>
  ) => {
    setContent((prev) => ({
      ...prev,
      [cardId]: (prev[cardId] ?? []).map((it) =>
        it.id === itemId ? { ...it, ...patch } : it
      ),
    }));
  };

  const removeItem = (cardId: string, itemId: string) => {
    setContent((prev) => ({
      ...prev,
      [cardId]: (prev[cardId] ?? []).filter((it) => it.id !== itemId),
    }));
  };

  const addItem = (cardId: string) => {
    setContent((prev) => {
      const items = prev[cardId] ?? [];
      if (items.length >= MAX_ITEMS_PER_CARD) {
        toast.error(`Maximum ${MAX_ITEMS_PER_CARD} questions par carte`);
        return prev;
      }
      return { ...prev, [cardId]: [...items, newItem()] };
    });
  };

  const onDragEnd = (cardId: string) => (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setContent((prev) => {
      const items = prev[cardId] ?? [];
      const from = items.findIndex((it) => it.id === active.id);
      const to = items.findIndex((it) => it.id === over.id);
      if (from < 0 || to < 0) return prev;
      return { ...prev, [cardId]: arrayMove(items, from, to) };
    });
  };

  const save = async () => {
    // Validate: every item needs both FR and EN.
    const invalid = Object.values(content)
      .flat()
      .filter((it) => !it.fr.trim() || !it.en.trim()).length;
    if (invalid > 0) {
      toast.error(
        `${invalid} question(s) incomplète(s) — le texte FR et EN sont requis`
      );
      return;
    }

    // Trim before sending.
    const payload: OnboardingContent = {};
    for (const cardId of CARD_IDS) {
      payload[cardId] = (content[cardId] ?? []).map((it) => ({
        id: it.id,
        owner: it.owner,
        fr: it.fr.trim(),
        en: it.en.trim(),
      }));
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/onboarding/${id}/content`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Erreur lors de l'enregistrement");
        return;
      }
      toast.success("Questionnaire enregistré");
      router.push("/onboarding");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-1"
            onClick={() => router.push("/onboarding")}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-semibold">Modifier le questionnaire</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {fullName ? `${fullName} · ` : ""}
            {jobTitle} — {totalItems} question{totalItems > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Adaptez les questions avant d&apos;envoyer le lien. Supprimer une
        question déjà cochée par la personne fait disparaître sa progression sur
        cette question.
      </p>

      <div className="space-y-8">
        {phases.map(([phase, cardIds]) => (
          <section key={phase} className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Phase {phase} · {PHASE_LABELS[phase]?.fr}
            </h2>

            {cardIds.map((cardId) => {
              const meta = CARD_META[cardId];
              const items = content[cardId] ?? [];
              return (
                <div key={cardId} className="rounded-lg border">
                  <div className="border-b bg-muted/40 px-4 py-2.5">
                    <div className="text-sm font-semibold">{meta.titleFr}</div>
                    <div className="text-xs text-muted-foreground">
                      {meta.sectionFr}
                    </div>
                  </div>

                  <div className="divide-y">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={onDragEnd(cardId)}
                    >
                      <SortableContext
                        items={items.map((it) => it.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {items.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-muted-foreground">
                            Aucune question dans cette carte.
                          </p>
                        ) : (
                          items.map((it) => (
                            <SortableRow
                              key={it.id}
                              item={it}
                              onChange={(patch) =>
                                updateItem(cardId, it.id, patch)
                              }
                              onRemove={() => removeItem(cardId, it.id)}
                            />
                          ))
                        )}
                      </SortableContext>
                    </DndContext>
                  </div>

                  <div className="border-t px-4 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addItem(cardId)}
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Ajouter une question
                    </Button>
                  </div>
                </div>
              );
            })}
          </section>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/onboarding")}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}

function SortableRow({
  item,
  onChange,
  onRemove,
}: {
  item: ChecklistItem;
  onChange: (patch: Partial<ChecklistItem>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 bg-background px-3 py-3"
    >
      <button
        type="button"
        className="mt-2 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Réordonner"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 space-y-2">
        <Input
          value={item.fr}
          onChange={(e) => onChange({ fr: e.target.value })}
          placeholder="Question (français)"
        />
        <Input
          value={item.en}
          onChange={(e) => onChange({ en: e.target.value })}
          placeholder="Question (English)"
        />
      </div>

      <Select
        value={item.owner}
        onValueChange={(v) => onChange({ owner: v as ItemOwner })}
      >
        <SelectTrigger className="w-28 shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OWNER_OPTIONS.map((o) => (
            <SelectItem key={o} value={o}>
              {OWNER_LABELS[o].fr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-destructive"
        onClick={onRemove}
        aria-label="Supprimer la question"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
