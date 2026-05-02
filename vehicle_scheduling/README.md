# Vehicle Maintenance Scheduler Microservice

This service fetches protected data from:

- `GET /evaluation-service/depots`
- `GET /evaluation-service/vehicles`

Then it computes the best subset of maintenance tasks for each depot using 0/1 knapsack dynamic programming, maximizing total impact without exceeding mechanic-hour capacity.

## Setup

1. Create `.env` in this folder:

```powershell
Copy-Item .env.example .env
```

2. Prefer token-only mode in `.env`:

- `ACCESS_TOKEN`

If `ACCESS_TOKEN` is not set, fallback credentials are required:

- `EMAIL`
- `NAME`
- `ROLL_NO`
- `ACCESS_CODE`
- `CLIENT_ID`
- `CLIENT_SECRET`

Optional:

- `API_BASE_URL` (default: `http://20.207.122.201/evaluation-service`)
- `PORT` (default: `3000`)
- `REQUEST_TIMEOUT_MS` (default: `15000`)

## Run As Microservice

```bash
npm start
```

Endpoints:

- `GET /health`
- `GET /schedule`
- `GET /schedule?depotId=2`

## Generate Submission Outputs

```bash
npm run schedule
```

This writes:

- `output/schedule-result.json`
- `output/schedule-report.txt`

## Logging Middleware Utility

A reusable logging utility is available at:

- `src/logging/logger.js`

Config file for token paste:

- `src/logging/config.js`

1. Open `src/logging/config.js`
2. Paste your access token in `AUTH_TOKEN`
3. Keep the endpoint as `http://20.244.56.144/evaluation-service/logs` unless your pre-test doc says otherwise

Function signature:

```js
await Log(stack, level, packageName, message);
```

Quick test:

```bash
npm run log:test
```

## Algorithm

- Uses dynamic programming (0/1 knapsack).
- Time complexity: `O(N * W)` where:
  - `N` = number of vehicle tasks
  - `W` = max mechanic-hour budget across target depots
- Space complexity: `O(N * W)` for reconstruction matrix plus `O(W)` for DP values.
