const fs = require("fs");
const path = require("path");
const { buildConfig, validateConfig } = require("./config");
const { getAccessToken } = require("./auth");
const { httpJson } = require("./http");

const TYPE_WEIGHTS = Object.freeze({
  placement: 3,
  result: 2,
  event: 1
});

const WEIGHT_FACTOR = 10_000_000_000_000;

class MinHeap {
  constructor(compare) {
    this.compare = compare;
    this.items = [];
  }

  size() {
    return this.items.length;
  }

  peek() {
    return this.items[0];
  }

  push(value) {
    this.items.push(value);
    this.bubbleUp(this.items.length - 1);
  }

  pop() {
    if (this.items.length === 0) {
      return undefined;
    }

    const root = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0) {
      this.items[0] = last;
      this.bubbleDown(0);
    }

    return root;
  }

  replaceRoot(value) {
    if (this.items.length === 0) {
      this.items[0] = value;
      return;
    }

    this.items[0] = value;
    this.bubbleDown(0);
  }

  toArray() {
    return [...this.items];
  }

  bubbleUp(index) {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.compare(this.items[current], this.items[parent]) >= 0) {
        break;
      }
      this.swap(current, parent);
      current = parent;
    }
  }

  bubbleDown(index) {
    let current = index;
    const length = this.items.length;
    while (true) {
      const left = current * 2 + 1;
      const right = current * 2 + 2;
      let smallest = current;

      if (
        left < length &&
        this.compare(this.items[left], this.items[smallest]) < 0
      ) {
        smallest = left;
      }
      if (
        right < length &&
        this.compare(this.items[right], this.items[smallest]) < 0
      ) {
        smallest = right;
      }

      if (smallest === current) {
        break;
      }
      this.swap(current, smallest);
      current = smallest;
    }
  }

  swap(i, j) {
    const temp = this.items[i];
    this.items[i] = this.items[j];
    this.items[j] = temp;
  }
}

function normalizeType(type) {
  return String(type || "").trim().toLowerCase();
}

function getTypeWeight(type) {
  return TYPE_WEIGHTS[normalizeType(type)] || 0;
}

function parseTimestampMs(timestamp) {
  const raw = String(timestamp || "").trim();
  if (!raw) {
    return 0;
  }

  const normalized = raw.replace(" ", "T");
  let parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) {
    parsed = Date.parse(`${normalized}Z`);
  }

  return Number.isNaN(parsed) ? 0 : parsed;
}

function isUnread(notification) {
  const candidates = [
    notification.isRead,
    notification.IsRead,
    notification.read,
    notification.Read
  ];

  for (const value of candidates) {
    if (typeof value === "boolean") {
      return !value;
    }
    if (typeof value === "string") {
      const text = value.trim().toLowerCase();
      if (text === "true") {
        return false;
      }
      if (text === "false") {
        return true;
      }
    }
  }

  // API sample omits read-status field, so treat incoming data as unread.
  return true;
}

function comparePriority(a, b) {
  if (a.priorityScore !== b.priorityScore) {
    return a.priorityScore - b.priorityScore;
  }
  if (a.timestampMs !== b.timestampMs) {
    return a.timestampMs - b.timestampMs;
  }
  return String(a.ID).localeCompare(String(b.ID));
}

function buildCandidate(notification) {
  const timestampMs = parseTimestampMs(notification.Timestamp);
  const weight = getTypeWeight(notification.Type);
  const priorityScore = weight * WEIGHT_FACTOR + timestampMs;

  return {
    ID: notification.ID,
    Type: notification.Type,
    Message: notification.Message,
    Timestamp: notification.Timestamp,
    weight,
    timestampMs,
    priorityScore
  };
}

class PriorityInboxTopN {
  constructor(n = 10) {
    this.n = n;
    this.heap = new MinHeap(comparePriority);
  }

  ingest(notification) {
    if (!isUnread(notification)) {
      return;
    }

    const candidate = buildCandidate(notification);
    if (this.heap.size() < this.n) {
      this.heap.push(candidate);
      return;
    }

    const smallest = this.heap.peek();
    if (comparePriority(candidate, smallest) > 0) {
      this.heap.replaceRoot(candidate);
    }
  }

  snapshot() {
    return this.heap.toArray().sort((a, b) => comparePriority(b, a));
  }
}

function getTopNUnreadNotifications(notifications, n = 10) {
  const tracker = new PriorityInboxTopN(n);
  for (const notification of notifications) {
    tracker.ingest(notification);
  }

  return tracker.snapshot();
}

async function fetchNotifications(config) {
  const token = await getAccessToken(config);
  const payload = await httpJson(config.NOTIFICATIONS_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    },
    timeoutMs: config.REQUEST_TIMEOUT_MS
  });

  if (!Array.isArray(payload.notifications)) {
    throw new Error("Invalid API payload: notifications array not found.");
  }

  return payload.notifications;
}

function buildTextReport(topNotifications, meta) {
  const lines = [
    "Priority Inbox - Top 10 Notifications",
    `GeneratedAt: ${meta.generatedAt}`,
    `SourceCount: ${meta.totalFetched}`,
    `ReturnedTopN: ${meta.returnedCount}`,
    "",
    "Rank | ID                                   | Type      | Timestamp           | Score           | Message",
    "-----|--------------------------------------|-----------|---------------------|-----------------|--------"
  ];

  topNotifications.forEach((item, index) => {
    const rank = String(index + 1).padEnd(4, " ");
    const id = String(item.ID || "").padEnd(36, " ");
    const type = String(item.Type || "").padEnd(9, " ");
    const timestamp = String(item.Timestamp || "").padEnd(19, " ");
    const score = String(item.priorityScore).padEnd(15, " ");
    const message = String(item.Message || "");
    lines.push(`${rank} | ${id} | ${type} | ${timestamp} | ${score} | ${message}`);
  });

  return lines.join("\n");
}

async function main() {
  const config = buildConfig();
  validateConfig(config);

  const notifications = await fetchNotifications(config);
  const topNotifications = getTopNUnreadNotifications(
    notifications,
    Number.isInteger(config.TOP_N) && config.TOP_N > 0 ? config.TOP_N : 10
  );

  const generatedAt = new Date().toISOString();
  const output = {
    generatedAt,
    totalFetched: notifications.length,
    returnedCount: topNotifications.length,
    topNotifications
  };

  const outputDir = path.join(__dirname, "..", "output");
  fs.mkdirSync(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, "top10_notifications.json");
  const txtPath = path.join(outputDir, "top10_notifications.txt");
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2), "utf8");
  fs.writeFileSync(
    txtPath,
    buildTextReport(topNotifications, output),
    "utf8"
  );

  console.log(`Saved JSON output: ${jsonPath}`);
  console.log(`Saved text output: ${txtPath}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Stage 6 run failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  PriorityInboxTopN,
  getTopNUnreadNotifications,
  parseTimestampMs,
  isUnread,
  buildCandidate,
  comparePriority
};
