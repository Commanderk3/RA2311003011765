const { httpJson } = require("./http");

function normalizeToken(token) {
  const raw = String(token || "").trim();
  if (!raw) {
    return "";
  }

  return raw.replace(/^Bearer\s+/i, "").trim();
}

async function getAccessToken(config) {
  const staticToken = normalizeToken(config.ACCESS_TOKEN);
  if (staticToken) {
    return staticToken;
  }

  const body = JSON.stringify({
    email: config.EMAIL,
    name: config.NAME,
    rollNo: config.ROLL_NO,
    accessCode: config.ACCESS_CODE,
    clientID: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET
  });

  const response = await httpJson(config.AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body,
    timeoutMs: config.REQUEST_TIMEOUT_MS
  });

  if (!response.access_token) {
    throw new Error("Authentication succeeded but access_token is missing.");
  }

  return response.access_token;
}

module.exports = {
  getAccessToken
};
