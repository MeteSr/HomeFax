# HomeGentic IoT Gateway

Node.js/Express bridge that receives webhooks from smart-home platforms and forwards
normalized sensor readings to the HomeGentic Sensor canister on ICP.

## Supported platforms

| Platform | Protocol | Env var required |
|---|---|---|
| Nest (Google SDM) | Push webhook (Pub/Sub) | `NEST_WEBHOOK_SECRET` |
| Ecobee | REST polling (3 min) | `ECOBEE_CLIENT_ID` + tokens |
| Moen Flo | Push webhook | `MOEN_FLO_WEBHOOK_SECRET` |

## Running

```bash
cd agents/iot-gateway
npm install
npm run dev        # ts-node server.ts, port 3002
```

Copy `.env.example` to `.env` and fill in the relevant vars before starting.

---

## Ecobee — PIN authorization walkthrough

Ecobee uses an OAuth 2.0 PIN flow for consumer apps. Run these two steps once to
obtain your initial `access_token` and `refresh_token`. The gateway refreshes tokens
automatically on every restart and whenever the token is close to expiring.

### Prerequisites

1. Create a free account at [developer.ecobee.com](https://developer.ecobee.com)
2. Create an application → note the **API Key** — this is your `ECOBEE_CLIENT_ID`

### Step 1 — request a PIN

```bash
curl "https://api.ecobee.com/authorize?response_type=ecobeePin&client_id=YOUR_CLIENT_ID&scope=smartRead"
```

Response:

```json
{
  "ecobeePin": "ABCD-1234",
  "code": "AUTHORIZATION_CODE",
  "scope": "smartRead",
  "expires_in": 900
}
```

Go to your Ecobee app → **Menu → My Apps → Add Application** and enter the PIN
(`ABCD-1234`). You have 15 minutes.

### Step 2 — exchange code for tokens

```bash
curl -X POST "https://api.ecobee.com/token?grant_type=ecobeePin&code=AUTHORIZATION_CODE&client_id=YOUR_CLIENT_ID"
```

Response:

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "scope": "smartRead"
}
```

Add to your `.env`:

```
ECOBEE_CLIENT_ID=YOUR_CLIENT_ID
ECOBEE_ACCESS_TOKEN=<access_token from above>
ECOBEE_REFRESH_TOKEN=<refresh_token from above>
```

### Finding your thermostat ID

After completing the PIN flow, run:

```bash
curl "https://api.ecobee.com/1/thermostat?json=%7B%22selection%22%3A%7B%22selectionType%22%3A%22registered%22%2C%22selectionMatch%22%3A%22%22%7D%7D" \
  -H "Authorization: Bearer $ECOBEE_ACCESS_TOKEN"
```

Look at `thermostatList[0].identifier` — a 12-digit number like `411848373746`.
Set `ECOBEE_THERMOSTAT_ID` to restrict polling to a single unit, or leave it unset
to poll all registered thermostats.

### Register the device in HomeGentic

Once you have the thermostat identifier, register it once so the gateway can match
incoming readings to the correct sensor record:

```ts
sensorService.registerDevice(propertyId, "411848373746", "Ecobee", "Living Room Ecobee")
```

The `externalDeviceId` passed here must match the identifier returned by the Ecobee API.

---

## Gateway identity setup

The sensor canister only accepts `recordEvent` calls from authorized gateway principals.
Generate a stable identity seed and whitelist it once:

```bash
# Generate a 32-byte hex seed
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# → add as GATEWAY_IDENTITY_SEED in .env

# Print the derived principal
cd agents/iot-gateway && node -e "
const { Ed25519KeyIdentity } = require('@icp-sdk/core/identity');
const seed = Buffer.from(process.env.GATEWAY_IDENTITY_SEED, 'hex');
const id = Ed25519KeyIdentity.generate(new Uint8Array(seed));
console.log(id.getPrincipal().toText());
"

# Whitelist it on the sensor canister
dfx canister call sensor addAuthorizedGateway '(principal "YOUR_GATEWAY_PRINCIPAL")'
```

The gateway also prints its principal on startup via `GET /health`.
