const { loadEnvFile } = require("./env");

loadEnvFile();

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
    API_BASE_URL: apiBaseUrl,
    AUTH_URL: `${apiBaseUrl}/auth`,
    DEPOTS_URL: `${apiBaseUrl}/depots`,
    VEHICLES_URL: `${apiBaseUrl}/vehicles`,
    PORT: Number(process.env.PORT || 3000),
    REQUEST_TIMEOUT_MS: Number(process.env.REQUEST_TIMEOUT_MS || 15000)
  };
}

function validateConfig(config) {
  if (config.ACCESS_TOKEN) {
    return;
  }

  const required = [
    "EMAIL",
    "NAME",
    "ROLL_NO",
    "ACCESS_CODE",
    "CLIENT_ID",
    "CLIENT_SECRET"
  ];

  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing environment variables: ${missing.join(", ")}. ` +
        "Provide ACCESS_TOKEN for token-only mode, or set full auth credentials in .env."
    );
  }
}

module.exports = {
  buildConfig,
  validateConfig
};
