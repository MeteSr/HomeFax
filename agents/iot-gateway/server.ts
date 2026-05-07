/**
 * HomeGentic IoT Gateway
 *
 * Node.js/Express bridge that receives webhooks from smart-home platforms and
 * forwards normalized sensor readings to the HomeGentic Sensor canister on ICP.
 *
 * Supported platforms:
 *   POST /webhooks/nest            — Google Nest (SDM API Pub/Sub push)
 *   POST /webhooks/ecobee          — Ecobee thermostat alerts
 *   POST /webhooks/moen-flo        — Moen Flo water-leak detection
 *   POST /webhooks/smartthings     — SmartThings capability events (+ CONFIRMATION lifecycle)
 *   GET  /oauth/callback/honeywell — Honeywell Home OAuth 2.0 callback (initial setup)
 *
 * Webhook authenticity:
 *   - Nest:     Validates the Google-Cloud-Token header against NEST_WEBHOOK_SECRET
 *   - Ecobee:   Validates X-Ecobee-Signature HMAC-SHA256 against ECOBEE_WEBHOOK_SECRET
 *   - Moen Flo: Validates X-Moen-Signature HMAC-SHA256 against MOEN_FLO_WEBHOOK_SECRET
 *
 * GET /health — returns gateway status and the service identity principal
 */

import "dotenv/config";
import crypto from "crypto";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { handleNestEvent, handleEcobeeEvent, handleMoenFloEvent, handleHoneywellHomeEvent, handleSmartThingsEvent } from "./handlers";
import { recordSensorEvent, getGatewayPrincipal } from "./icp";
import { startEcobeePoller } from "./pollers/ecobee";
import { startHoneywellPoller, persistTokenState as persistHoneywellTokens } from "./pollers/honeywellHome";
import type {
  NestWebhookEvent,
  EcobeeWebhookEvent,
  MoenFloWebhookEvent,
  HoneywellDevice,
  SmartThingsWebhookBody,
} from "./types";

const app = express();
const port = Number(process.env.IOT_GATEWAY_PORT) || 3002;

// Rate limiting for webhook endpoints
const moenFloLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

const ecobeeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // max 60 requests per minute per IP for Ecobee webhook
  standardHeaders: true,
  legacyHeaders: false,
});

const nestLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const smartThingsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // SmartThings hubs can send many device events in bursts
  standardHeaders: true,
  legacyHeaders: false,
});

// Store raw body for HMAC verification before JSON parsing
app.use(
  express.json({
    limit: "256kb",
    verify: (req: Request, _res, buf) => {
      (req as Request & { rawBody?: Buffer }).rawBody = buf;
    },
  })
);
app.use(cors());

// ── Signature helpers ────────────────────────────────────────────────────────

function hmacSha256(secret: string, payload: Buffer): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function verifyHmac(
  req: Request,
  headerName: string,
  secret: string | undefined
): boolean {
  if (!secret) return true; // secret not configured — skip in dev
  const sig = req.headers[headerName.toLowerCase()] as string | undefined;
  if (!sig) return false;
  const raw = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!raw) return false;
  const expected = hmacSha256(secret, raw);
  // Header may be "sha256=<hex>" or just "<hex>"
  const receivedHash = sig.startsWith("sha256=") ? sig.slice(7) : sig;
  return timingSafeEqual(expected, receivedHash);
}

// SmartThings signs requests with base64-encoded HMAC-SHA256 (not hex).
function verifySmartThingsHmac(req: Request, secret: string | undefined): boolean {
  if (!secret) return true;
  const sig = req.headers["x-st-hmac-sha256"] as string | undefined;
  if (!sig) return false;
  const raw = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!raw) return false;
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("base64");
  if (expected.length !== sig.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

// ── Logging middleware ────────────────────────────────────────────────────────

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── POST /webhooks/nest ───────────────────────────────────────────────────────
// Google SDM API sends Pub/Sub push messages here.
// Validates the Google-Cloud-Token bearer token.
app.post("/webhooks/nest", nestLimiter, async (req: Request, res: Response): Promise<void> => {
  const token = (req.headers["google-cloud-token"] ??
    req.headers["authorization"]?.replace("Bearer ", "")) as string | undefined;
  const expected = process.env.NEST_WEBHOOK_SECRET;

  if (expected && token !== expected) {
    console.warn("[nest] rejected — invalid token");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as NestWebhookEvent;
  const raw = JSON.stringify(body);

  const reading = handleNestEvent(body, raw);
  if (!reading) {
    res.json({ status: "ignored", reason: "no actionable reading" });
    return;
  }

  console.log(`[nest] event: ${Object.keys(reading.eventType)[0]} device=${reading.externalDeviceId}`);
  const result = await recordSensorEvent(reading);

  if (result.success) {
    console.log(`[nest] recorded eventId=${result.eventId}${result.jobId ? ` jobId=${result.jobId}` : ""}`);
    res.json({ status: "recorded", eventId: result.eventId, jobId: result.jobId });
  } else {
    console.error(`[nest] canister error: ${result.error}`);
    res.status(500).json({ status: "error", error: result.error });
  }
});

// ── POST /webhooks/ecobee ─────────────────────────────────────────────────────
// Ecobee sends alert notifications here.
// Validates X-Ecobee-Signature HMAC-SHA256.
app.post("/webhooks/ecobee", ecobeeLimiter, async (req: Request, res: Response): Promise<void> => {
  if (!verifyHmac(req, "x-ecobee-signature", process.env.ECOBEE_WEBHOOK_SECRET)) {
    console.warn("[ecobee] rejected — invalid signature");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as EcobeeWebhookEvent;
  const raw = JSON.stringify(body);

  const reading = handleEcobeeEvent(body, raw);
  if (!reading) {
    res.json({ status: "ignored", reason: "no actionable reading" });
    return;
  }

  console.log(`[ecobee] event: ${Object.keys(reading.eventType)[0]} device=${reading.externalDeviceId}`);
  const result = await recordSensorEvent(reading);

  if (result.success) {
    console.log(`[ecobee] recorded eventId=${result.eventId}${result.jobId ? ` jobId=${result.jobId}` : ""}`);
    res.json({ status: "recorded", eventId: result.eventId, jobId: result.jobId });
  } else {
    console.error(`[ecobee] canister error: ${result.error}`);
    res.status(500).json({ status: "error", error: result.error });
  }
});

// ── POST /webhooks/moen-flo ───────────────────────────────────────────────────
// Moen Flo cloud sends leak/flow alerts here.
// Validates X-Moen-Signature HMAC-SHA256.
app.post("/webhooks/moen-flo", moenFloLimiter, async (req: Request, res: Response): Promise<void> => {
  if (!verifyHmac(req, "x-moen-signature", process.env.MOEN_FLO_WEBHOOK_SECRET)) {
    console.warn("[moen-flo] rejected — invalid signature");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as MoenFloWebhookEvent;
  const raw = JSON.stringify(body);

  const reading = handleMoenFloEvent(body, raw);
  if (!reading) {
    res.json({ status: "ignored", reason: "no actionable reading" });
    return;
  }

  console.log(`[moen-flo] event: ${Object.keys(reading.eventType)[0]} device=${reading.externalDeviceId}`);
  const result = await recordSensorEvent(reading);

  if (result.success) {
    console.log(`[moen-flo] recorded eventId=${result.eventId}${result.jobId ? ` jobId=${result.jobId}` : ""}`);
    res.json({ status: "recorded", eventId: result.eventId, jobId: result.jobId });
  } else {
    console.error(`[moen-flo] canister error: ${result.error}`);
    res.status(500).json({ status: "error", error: result.error });
  }
});

// ── POST /webhooks/smartthings ────────────────────────────────────────────────
// Handles SmartThings Webhook SmartApp lifecycle events.
// CONFIRMATION and PING are handled without signature verification; all other
// lifecycles require X-ST-HMAC-SHA256 to match SMARTTHINGS_WEBHOOK_SECRET.
app.post("/webhooks/smartthings", smartThingsLimiter, async (req: Request, res: Response): Promise<void> => {
  const body = req.body as SmartThingsWebhookBody;

  // CONFIRMATION — SmartThings verifies endpoint ownership on first registration.
  // Must GET the confirmationUrl before responding.
  if (body.lifecycle === "CONFIRMATION") {
    const confirmationUrl = body.confirmationData?.confirmationUrl;
    if (!confirmationUrl) {
      res.status(400).json({ error: "missing confirmationUrl" });
      return;
    }
    try {
      await fetch(confirmationUrl);
      console.log("[smartthings] webhook confirmed:", confirmationUrl);
    } catch (err) {
      console.error("[smartthings] confirmation fetch failed:", err);
    }
    res.json({});
    return;
  }

  // PING — periodic liveness check from SmartThings.
  if (body.lifecycle === "PING") {
    res.json({});
    return;
  }

  // All other lifecycles must have a valid signature.
  if (!verifySmartThingsHmac(req, process.env.SMARTTHINGS_WEBHOOK_SECRET)) {
    console.warn("[smartthings] rejected — invalid signature");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // INSTALL / UPDATE / UNINSTALL — acknowledge without processing device events.
  if (body.lifecycle !== "EVENT") {
    res.json({});
    return;
  }

  // EVENT — process each capability state-change event.
  const events = body.eventData?.events ?? [];
  let processed = 0;

  for (const e of events) {
    if (!e.deviceEvent) continue;
    const raw     = JSON.stringify(e.deviceEvent);
    const reading = handleSmartThingsEvent(e.deviceEvent, raw);
    if (!reading) continue;

    const eventName = Object.keys(reading.eventType)[0];
    console.log(`[smartthings] ${eventName} device=${reading.externalDeviceId}`);

    const result = await recordSensorEvent(reading);
    if (result.success) {
      console.log(`[smartthings] recorded eventId=${result.eventId}${result.jobId ? ` jobId=${result.jobId}` : ""}`);
      processed++;
    } else {
      console.error(`[smartthings] canister error: ${result.error}`);
    }
  }

  res.json({ status: "processed", count: processed });
});

// ── GET /oauth/callback/honeywell ─────────────────────────────────────────────
// One-time setup endpoint: exchanges the OAuth authorization code for tokens
// and persists them so the polling loop can start on the next gateway restart.
app.get("/oauth/callback/honeywell", async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code as string | undefined;
  if (!code) {
    res.status(400).send("Missing code parameter");
    return;
  }

  const clientId     = process.env.HONEYWELL_CLIENT_ID;
  const clientSecret = process.env.HONEYWELL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(500).send("HONEYWELL_CLIENT_ID and HONEYWELL_CLIENT_SECRET must be set in .env");
    return;
  }

  const redirectUri = `http://localhost:${port}/oauth/callback/honeywell`;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type:   "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  try {
    const tokenResp = await fetch("https://api.honeywell.com/oauth2/token", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
      body: body.toString(),
    });

    if (!tokenResp.ok) {
      const text = await tokenResp.text();
      res.status(502).send(`Honeywell token exchange failed (${tokenResp.status}): ${text}`);
      return;
    }

    const data = await tokenResp.json() as {
      access_token:  string;
      refresh_token: string;
      expires_in:    number;
    };

    persistHoneywellTokens({
      accessToken:  data.access_token,
      refreshToken: data.refresh_token,
      expiresAt:    Date.now() + data.expires_in * 1000,
    });

    console.log("[honeywell] OAuth callback — tokens saved. Restart gateway to start polling.");
    res.send(
      "<h2>Honeywell Home connected!</h2>" +
      "<p>Tokens saved. Restart the IoT gateway to begin polling.</p>"
    );
  } catch (err) {
    console.error("[honeywell] OAuth callback error:", err);
    res.status(500).send("Internal error during token exchange");
  }
});

// ── GET /health ───────────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    gatewayPrincipal: getGatewayPrincipal(),
    sensorCanisterId: process.env.SENSOR_CANISTER_ID ?? "(not set)",
    platforms: ["nest", "ecobee", "moen-flo", "smartthings", "honeywell-home"],
    pollers: {
      ecobee:    !!process.env.ECOBEE_CLIENT_ID,
      honeywell: !!process.env.HONEYWELL_CLIENT_ID,
    },
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`HomeGentic IoT Gateway → http://localhost:${port}`);
  console.log(`Gateway principal: ${getGatewayPrincipal()}`);
  console.log(`Sensor canister:   ${process.env.SENSOR_CANISTER_ID ?? "(set SENSOR_CANISTER_ID)"}`);

  // Start polling integrations — each is a no-op when env vars are absent.
  if (process.env.ECOBEE_CLIENT_ID) {
    startEcobeePoller();
  }
  if (process.env.HONEYWELL_CLIENT_ID) {
    startHoneywellPoller();
  }
});
