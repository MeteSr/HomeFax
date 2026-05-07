/**
 * Honeywell Home / Resideo OAuth device picker — used by the RegisterDeviceModal popup flow.
 */

const HONEYWELL_API = "https://api.honeywell.com";

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
  return `${HONEYWELL_API}/oauth2/authorize?${params}`;
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

  const resp = await fetch(`${HONEYWELL_API}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: body.toString(),
  });
  if (!resp.ok) throw new Error(`Honeywell token exchange failed (${resp.status}): ${await resp.text()}`);

  const data = await resp.json() as { access_token: string };
  return data.access_token;
}

export async function fetchDevices(accessToken: string, clientId: string): Promise<OAuthDevice[]> {
  const resp = await fetch(`${HONEYWELL_API}/v2/devices/thermostats?apikey=${encodeURIComponent(clientId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) throw new Error(`Honeywell device list failed (${resp.status})`);

  const data = await resp.json() as Array<{ deviceID: string; userDefinedDeviceName: string; deviceType?: string }>;
  return (Array.isArray(data) ? data : []).map((d) => ({
    id:   d.deviceID,
    name: d.userDefinedDeviceName || d.deviceID,
    type: d.deviceType ?? "Thermostat",
  }));
}
