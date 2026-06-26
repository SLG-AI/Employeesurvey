"use client";

import { forwardRef, memo, useEffect, useMemo, useRef, useState } from "react";
import { GUIDE_SHELL } from "./template";
import {
  buildGuideHtml,
  type OnboardingContent,
} from "@/lib/onboarding/content";
import type { OnboardingState } from "@/lib/onboarding/schema";

// The __html object identity must stay stable across re-renders, or React will
// re-apply innerHTML and wipe the classList mutations (checked, selected, etc.)
// our event delegation makes in place. We memoize it from `content`, which is
// fixed for the lifetime of the public guide.
const TemplateHost = memo(
  forwardRef<HTMLDivElement, { htmlProp: { __html: string } }>(
    function TemplateHost({ htmlProp }, ref) {
      return <div ref={ref} dangerouslySetInnerHTML={htmlProp} />;
    }
  )
);

type Props = {
  slug: string;
  initialState: OnboardingState;
  content: OnboardingContent;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

// Cards that contribute to progress (same list as the original template script)
const CARDS = [
  "0-0",
  "0-1",
  "1-0",
  "1-1",
  "2-0",
  "2-1",
  "2-2",
  "2-3",
  "3-0",
  "3-1",
  "4-0",
  "4-1",
  "4-2",
];

const ROW_TBODIES = ["body-internal", "body-external"];

function createRowHtml(tbodyId: string, isExternal: boolean): string {
  const placeholder = isExternal ? "Nom / Organisation" : "Nom / Fonction";
  return (
    '<td class="input-cell"><input type="text" placeholder="' +
    placeholder +
    '"/></td>' +
    '<td class="health-cell"><div class="health-picker">' +
    '<button type="button" class="health-btn green" title="Bonne">\u{1F7E2}</button>' +
    '<button type="button" class="health-btn yellow" title="Attention">\u{1F7E1}</button>' +
    '<button type="button" class="health-btn red" title="Difficile">\u{1F534}</button>' +
    "</div></td>" +
    '<td class="input-cell"><textarea rows="2" placeholder="Ce que le manager attend…"></textarea></td>' +
    '<td class="input-cell"><textarea rows="2" placeholder="Ce qu’ils attendent…"></textarea></td>' +
    '<td><button class="del-btn" type="button">✕</button></td>'
  );
}

function applyLang(root: HTMLElement, lang: "fr" | "en") {
  root.querySelectorAll<HTMLElement>("[data-fr]").forEach((el) => {
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return;
    const v = el.getAttribute("data-" + lang);
    if (v !== null) el.textContent = v;
  });
  const btnFr = root.querySelector<HTMLElement>("#btn-fr");
  const btnEn = root.querySelector<HTMLElement>("#btn-en");
  btnFr?.classList.toggle("active", lang === "fr");
  btnEn?.classList.toggle("active", lang === "en");
}

function updateAll(root: HTMLElement, lang: "fr" | "en") {
  // CSS combinators bind tighter than commas, so "#a,#b .x" means "(#a),(#b .x)".
  // We have to repeat the descendant for each phase id.
  const phaseIds = ["#phase-0", "#phase-1", "#phase-2", "#phase-3", "#phase-4"];
  const allSelector = phaseIds.map((id) => `${id} .check-item`).join(",");
  const doneSelector = phaseIds
    .map((id) => `${id} .check-item.checked`)
    .join(",");
  const all = root.querySelectorAll(allSelector);
  const done = root.querySelectorAll(doneSelector);
  const total = all.length;
  const doneCount = done.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const pbar = root.querySelector<HTMLElement>("#pbar");
  if (pbar) pbar.style.width = pct + "%";
  const label = root.querySelector<HTMLElement>("#pct-label");
  if (label) {
    label.textContent =
      lang === "fr"
        ? doneCount + " / " + total + " tâches complétées"
        : doneCount + " / " + total + " tasks completed";
  }
  [0, 1, 2, 3, 4].forEach((p) => {
    const panel = root.querySelector(`#phase-${p}`);
    if (!panel) return;
    const pItems = panel.querySelectorAll(".check-item");
    const pDone = panel.querySelectorAll(".check-item.checked");
    const pill = root.querySelector(`#pill-${p}`);
    if (pill) {
      pill.classList.toggle(
        "complete",
        pItems.length > 0 && pDone.length === pItems.length
      );
    }
  });
  CARDS.forEach((k) => {
    const card = root.querySelector(`#card-${k}`);
    if (!card) return;
    const items = card.querySelectorAll(".check-item");
    const d = card.querySelectorAll(".check-item.checked").length;
    const el = root.querySelector<HTMLElement>(`#cc-${k}`);
    if (!el) return;
    el.textContent = d + " / " + items.length;
    el.classList.toggle("done", d === items.length && items.length > 0);
  });
}

function readStateFromDom(
  root: HTMLElement,
  currentLang: "fr" | "en"
): OnboardingState {
  const checked: string[] = [];
  root.querySelectorAll<HTMLElement>(".check-item").forEach((el) => {
    if (el.classList.contains("checked")) {
      const id = el.dataset.itemId;
      if (id) checked.push(id);
    }
  });

  const health: Record<string, number> = {};
  root.querySelectorAll(".health-picker").forEach((picker, pi) => {
    picker.querySelectorAll(".health-btn").forEach((btn, bi) => {
      if (btn.classList.contains("selected")) health[String(pi)] = bi;
    });
  });

  const rows: Record<string, string[][]> = {};
  ROW_TBODIES.forEach((id) => {
    const tbody = root.querySelector(`#${id}`);
    if (!tbody) return;
    const rowsArr: string[][] = [];
    tbody.querySelectorAll("tr").forEach((tr) => {
      const cells: string[] = [];
      tr.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input,textarea"
      ).forEach((inp) => {
        cells.push(inp.value);
      });
      rowsArr.push(cells);
    });
    rows[id] = rowsArr;
  });

  return { lang: currentLang, checked, health, rows };
}

function applyState(root: HTMLElement, state: OnboardingState) {
  // Rows first (they affect check-item indices? no — they don't contain check-items).
  Object.keys(state.rows ?? {}).forEach((id) => {
    if (!ROW_TBODIES.includes(id)) return;
    const tbody = root.querySelector(`#${id}`);
    if (!tbody) return;
    const saved = state.rows[id] ?? [];
    const existingRows = Array.from(tbody.querySelectorAll("tr"));
    saved.forEach((cells, ri) => {
      let tr = existingRows[ri];
      if (!tr) {
        tr = document.createElement("tr");
        tr.innerHTML = createRowHtml(id, id === "body-external");
        tbody.appendChild(tr);
      }
      const inputs = tr.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input,textarea"
      );
      cells.forEach((v, ci) => {
        if (inputs[ci]) inputs[ci].value = v;
      });
    });
  });

  // Checked items — matched by stable id. Orphan ids (from deleted questions)
  // simply match nothing, which is safe.
  (state.checked ?? []).forEach((id) => {
    root
      .querySelector(`.check-item[data-item-id="${CSS.escape(id)}"]`)
      ?.classList.add("checked");
  });

  // Health picks
  const pickers = root.querySelectorAll(".health-picker");
  Object.keys(state.health ?? {}).forEach((pi) => {
    const picker = pickers[Number(pi)];
    if (!picker) return;
    const btns = picker.querySelectorAll(".health-btn");
    const bi = state.health[pi];
    if (btns[bi]) {
      btns.forEach((b) => b.classList.remove("selected"));
      btns[bi].classList.add("selected");
    }
  });

  // Language
  const lang = state.lang ?? "fr";
  applyLang(root, lang);
  updateAll(root, lang);
}

export function OnboardingGuide({ slug, initialState, content }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const langRef = useRef<"fr" | "en">(initialState.lang ?? "fr");
  const html = useMemo(() => buildGuideHtml(GUIDE_SHELL, content), [content]);
  const htmlProp = useMemo(() => ({ __html: html }), [html]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSaveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    applyState(root, initialState);

    const scheduleSave = () => {
      setSaveStatus("saving");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          const state = readStateFromDom(root, langRef.current);
          const res = await fetch(`/api/onboarding/public/${slug}`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(state),
          });
          setSaveStatus(res.ok ? "saved" : "error");
        } catch {
          setSaveStatus("error");
        }
      }, 800);
    };
    scheduleSaveRef.current = scheduleSave;

    const onClick = (ev: Event) => {
      const target = ev.target as HTMLElement;
      if (!target) return;

      // Language toggle
      const langBtn = target.closest<HTMLElement>(".lang-btn");
      if (langBtn) {
        const lang = langBtn.id === "btn-en" ? "en" : "fr";
        langRef.current = lang;
        applyLang(root, lang);
        updateAll(root, lang);
        scheduleSave();
        return;
      }

      // Tab switch
      const tabBtn = target.closest<HTMLElement>(".tab-btn");
      if (tabBtn) {
        const tabs = Array.from(root.querySelectorAll(".tab-btn"));
        const idx = tabs.indexOf(tabBtn);
        if (idx >= 0) {
          root
            .querySelectorAll(".phase-panel")
            .forEach((p, i) => p.classList.toggle("active", i === idx));
          tabs.forEach((t, i) => t.classList.toggle("active", i === idx));
        }
        return;
      }

      // Delete stakeholder row
      const delBtn = target.closest<HTMLElement>(".del-btn");
      if (delBtn) {
        const tr = delBtn.closest("tr");
        if (tr) {
          tr.remove();
          scheduleSave();
        }
        return;
      }

      // Add stakeholder row
      const addBtn = target.closest<HTMLElement>(".add-row-btn");
      if (addBtn) {
        // Derive which tbody to target from the parent stk-card containing the table
        const card = addBtn.closest(".stk-card");
        const tbody = card?.querySelector("tbody");
        if (tbody?.id && ROW_TBODIES.includes(tbody.id)) {
          const tr = document.createElement("tr");
          tr.innerHTML = createRowHtml(tbody.id, tbody.id === "body-external");
          tbody.appendChild(tr);
          scheduleSave();
        }
        return;
      }

      // Health picker
      const healthBtn = target.closest<HTMLElement>(".health-btn");
      if (healthBtn) {
        const picker = healthBtn.closest(".health-picker");
        picker
          ?.querySelectorAll(".health-btn")
          .forEach((b) => b.classList.remove("selected"));
        healthBtn.classList.add("selected");
        scheduleSave();
        return;
      }

      // Checklist item toggle
      const checkItem = target.closest<HTMLElement>(".check-item");
      if (checkItem) {
        checkItem.classList.toggle("checked");
        updateAll(root, langRef.current);
        scheduleSave();
        return;
      }
    };

    const onInput = (ev: Event) => {
      const tag = (ev.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") {
        scheduleSave();
      }
    };

    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);

    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("input", onInput);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return (
    <div>
      <div
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 1000,
          padding: "6px 12px",
          borderRadius: 99,
          fontSize: 12,
          fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
          background:
            saveStatus === "error"
              ? "#fee2e2"
              : saveStatus === "saving"
                ? "#fef9c3"
                : saveStatus === "saved"
                  ? "#dcfce7"
                  : "transparent",
          color:
            saveStatus === "error"
              ? "#991b1b"
              : saveStatus === "saving"
                ? "#92400e"
                : saveStatus === "saved"
                  ? "#166534"
                  : "#555",
          border: "1px solid rgba(0,0,0,0.08)",
          transition: "all 0.2s",
          opacity: saveStatus === "idle" ? 0 : 1,
          pointerEvents: "none",
        }}
      >
        {saveStatus === "saving"
          ? "Sauvegarde…"
          : saveStatus === "saved"
            ? "Enregistré"
            : saveStatus === "error"
              ? "Erreur"
              : ""}
      </div>
      <TemplateHost ref={rootRef} htmlProp={htmlProp} />
    </div>
  );
}
