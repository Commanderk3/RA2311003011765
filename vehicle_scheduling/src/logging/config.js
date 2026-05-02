const loggingConfig = {
  // Paste only the raw token value (without "Bearer " prefix).
  AUTH_TOKEN: "",

  // Pre-test logging endpoint.
  LOG_SERVER_URL: "http://20.244.56.144/evaluation-service/logs",

  REQUEST_TIMEOUT_MS: 10000
};

module.exports = {
  loggingConfig
};
