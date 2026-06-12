"use client";

import { useEffect, useState } from "react";

/**
 * Personal Teams tab entry point.
 *
 * Activity-feed notifications can only deep-link to a Teams surface (not a raw
 * external URL). This tab is that surface: it reads the target survey from the
 * Teams deep-link context (subEntityId / subPageId) and navigates to it, so the
 * survey renders inside Teams. Reachable for 100% of users (the app is
 * pre-installed for everyone), with no bot interaction required.
 */
export default function TeamsTabPage() {
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { app } = await import("@microsoft/teams-js");
        await app.initialize();
        const ctx = await app.getContext();

        // Deep-link payload set in the notification (key "subEntityId" in the
        // deep link; surfaced as page.subPageId by teams-js v2).
        const target =
          ctx.page?.subPageId || (ctx.page as { id?: string })?.id || "";

        // Only follow same-origin survey links (avoid open-redirect).
        if (target && target.startsWith(window.location.origin)) {
          window.location.replace(target);
          return;
        }

        if (!cancelled) setStatus("error");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {status === "loading" ? (
        <p>Ouverture de votre sondage…</p>
      ) : (
        <div>
          <p>Impossible d&apos;ouvrir le sondage automatiquement.</p>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>
            Veuillez utiliser le lien reçu par notification ou par e-mail.
          </p>
        </div>
      )}
    </main>
  );
}
