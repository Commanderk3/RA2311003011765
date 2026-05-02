const { loggingConfig } = require("./config");

function normalizeValue(value) {
  return String(value || "").trim();
}

async function Log(stack, level, pkg, message) {
  const token = normalizeValue(loggingConfig.AUTH_TOKEN);
  const url = normalizeValue(loggingConfig.LOG_SERVER_URL);

  if (!token || token === "PASTE_YOUR_ACCESS_TOKEN_HERE" || !url) {
    return;
  }

  const payload = {
    stack: normalizeValue(stack).toLowerCase(),
    level: normalizeValue(level).toLowerCase(),
    package: normalizeValue(pkg).toLowerCase(),
    message: normalizeValue(message)
  };

  if (!payload.stack || !payload.level || !payload.package || !payload.message) {
    return;
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(loggingConfig.REQUEST_TIMEOUT_MS)
    });
  } catch (_error) {
    // Logging should not crash business flows.
  }
}

module.exports = {
  Log
};
