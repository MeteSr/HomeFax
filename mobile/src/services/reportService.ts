export const HOMEFAX_WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL ?? "https://homefax.app";

export function buildReportUrl(token: string): string {
  return `${HOMEFAX_WEB_URL.replace(/\/$/, "")}/report/${token}`;
}
