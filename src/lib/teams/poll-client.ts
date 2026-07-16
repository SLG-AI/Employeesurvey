// Client-side helper to poll a Teams send job until it reaches a terminal state.
// Browser-safe: only uses fetch.

export type TeamsJobStatus = {
  status: "queued" | "running" | "done" | "error" | "timeout";
  total: number;
  sent: number;
  failed: number;
  notInstalled: number;
  errorMessage?: string | null;
};

export async function pollTeamsJob(
  surveyId: string,
  jobId: string,
  onProgress?: (s: TeamsJobStatus) => void,
  opts?: { intervalMs?: number; timeoutMs?: number }
): Promise<TeamsJobStatus> {
  const intervalMs = opts?.intervalMs ?? 2000;
  const timeoutMs = opts?.timeoutMs ?? 14 * 60 * 1000;
  const start = Date.now();

  for (;;) {
    try {
      const res = await fetch(
        `/api/surveys/${surveyId}/teams-send-status?jobId=${jobId}`
      );
      if (res.ok) {
        const s = (await res.json()) as TeamsJobStatus;
        onProgress?.(s);
        if (s.status === "done" || s.status === "error") return s;
      }
    } catch {
      // transient network error — keep polling until the timeout
    }

    if (Date.now() - start > timeoutMs) {
      return {
        status: "timeout",
        total: 0,
        sent: 0,
        failed: 0,
        notInstalled: 0,
      };
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
