function normalizeValue(value) {
  return String(value || "").trim();
}

function normalizeTheToken(token) {
  const raw = normalizeValue(token);
  if (!raw) {
    return "";
  }

  return raw.replace(/^Bearer\s+/i, "").trim();
}

async function sendLog(config, level, pkg, message, stack = "backend") {
  const token = normalizeTheToken(config.ACCESS_TOKEN);
  const logUrl = normalizeValue(config.LOG_SERVER_URL);

  if (!token || !logUrl) {
    return;
  }

  const payload = {
    stack: normalizeValue(stack).toLowerCase(),
    level: normalizeValue(level).toLowerCase(),
    package: normalizeValue(pkg).toLowerCase(),
    message: normalizeValue(message),
  };

  if (
    !payload.stack ||
    !payload.level ||
    !payload.package ||
    !payload.message
  ) {
    return;
  }

  try {
    await fetch(logUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(config.REQUEST_TIMEOUT_MS || 10000),
    });
  } catch (_error) {
    // Logging should never break business behavior.
  }
}

module.exports = {
  sendLog,
};
