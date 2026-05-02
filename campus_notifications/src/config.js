const { loadEnv } = require("./env");

loadEnv();

function buildConfig() {
  const apiBaseUrl =
    process.env.API_BASE_URL || "http://20.207.122.201/evaluation-service";

  return {
    ACCESS_TOKEN: process.env.ACCESS_TOKEN,
    EMAIL: process.env.EMAIL,
    NAME: process.env.NAME,
    ROLL_NO: process.env.ROLL_NO,
    ACCESS_CODE: process.env.ACCESS_CODE,
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    AUTH_URL: `${apiBaseUrl}/auth`,
    NOTIFICATIONS_URL: `${apiBaseUrl}/notifications`,
    REQUEST_TIMEOUT_MS: Number(process.env.REQUEST_TIMEOUT_MS || 15000),
    TOP_N: Number(process.env.TOP_N || 10),
  };
}

function validateConfig(config) {
  if (String(config.ACCESS_TOKEN || "").trim()) {
    return;
  }

  const required = [
    "EMAIL",
    "NAME",
    "ROLL_NO",
    "ACCESS_CODE",
    "CLIENT_ID",
    "CLIENT_SECRET",
  ];

  const missing = required.filter((key) => !String(config[key] || "").trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing configuration: ${missing.join(", ")}. ` +
        "Set ACCESS_TOKEN, or set all fallback auth credentials in .env.",
    );
  }
}

module.exports = {
  buildConfig,
  validateConfig,
};
