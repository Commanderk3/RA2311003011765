const { httpJson } = require("./http");

function headerAuth(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function fetchDepots(config, token) {
  return httpJson(config.DEPOTS_URL, {
    method: "GET",
    headers: headerAuth(token),
    timeoutMs: config.REQUEST_TIMEOUT_MS,
  });
}

async function fetchVehicles(config, token) {
  return httpJson(config.VEHICLES_URL, {
    method: "GET",
    headers: headerAuth(token),
    timeoutMs: config.REQUEST_TIMEOUT_MS,
  });
}

module.exports = {
  fetchDepots,
  fetchVehicles,
};
