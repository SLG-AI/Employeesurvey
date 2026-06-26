"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { OnboardingGuide } from "./_components/onboarding-guide";
import {
  contentOrDefault,
  type OnboardingContent,
} from "@/lib/onboarding/content";
import type { OnboardingState } from "@/lib/onboarding/schema";

type LoadState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      initialState: OnboardingState;
      content: OnboardingContent;
    };

export default function PublicOnboardingPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const [load, setLoad] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/onboarding/public/${slug}`, {
          cache: "no-store",
        });
        if (cancelled) return;
        if (res.status === 404) {
          setLoad({ status: "not_found" });
          return;
        }
        if (!res.ok) {
          setLoad({ status: "error", message: `HTTP ${res.status}` });
          return;
        }
        const body = await res.json();
        const raw = body.onboarding?.state ?? {};
        const initialState: OnboardingState = {
          lang: raw.lang === "en" ? ("en" as const) : ("fr" as const),
          // Keep only string ids — drops any legacy numeric indices rather than
          // mis-applying them against the new id-based model.
          checked: Array.isArray(raw.checked)
            ? raw.checked.filter((x: unknown) => typeof x === "string")
            : [],
          health:
            raw.health && typeof raw.health === "object"
              ? { ...raw.health }
              : {},
          rows: raw.rows && typeof raw.rows === "object" ? { ...raw.rows } : {},
        };
        const content = contentOrDefault(body.onboarding?.content);
        setLoad({ status: "ready", initialState, content });
      } catch (e) {
        if (!cancelled)
          setLoad({
            status: "error",
            message: e instanceof Error ? e.message : "unknown",
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (load.status === "loading") {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui" }}>Chargement…</div>
    );
  }
  if (load.status === "not_found") {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui" }}>
        <h1>Onboarding introuvable</h1>
        <p>Ce lien n&apos;existe pas ou a été archivé.</p>
      </div>
    );
  }
  if (load.status === "error") {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui" }}>
        <h1>Erreur</h1>
        <p>{load.message}</p>
      </div>
    );
  }

  return (
    <OnboardingGuide
      slug={slug}
      initialState={load.initialState}
      content={load.content}
    />
  );
}
