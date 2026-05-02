const http = require("http");
const { URL } = require("url");
const { buildConfig, validateConfig } = require("./config");
const { generateSchedules } = require("./scheduler");
const { sendLog } = require("../../log");

const config = buildConfig();

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload, null, 2));
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && requestUrl.pathname === "/health") {
    void sendLog(config, "INFO", "middleware", "Health endpoint requested.");
    writeJson(res, 200, { status: "ok" });
    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/schedule") {
    void sendLog(config, "INFO", "middleware", "Schedule endpoint requested.");
    try {
      validateConfig(config);
      const depotId = requestUrl.searchParams.get("depotId");
      const result = await generateSchedules(config, { depotId });
      void sendLog(
        config,
        "INFO",
        "middleware",
        `Schedule generated successfully for depotId=${depotId || "all"}.`,
      );
      writeJson(res, 200, result);
    } catch (error) {
      void sendLog(
        config,
        "ERROR",
        "middleware",
        `Schedule generation failed: ${error.message}`,
      );
      writeJson(res, 500, { error: error.message });
    }
    return;
  }

  writeJson(res, 404, { error: "Not Found" });
});

server.listen(config.PORT, () => {
  console.log(`Vehicle scheduling service running on port ${config.PORT}`);
  console.log("Endpoints: GET /health, GET /schedule, GET /schedule?depotId=2");
});
