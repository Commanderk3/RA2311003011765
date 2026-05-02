# Shared Log Utility

Reusable log sender for multiple projects in this repository.

## Export

- `sendLog(config, level, packageName, message, stack = "backend")`

## Required Config Keys

- `ACCESS_TOKEN`
- `LOG_SERVER_URL`

Optional:

- `REQUEST_TIMEOUT_MS`

## Example

```js
const { sendLog } = require("../log");

await sendLog(
  {
    ACCESS_TOKEN: process.env.ACCESS_TOKEN,
    LOG_SERVER_URL: "http://20.244.56.144/evaluation-service/logs",
    REQUEST_TIMEOUT_MS: 15000
  },
  "INFO",
  "middleware",
  "Shared logger initialized."
);
```
