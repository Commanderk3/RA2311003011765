# Stage 1

## 1.1 Key Activities

1. Get all notifications for a logged-in student.
2. Get one notification by its ID.
3. Mark one notification as read.
4. Mark all notifications as read.
5. Count number of unread notifications for badge.
6. Add notification (admin/placement office/event team/result system).
7. Add notifications to many students at once.
8. Send real-time updates for notifications.

## 1.2 REST API Guidelines

- Base URL: `/api/v1`
- Authorization: `Authorization: Bearer <JWT>`
- Payload Type: `application/json`
- Date Format: ISO-8601 UTC (e.g., `2026-05-02T06:20:00Z`)
- Feeds should use cursor-based pagination

Notification model:

```json
{
  "id": "uuid",
  "studentId": "uuid",
  "type": "placement",
  "title": "Placement Drive",
  "message": "Company ABC test link is live",
  "priority": 3,
  "isRead": false,
  "createdAt": "202

## 1.3 Endpoints

### GET `/api/v1/notifications`

Headers:

```http
Authorization: Bearer <token>
Accept: application/json
```

Query params:

- `limit` (default 20, maximum 100)
- `cursor` (opaque token used for pagination)
- `type` (`placement|result|event`)
- `unreadOnly` (`true|false`)

Response `200`:

```json
{
  "items": [
    {
      "id": "7060f52e-2f38-41b3-95d2-0c7b0b3bd7c8",
      "studentId": "3f0e8680-ffb4-4a4a-a19f-56b5119f3a33",
      "type": "placement",
      "title": "Placement Round 1",
      "message": "Aptitude test starts at 3 PM",
      "priority": 3,
      "isRead": false,
      "createdAt": "2026-05-02T06:20:00Z",
      "readAt": null,
      "metadata": {
        "ctaUrl": "https://campus.example.com/placement/round-1"
      }
    }
  ],
  "page": {
    "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTA1LTAyVDA2OjIwOjAwWiIsImlkIjoiNzA2MGY1MmUifQ==",
    "hasMore": true
  },
  "unreadCount": 12
}
```

### GET `/api/v1/notifications/{id}`

Headers:

```http

### GET `/api/v1/notifications/unread-count`

Headers:

```http
Authorization: Bearer <token>
Accept: application/json
```

Response `200`:

```json
{
  "unreadCount": 12
}
```

### POST `/api/v1/notifications` (admin/system only)

Headers:

```http
Authorization: Bearer <admin_token>
Content-Type: application/json
Idempotency-Key: 5e8f0f9c-34c2-4d22-88e2-9f5ca5b0a2cc
```

Request:

```json
{
  "target": {
    "mode": "segment",
    "segment": "cse_final_year"
  },
  "type": "placement",
  "title": "Interview Schedule",
  "message": "Interview starts at 10 AM tomorrow",
  "metadata": {
    "ctaUrl": "https://campus.example.com/interview"
  },
  "channels": ["in_app", "email"]
}
```

Response `202`:

```json
{
  "requestId": "aaf66b9c-9730-4adf-a5e8-0bccb2f6f64a",
  "status": "queued"
}
```

### POST `/api/v1/notifications/bulk` (admin/system only)

Headers:

```http
Authorization: Bearer <admin_token>
Content-Type: application/json
Idempotency-Key: 0fcb8f4b-7f86-4f08-a0e8-7ca2768f1c1d
```

Request:

```json
{
  "studentIds": ["uuid-1", "uuid-2"],
  "type": "event",
  "title": "Hackathon",
  "message": "Registration closes tonight",
  "channels": ["in_app", "email"]
}
```

Response `202`:

```json
{
  "batchId": "2ce1df8d-778e-4708-af0b-4fe2a0c5d2f6",
  "status": "queued",
  "targetCount": 2
}
```

## 1.4 Real-Time Notification Mechanism

Primary: WebSocket per authenticated student.

- Endpoint: `wss://api.campus.example.com/ws/notifications`
- Client sends bearer token in handshake.
- Server publishes events:
  - `notification.created`
  - `notification.updated`
  - `notification.read`
  - `badge.unread_count_changed`

Event payload:

```json
{
  "event": "notification.created",
  "occurredAt": "2026-05-02T06:25:30Z",
  "data": {
    "id": "7060f52e-2f38-41b3-95d2-0c7b0b3bd7c8",
    "type": "placement",
    "message": "Interview starts at 10 AM tomorrow",
    "isRead": false
  }
}
```

Fallback:

1. SSE for environments where WebSocket is restricted.
2. Polling (`GET /notifications?cursor=...`) as last fallback.

Why WebSocket:

- Low-latency push for active sessions.
- Bidirectional connection allows ack/reconnect semantics.
- Lower repeated HTTP overhead than frequent polling.

---

## Stage 2

## 2.1 DB Choice

Recommended: PostgreSQL.

Why:

1. Strong consistency for read/unread state updates.
2. Flexible indexing for heavy feed queries.
3. JSONB metadata support.
4. Mature partitioning and operational tooling.

## 2.2 Schema

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE notification_type AS ENUM ('placement', 'result', 'event');

CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_notifications (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ NULL,
  delivered_in_app_at TIMESTAMPTZ NULL,
  delivered_email_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, notification_id)
);

CREATE TABLE notification_batches (
  id UUID PRIMARY KEY,
  requested_by UUID NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_count INT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_outbox (
  id UUID PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES notification_batches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email')),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempt_count INT NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(batch_id, student_id, channel)
);
```

Indexes:

```sql
CREATE INDEX idx_student_notifications_feed
  ON student_notifications (student_id, is_read, created_at DESC);

CREATE INDEX idx_student_notifications_unread_partial
  ON student_notifications (student_id, created_at DESC)
  WHERE is_read = FALSE;

CREATE INDEX idx_outbox_retry
  ON notification_outbox (status, next_attempt_at, attempt_count);
```

## 2.3 Scaling Problems and Fixes

Problems:

1. Large per-student feed queries get slower.
2. Unread-count queries become hot.
3. Bulk insert/write spikes during Notify-All.
4. Email/API retries can create duplicate sends.

Solutions:

1. Partition `student_notifications` by hash(`student_id`) or by month.
2. Partial/composite indexes for unread feed.
3. Cursor pagination instead of offset pagination.
4. Redis cache for unread counts with async repair jobs.
5. Queue + outbox pattern for delivery durability and retries.
6. Idempotency key and unique constraints for dedup.

## 2.4 API-Backed Queries

List feed:

```sql
SELECT sn.id, sn.student_id, sn.is_read, sn.read_at, sn.created_at,
       n.id AS notification_id, n.type, n.title, n.message, n.metadata
FROM student_notifications sn
JOIN notifications n ON n.id = sn.notification_id
WHERE sn.student_id = $1
  AND ($2::boolean IS FALSE OR sn.is_read = FALSE)
  AND ($3::text IS NULL OR n.type = $3::notification_type)
  AND (sn.created_at, sn.id) < ($4::timestamptz, $5::uuid)
ORDER BY sn.created_at DESC, sn.id DESC
LIMIT $6;
```

Get one:

```sql
SELECT sn.id, sn.student_id, sn.is_read, sn.read_at, sn.created_at,
       n.id AS notification_id, n.type, n.title, n.message, n.metadata
FROM student_notifications sn
JOIN notifications n ON n.id = sn.notification_id
WHERE sn.student_id = $1 AND sn.id = $2;
```

Mark one read:

```sql
UPDATE student_notifications
SET is_read = TRUE,
    read_at = NOW()
WHERE id = $1
  AND student_id = $2
  AND is_read = FALSE
RETURNING id, is_read, read_at;
```

Mark all read:

```sql
UPDATE student_notifications sn
SET is_read = TRUE,
    read_at = NOW()
FROM notifications n
WHERE sn.notification_id = n.id
  AND sn.student_id = $1
  AND sn.is_read = FALSE
  AND ($2::text IS NULL OR n.type = $2::notification_type);
```

Unread count:

```sql
SELECT COUNT(*)::int AS unread_count
FROM student_notifications
WHERE student_id = $1
  AND is_read = FALSE;
```

---

## Stage 3

Given slow query:

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

## 3.1 Why It Is Slow

1. `SELECT *` pulls unnecessary columns.
2. Missing composite/partial index causes table scan or expensive sort.
3. No `LIMIT` means sorting potentially huge result sets.
4. At 5M rows, random I/O and sort memory pressure are high.

## 3.2 Optimizations

1. Add partial index for unread feed:

```sql
CREATE INDEX CONCURRENTLY idx_notifications_student_unread_createdat
ON notifications (studentID, createdAt DESC)
WHERE isRead = false;
```

2. Return only required fields:

```sql
SELECT id, type, message, createdAt
FROM notifications
WHERE studentID = $1
  AND isRead = false
ORDER BY createdAt DESC
LIMIT $2;
```

3. Use keyset pagination:

```sql
SELECT id, type, message, createdAt
FROM notifications
WHERE studentID = $1
  AND isRead = false
  AND (createdAt, id) < ($2, $3)
ORDER BY createdAt DESC, id DESC
LIMIT $4;
```

4. Partition by month (or hash studentID) when table grows further.
5. Cache unread count separately to avoid repeat count scans.

Expected impact:

- Index-assisted ordering removes heavy sort.
- Query touches fewer pages.
- Pagination prevents full-history scans on each request.

---

## Stage 4

Problem: Every page load fetches notifications, overwhelming DB.

## 4.1 Suggested Strategies

1. Redis cache-aside for first page + unread count.
2. WebSocket push with incremental updates (delta events).
3. Cursor-based incremental API (`since` token) instead of full reload.
4. HTTP caching (`ETag`, `If-None-Match`) for no-change requests.
5. Background pre-computation of unread counters.

## 4.2 Tradeoffs

1. Redis cache-aside
   Pros: Big DB offload, very fast reads.
   Cons: Invalidation complexity, eventual consistency windows.

2. WebSocket/SSE deltas
   Pros: Best UX, fewer repeated pull requests.
   Cons: Connection lifecycle complexity, scaling stateful connections.

3. Cursor incremental fetch
   Pros: Stateless server API, predictable DB usage.
   Cons: Slightly more client complexity with cursor management.

4. HTTP ETag
   Pros: Easy bandwidth reduction when no changes.
   Cons: Does not remove all DB reads unless coupled with cache.

5. Materialized unread counters
   Pros: Very fast badge count.
   Cons: Needs robust update/rebuild logic to avoid drift.

Recommended combination:

- Redis for unread count + first page.
- WebSocket for live delta pushes.
- Cursor pagination for historical scrolling.

---

## Stage 5

Current pseudocode issues:

```python
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)
```

## 5.1 Shortcomings

1. Sequential loop is too slow for 50k users.
2. If email fails midway, processing is partially done and inconsistent.
3. No retries, no dead-letter handling, no idempotency.
4. External call (email API) is inside critical path.
5. No observability per user/channel state.

## 5.2 `send_email` Failed for 200 Students Midway — What Now?

1. Identify failed student IDs from delivery logs/outbox records.
2. Re-enqueue only failed email jobs (idempotent retry).
3. Do not duplicate already successful in-app records.
4. Track retry count and route permanent failures to DLQ for manual action.

## 5.3 Reliable/Fast Redesign

Use transactional outbox + message queue + worker pool:

1. API request creates one batch record.
2. In one DB transaction, store in-app notification rows + outbox jobs.
3. Commit transaction quickly and return `202 Accepted`.
4. Workers consume outbox asynchronously for:
   - email delivery
   - real-time push
5. Retries use exponential backoff.
6. Unique keys prevent duplicate sends.

## 5.4 Should DB Save and Email Send Be Atomic Together?

No, not as one distributed transaction.

Reason:

1. Email provider is an external system; distributed atomic commit is fragile and slow.
2. Stronger pattern is local DB transaction + outbox for guaranteed eventual delivery.
3. This gives reliability without blocking API latency.

## 5.5 Revised Pseudocode

```python
function notify_all(request_id: string, student_ids: list[str], payload: dict):
    if idempotency_exists(request_id):
        return existing_batch(request_id)

    batch_id = uuid()

    begin_tx()
    insert_notification_batch(batch_id, request_id, payload, len(student_ids), status="queued")

    for student_id in student_ids:
        notif_id = uuid()
        insert_student_notification(
            id=notif_id,
            student_id=student_id,
            type=payload["type"],
            title=payload["title"],
            message=payload["message"],
            is_read=False
        )

        insert_outbox_job(
            batch_id=batch_id,
            student_id=student_id,
            channel="in_app",
            payload={"notif_id": notif_id, **payload},
            status="pending"
        )

        insert_outbox_job(
            batch_id=batch_id,
            student_id=student_id,
            channel="email",
            payload={"notif_id": notif_id, **payload},
            status="pending"
        )
    commit_tx()

    enqueue_outbox(batch_id)
    return {"batch_id": batch_id, "status": "queued"}


function outbox_worker():
    while True:
        jobs = claim_pending_jobs(limit=500)
        for job in jobs:
            try:
                if job.channel == "email":
                    send_email(job.student_id, job.payload)
                else:
                    push_to_app(job.student_id, job.payload)

                mark_job_success(job.id)
            except TemporaryError as e:
                schedule_retry(job.id, backoff=exp(job.attempt_count), last_error=str(e))
            except PermanentError as e:
                move_to_dlq(job.id, last_error=str(e))
```

---

## Stage 6

## 6.1 Implemented Code

Implemented in:

- `campus_notifications/src/stage6_priority_inbox.js`

Outputs written to:

- `campus_notifications/output/top10_notifications.json`
- `campus_notifications/output/top10_notifications.txt`
- `campus_notifications/output/top10_notifications_screenshot.png`
- `campus_notifications/output/top10_notifications_screenshot_2.png`

## 6.2 Priority Logic

Weights:

- Placement = 3
- Result = 2
- Event = 1

Combined score:

```text
score = (weight * WEIGHT_FACTOR) + timestamp_ms
```

This keeps category importance primary while still using recency for ordering.

## 6.3 API Usage

Protected API used:

- `GET http://20.207.122.201/evaluation-service/notifications`

Auth source:

1. `ACCESS_TOKEN` from `.env` (preferred), else
2. fallback auth call using credential fields in `.env`

## 6.4 Efficient Maintenance for New Incoming Notifications

`PriorityInboxTopN` uses a min-heap of size `n`:

1. Insert each new notification in `O(log n)`.
2. Keep only top `n` elements in memory.
3. Snapshot current top `n` in sorted order when needed.

This is efficient for continuous notification streams because it does not re-sort the full dataset every time.

## 6.5 Run Command

```bash
npm run stage6
```
