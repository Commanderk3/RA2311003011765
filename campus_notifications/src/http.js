async function parseResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function httpJson(url, options = {}) {
  const timeoutMs = options.timeoutMs || 15000;
  const fetchOptions = {
    method: options.method || "GET",
    headers: options.headers || {},
    body: options.body,
    signal: AbortSignal.timeout(timeoutMs),
  };

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (error) {
    throw new Error(`Network error calling ${url}: ${error.message}`);
  }

  const payload = await parseResponseBody(response);
  if (!response.ok) {
    const bodyText =
      typeof payload === "string" ? payload : JSON.stringify(payload);
    throw new Error(
      `HTTP ${response.status} from ${url}: ${bodyText.slice(0, 500)}`,
    );
  }

  if (typeof payload === "string") {
    throw new Error(`Expected JSON from ${url}, received text.`);
  }

  return payload;
}

module.exports = {
  httpJson,
};
