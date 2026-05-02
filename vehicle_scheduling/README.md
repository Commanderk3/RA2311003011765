# Vehicle Maintenance Scheduler Microservice

This microservice extracts protected information via:

- `GET /evaluation-service/depots`
- `GET /evaluation-service/vehicles`

Afterwards, it applies a 0/1 knapsack dynamic programming algorithm to find the optimal combination of maintenance activities per depot with maximum impact while not surpassing mechanic hour limit.

## Setup

1. Copy `.env` file into this directory:

```powershell
Copy-Item .env.example .env
```

2. Token-based authentication is recommended:

- `ACCESS_TOKEN`

If `ACCESS_TOKEN` is absent, you must use credentials instead:

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

## Run as Microservice

```bash
npm start
```

Endpoints:

- `GET /health`
- `GET /schedule`
- `GET /schedule?depotId=2`

## Generate Outputs for Submission

```bash
npm run schedule
```

It generates:

- `output/schedule-result.json`
- `output/schedule-report.txt`

## Shared Logger Module

`vehicle_scheduling` module imports a shared logger that lies outside this project:

- `../log/send-log.js`

This lets you share a single logger in other modules in this repository.

- Automatically sends logs upon executing `npm start` and `npm run schedule`.
- Authenticates using the `ACCESS_TOKEN` from `.env

## Algorithm

- Dynamic programming approach (0/1 knapsack).
- Time complexity: `O(N * W)` with:
  - `N` being the total number of tasks assigned to vehicles.
  - `W` being the maximum budget in mechanic-hours for target depots.
- Space complexity: `O(N * W)` for reconstruction array + `O(W)` for DP values.