/**
 * LG ThinQ OAuth device picker — used by the RegisterDeviceModal popup flow.
 *
 * Uses LG's official ThinQ API v2 (OAuth 2.0 authorization code flow).
 * API base URL is region-specific; defaults to US.
 */

const LG_API_BASE = process.env.LG_THINQ_API_BASE ?? "https://us.api.lgthinq.com:46030";

export interface OAuthDevice {
  id:   string;
  name: string;
  type: string;
}

export function authUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id:     clientId,
    redirect_uri:  redirectUri,
    scope:         "monitoring",
  });
  return `${LG_API_BASE}/oauth/authorize?${params}`;
}

export async function exchangeCode(
  code:         string,
  clientId:     string,
  clientSecret: string,
  redirectUri:  string,
): Promise<string> {
  const body = new URLSearchParams({
    grant_type:    "authorization_code",
    code,
    redirect_uri:  redirectUri,
    client_id:     clientId,
    client_secret: clientSecret,
  });

  const resp = await fetch(`${LG_API_BASE}/oauth/token`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    body.toString(),
  });
  if (!resp.ok) throw new Error(`LG ThinQ token exchange failed (${resp.status}): ${await resp.text()}`);

  const data = await resp.json() as { access_token: string };
  return data.access_token;
}

export async function fetchDevices(accessToken: string): Promise<OAuthDevice[]> {
  const resp = await fetch(`${LG_API_BASE}/devices`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-country-code": "US",
      "x-language-code": "en-US",
    },
  });
  if (!resp.ok) throw new Error(`LG ThinQ device list failed (${resp.status})`);

  const data = await resp.json() as {
    result?: Array<{ deviceId: string; alias: string; deviceType?: string }>
  };
  return (data.result ?? []).map((d) => ({
    id:   d.deviceId,
    name: d.alias || d.deviceId,
    type: d.deviceType ?? "Appliance",
  }));
}
