// Netlify Background Function: processes a Teams send job out-of-band.
//
// The "-background" suffix makes Netlify run this asynchronously (it replies
// 202 immediately and allows up to ~15 minutes of execution), which removes the
// serverless request-timeout ceiling that capped large Teams distributions.
//
// All the real work lives in the shared module so it stays identical to the
// inline fallback path used in local dev. That module uses relative imports
// only, so esbuild can bundle it here outside the Next.js build.

import { processTeamsJob } from "../../src/lib/teams/send-job";

const handler = async (req: Request): Promise<Response> => {
  const secret = process.env.TEAMS_WORKER_SECRET;
  if (secret && req.headers.get("x-teams-worker-secret") !== secret) {
    return new Response("Forbidden", { status: 403 });
  }

  let jobId: string | undefined;
  try {
    const body = (await req.json()) as { jobId?: string };
    jobId = body.jobId;
  } catch {
    return new Response("Invalid body", { status: 400 });
  }

  if (!jobId) return new Response("Missing jobId", { status: 400 });

  // processTeamsJob records its own success/error state on the job row; we don't
  // throw so Netlify doesn't retry a half-completed send.
  await processTeamsJob(jobId);

  return new Response("ok");
};

export default handler;
