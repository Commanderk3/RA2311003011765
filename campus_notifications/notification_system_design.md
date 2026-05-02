# Notifications System — Overview

## Stage 1: REST API

### Base URL, Authentication, Date Format, and Pagination
- **Base URL**: `/api/v1`
- **Auth**: `Bearer <JWT>`
- **Date format**: ISO-8601 UTC
- **Pagination**: cursor-based

### Key APIs
- **Get notifications feed** (`GET /notifications`)
  - Filters: `type`, `unreadOnly`, `limit`, `cursor`
- **Get single notification** (`GET /notifications/{id}`)
- **Badge count** (`GET /notifications/unread-count`)
- **Mark single notification as read** (`PATCH /notifications/{id}/read`)
- **Mark all notifications as read** (`PATCH /notifications/read-all`)
- **Create single notification (admin only)** (`POST /notifications`)
  - Segmentable broadcast
- **Bulk send notifications (admin only)** (`POST /notifications/bulk`)
  - Student

---

## Stage 2: Database (PostgreSQL)

### Schema:
- students, notifications, student_notifications (many-to-many with isRead state), notification_batches, notification_outbox

### Key Indexes:
- Composite index on `(studentID, isRead, createdAt DESC)`
- Partial index on `(studentID, isRead, createdAt DESC)` where isRead = false
- Outbox retry index on `(status, next_attempt_at)`

### Scalability Fixes:
- Hash/month partitioning, cursor pagination, Redis cache for unread count, outbox pattern for reliable delivery, idempotency keys

---

## Stage 3: Query Optimization

### Slow Query Problems:
- `SELECT *`
- No index
- No LIMIT
- Sort entire result set of 5 million rows

### Fixes:
1. Partial index on `(studentID, createdAt DESC)` where isRead = false
2. Select necessary columns only
3. LIMIT
4. Keyset pagination
5. Partition table as size increases

---

### Stage 4: Lightening DB Load

**Approaches:**
- **Cache-aside Redis** for first page + unread count *(best offload from DB)*
- **WebSocket delta push** for real-time data updates *(better user experience)*
- **Cursor-based pagination** for history scrolling *(stateless)*
- **ETags in HTTP** for reducing bandwidth usage
- **Materialized unread counters** for badge

**Combination recommended:** Redis + WebSocket + cursor-based pagination.

---

### Stage 5: Guaranteed Bulk Notification

**Initial problems:** sequential processing, no retries, no idempotency, email in critical path, lack of observability.

**Refactored approach - Transactional Outbox Pattern:**
1. Insert bulk entry, notifications, and outbox in DB transaction.
2. Respond `202` right away.
3. Process outbox asynchronously with retry logic.
4. Move permanently failed messages to dead-letter queue (DLQ).

**Upon partially successful email sending:** Retry only failed jobs and not those delivered; do retry tracking; deliver permanently failed entries to DLQ.

**Ensuring database-email transactionality:** No need for distributed transactions – local DB operation with outbox suffices for reliable asynchronous delivery.

---

## Stage 6: Priority Inbox

### Weights:
- Placement: 3
- Result: 2
- Event: 1

### Score calculation:
```
score = (type_weight * WEIGHT_FACTOR) + timestamp_ms
```

### Algorithm:
- Size N min-heap; add in O(logN); always maintains top N without complete sort.

### Output:
- Top 10 notifications retrieved from evaluation API; stored as JSON/TXT/PNG.

### Command:
```
npm run stage6
```