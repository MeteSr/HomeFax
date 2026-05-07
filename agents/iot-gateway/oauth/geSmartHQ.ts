/**
 * GE SmartHQ OAuth device picker — used by the RegisterDeviceModal popup flow.
 *
 * Reuses GE's OAuth flow (same credentials as the poller) but returns a device
 * list to the frontend popup instead of persisting tokens for background polling.
 */

const GE_AUTH_API    = "https://api.whrcloud.com";
const GE_ACCOUNT_API = "https://api.whrcloud.com";

export interface OAuthDevice {
  id:   string;
  name: string;
  type: string;
}

export function authUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    redirect_uri:  redirectUri,
    client_id:     clientId,
  });
  return `${GE_AUTH_API}/auth/authorize?${params}`;
}

export async function exchangeCode(
  code:         string,
  clientId:     string,
  clientSecret: string,
  redirectUri:  string,
): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type:   "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const resp = await fetch(`${GE_AUTH_API}/oauth/token`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: body.toString(),
  });
  if (!resp.ok) throw new Error(`GE SmartHQ token exchange failed (${resp.status}): ${await resp.text()}`);

  const data = await resp.json() as { access_token: string };
  return data.access_token;
}

export async function fetchDevices(accessToken: string): Promise<OAuthDevice[]> {
  const resp = await fetch(`${GE_ACCOUNT_API}/v1/appliance`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) throw new Error(`GE SmartHQ device list failed (${resp.status})`);

  const data = await resp.json() as { items?: Array<{ applianceId: string; applianceType?: string; nickName?: string }> };
  return (data.items ?? []).map((a) => ({
    id:   a.applianceId,
    name: a.nickName || a.applianceId,
    type: a.applianceType ?? "Appliance",
  }));
}
