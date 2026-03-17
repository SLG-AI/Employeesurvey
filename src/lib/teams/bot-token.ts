let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get an access token for the bot to send messages.
 * Caches the token until it expires.
 */
export default async function getBotToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const response = await fetch(
    "https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.TEAMS_BOT_APP_ID!,
        client_secret: process.env.TEAMS_BOT_APP_SECRET!,
        scope: "https://api.botframework.com/.default",
      }).toString(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Bot token error: ${error}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };

  return cachedToken.token;
}
