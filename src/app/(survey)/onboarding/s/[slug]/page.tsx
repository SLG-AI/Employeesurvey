"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { OnboardingGuide } from "./_components/onboarding-guide";

type LoadState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      initialState: {
        lang: "fr" | "en";
        checked: number[];
        health: Record<string, number>;
        rows: Record<string, string[][]>;
      };
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
        const initialState = {
          lang: raw.lang === "en" ? ("en" as const) : ("fr" as const),
          checked: Array.isArray(raw.checked) ? raw.checked : [],
          health:
            raw.health && typeof raw.health === "object"
              ? { ...raw.health }
              : {},
          rows: raw.rows && typeof raw.rows === "object" ? { ...raw.rows } : {},
        };
        setLoad({ status: "ready", initialState });
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

  return <OnboardingGuide slug={slug} initialState={load.initialState} />;
}
