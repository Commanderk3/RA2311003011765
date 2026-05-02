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

## Shared Logging

`vehicle_scheduling` uses a shared logger outside this project:

- `../log/send-log.js`

This makes the same logger reusable in other projects in this repo.

- Logs are sent automatically during `npm start` and `npm run schedule`.
- It uses the same `ACCESS_TOKEN` from `.env`.
- Optional override:
  - `LOG_SERVER_URL` (default: `http://20.244.56.144/evaluation-service/logs`)

## Algorithm

- Uses dynamic programming (0/1 knapsack).
- Time complexity: `O(N * W)` where:
  - `N` = number of vehicle tasks
  - `W` = max mechanic-hour budget across target depots
- Space complexity: `O(N * W)` for reconstruction matrix plus `O(W)` for DP values.
