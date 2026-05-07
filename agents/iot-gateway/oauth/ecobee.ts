/**
 * Ecobee OAuth device picker — used by the RegisterDeviceModal popup flow.
 *
 * Generates the authorization URL and exchanges the code for an access token,
 * then fetches the list of registered thermostats so the user can pick one.
 * This is a one-time discovery flow; it does NOT persist tokens for the poller.
 */

const ECOBEE_API = "https://api.ecobee.com";

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
    scope:         "SmartRead",
  });
  return `${ECOBEE_API}/authorize?${params}`;
}

export async function exchangeCode(
  code:        string,
  clientId:    string,
  redirectUri: string,
): Promise<string> {
  const url = `${ECOBEE_API}/token`
    + `?grant_type=authorization_code`
    + `&code=${encodeURIComponent(code)}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`
    + `&client_id=${encodeURIComponent(clientId)}`;

  const resp = await fetch(url, { method: "POST" });
  if (!resp.ok) throw new Error(`Ecobee token exchange failed (${resp.status}): ${await resp.text()}`);

  const data = await resp.json() as { access_token: string };
  return data.access_token;
}

export async function fetchDevices(accessToken: string): Promise<OAuthDevice[]> {
  const selection = encodeURIComponent(JSON.stringify({
    selection: { selectionType: "registered", selectionMatch: "", includeAlerts: false, includeRuntime: false },
  }));

  const resp = await fetch(`${ECOBEE_API}/1/thermostat?json=${selection}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) throw new Error(`Ecobee device list failed (${resp.status})`);

  const data = await resp.json() as { thermostatList: Array<{ identifier: string; name: string }> };
  return (data.thermostatList ?? []).map((t) => ({
    id:   t.identifier,
    name: t.name,
    type: "Thermostat",
  }));
}
