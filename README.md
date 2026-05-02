{
"email": "dk7199@srmist.edu.in",
"name": "diwangshu kakoty",
"rollNo": "ra2311003011765",
"accessCode": "QkbpxH",
"clientID": "2549c48e-99fa-4d4f-9cee-f877664155b2",
"clientSecret": "XPumjuuhthzdyfsR"
}

Vehicle Maintenance Scheduler Microservice
You've joined a team responsible for planning daily vehicle maintenance at a logistics company.
Each depot handles many service requests every day - from quick fixes to longer repairs. Every
request (or task) comes with two key details: how long it will take (in hours) and a score that
represents how important it is to complete that task soon. The importance score is based on
how much the vehicle contributes to operations. For example, a vehicle running frequent
delivery routes or handling busy areas may have a higher score compared to a rarely used
backup vehicle. So, choosing the right set of tasks directly affects overall efficiency.
However, there's a strict limit on how many mechanic-hours are available each day. This means
you cannot complete all tasks and must carefully decide which ones to include. The challenge is
to pick a combination of tasks such that:
. The total time spent does not exceed the available mechanic-hours
. The total importance score is as high as possible
Since the number of tasks can be very large, the solution should be efficient enough to handle
real-world scale inputs.
Given a list of vehicles requiring maintenance, each with an operational impact score and
estimated service duration, and a daily mechanic-hour budget, determine the subset of vehicles
to service to maximise the total operational impact score within the available budget. Submit
your code along with output screenshots to the "vehicle_scheduling" folder in the GitHub
Repository you created while building the logging middleware.
You're provided with the below APIs. You are expected to use these APIs to fetch the depot and
task details. You need not store them in a database, nor are you supposed to hard-code or
create them yourself.

Depot API (GET)

http://20.207.122.201/evaluation-service/depots

Constraints

. API is a protected Route

Response (Status : 200)

{
"depots": [
{
"ID": 1,
"MechanicHours" : 60
},
{
"ID": 2,
"MechanicHours" : 135
},
]
}

Vehicles API (GET)

http://20.207.122.201/evaluation-service/vehicles

Constraints

. API is a protected Route|

Response (Status Code: 200)

{
"vehicles": [
{
"TaskID": "264e638f-1c7a-4d67-9f9c-53f3d1766d37",
"Duration": 1,
"Impact": 5
}
]
}

## Explanation of the Logging Middleware Task

This task asks you to build a **reusable logging utility** that sends log data to a remote test server (instead of just printing to the console). Here's a breakdown:

---

### What You Need to Build

A single reusable function with this signature:

```
Log(stack, level, package, message)
```

**Each parameter means:**

| Parameter | What it is                                   | Example                                  |
| --------- | -------------------------------------------- | ---------------------------------------- |
| `stack`   | The technology/layer (frontend, backend)     | `"backend"`, `"frontend"`                |
| `level`   | Severity of the log                          | `"INFO"`, `"WARN"`, `"ERROR"`, `"DEBUG"` |
| `package` | The module/file where the log originates     | `"auth-service"`, `"db-handler"`         |
| `message` | A descriptive message about what's happening | `"User profile fetched successfully"`    |

---

### What It Must Do

Every time `Log(...)` is called, it should **make an API call to the Test Server** with those four pieces of data. Think of it like sending a log entry to a central logging service.

---

### How to Implement It (TypeScript/JavaScript)

```typescript
// logger.ts  (your reusable package)

const AUTH_TOKEN = "your_token_from_postman_here";
const LOG_SERVER_URL = "https://test-server-url/log"; // from the pre-test doc

export async function Log(
  stack: string,
  level: string,
  pkg: string,
  message: string,
): Promise<void> {
  try {
    await fetch(LOG_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({ stack, level, package: pkg, message }),
    });
  } catch (err) {
    // Silent fail — logging should never crash your app
  }
}
```

---

### How to Use It Throughout Your Code

Instead of `console.log(...)`, you call `Log(...)` everywhere:

```typescript
import { Log } from "./logger";

// When something succeeds
await Log(
  "backend",
  "INFO",
  "user-service",
  "Fetched all users from database successfully",
);

// When something might be wrong
await Log(
  "backend",
  "WARN",
  "db-service",
  "Database query took longer than 2000ms",
);

// When something fails
await Log(
  "backend",
  "ERROR",
  "payment-service",
  `Payment failed for order ID: ${orderId}`,
);

// For debugging details
await Log(
  "backend",
  "DEBUG",
  "auth-middleware",
  `Token validated for user: ${userId}`,
);
```

---

### Key Rules to Remember

1. **No `console.log`** anywhere — use only your `Log()` function
2. **Must be a reusable package** — one file imported everywhere, not copy-pasted
3. **If doing Full Stack** — both frontend and backend must be TypeScript/JavaScript so they can share/use the same logging package
4. **Be descriptive** — logs like `"success"` are bad; logs like `"Order #123 created for user #456"` are good
5. **Log everywhere** — route handlers, DB calls, error catches, middleware, etc.

---

### The Big Idea

They want your logs to tell a **story** of what your app is doing, so that if something breaks later, you can trace exactly what happened by reading the logs on the test server.

Consolidate this task so that the builder AI can understand:

Campus Notifications Microservice

Deliverables
. You're a backend developer working on a campus notification platform where students
receive real-time updates regarding Placements, Events, and Results. You have to
incrementally solve different tasks across stages. Not every stage requires coding, each
stage has clear instructions on the deliverables. You're expected to commit and push your
deliverables to the same GitHub Repository that you created while implementing the
Logging Middleware at frequent intervals. Direct submission of your response at the end
of the test as a single commit will result in lower points for your submission.
. As you progress through the stages, you may revise your submission for the previous
stages. Your submission will be evaluated across stages both individually and
cumulatively.
. At different stages, there may be references to others roles within the team and those are
provided only as an indication of the role that they shall play. At no point should you
consult or discuss your strategy or submissions with your peers.

Stage 1
Assume a front-end developer colleague has asked you for REST API design, contract and
structure to display notifications to the users when they are logged in. Identify the core actions
that the notification platform should support. Now, you have to present the REST API endpoints
along with their JSON request, response, and headers structures using an appropriate format.
Define clear and consistent endpoints for each action, using predictable naming conventions,
and design JSON schemas with essential fields. Also, you are to design a mechanism for
real-time notifications. Submit your response as a markdown file called
"notification_system_design.md" to the same repository you created while creating the logging
middleware. Label your response with "Stage 1" as heading.

Stage 2
On the basis of the APIs and contract you created earlier, you now have to store the same
reliably. Which persistent storage (DB) do you suggest and explain your choice. Write the
applicable DB schema. What problems could arise as the data volume increases? How would
you solve such problems? Write SQL or NoSQL queries based on your DB schema and the REST
APIs that you designed in Stage 1. Submit your response in a new section labeled "Stage 2" by
expanding the same "Notification_System_Design.md" file.

Stage 3
An earlier developer in the team chose a relational database for storage (MySQL or PostgreSQL)
about 3 months ago. Now the database has grown to 50,000 students and 5,000,000
notifications. The developer had written the below query to fetch all the unread notifications of
a student as a part of the notification API that was developed, which is now performing slowly.
SELECT \* FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;

new section
"Notification_System_Design.md" file.

Stage 5
It is placement season. The HR clicks on "Notify All" and 50,000 students should get an email and
an in-app notification simultaneously. Below is pseudocode for the proposed implementation.

function notify_all(student_ids: array, message: string):
for student_id in student_ids:
send_email(student_id, message) # calls Email API
save_to_db(student_id, message) # DB insert
push_to_app(student_id, message) # implementation is based on whatever
real time notification mechanism you have chosen in Stage 1

What shortcomings do you observe with this implementation? Logs indicate that the
'send_email' call failed for 200 students midway. What now? How would you redesign this to be
reliable and fast? Should the process of saving to DB as well as sending the email happen
together? Why or why not? Submit revised pseudocode along with your response to these
labeled "Stage 5" by expanding the same
questions in a new section
"Notification_System_Design.md" file.

response in a

Stage 4
The notifications are being fetched on each page load for every student. The DB is getting
overwhelmed which is causing a bad user experience. What solution will you suggest? How will
you improve performance? Elaborate on the tradeoffs of each strategy you suggest. Submit your
labeled "Stage 4" by expanding the same "Notification_System_Design.md" file.

Stage 5
It is placement season. The HR clicks on "Notify All" and 50,000 students should get an email and
an in-app notification simultaneously. Below is pseudocode for the proposed implementation.

function notify_all(student_ids: array, message: string):
for student_id in student_ids:
send_email(student_id, message) # calls Email API
save_to_db(student_id, message) # DB insert
push_to_app(student_id, message) # implementation is based on whatever real time notification mechanism you have chosen in Stage 1

What shortcomings do you observe with this implementation? Logs indicate that the
'send_email' call failed for 200 students midway. What now? How would you redesign this to be
reliable and fast? Should the process of saving to DB as well as sending the email happen
together? Why or why not? Submit revised pseudocode along with your response to these
questions in a new section labeled "Stage 5" by expanding the same
"Notification_System_Design.md" file.

Stage 6
You've received user feedback from your product manager, they'd like to introduce a Priority
Inbox that always displays the top 'n' most important unread notifications first (n could be top
10,15, 20, etc. as per user's choice). Priority should be determined based on a combination of
weight (placement > result > event) and recency. Implement your approach or solution in any
language of your choice (Go, Rust, Python, TypeScript, JavaScript, Java etc). Write code only to
find top 10 notifications (DB query is not expected). Your submission should be an actual
functioning code file and not pseudo-code. You're also expected to upload screenshots of your
output displaying the priority notifications. Both the code and the screenshots are to be pushed
to the same GitHub repository. Also note that new notifications will keep coming in. How will you
maintain the top 10 efficiently? In addition to the code and screenshots, you may revise the
same "notification_system_design.md" file to also explain your approach in this stage in a new
section labeled "Stage 6".
To simplify your task, you're also provided with the below Notification API. You are expected to
use the API to fetch the notifications. You need not store them in a database, nor are you
supposed to hard-code or create notifications yourself.

Notification API (GET)

http://20.207.122.201/evaluation-service/notifications

Constraints

. API is a protected Route

Response Code (status : 200)
"notifications": [

"ID": "d146095a-0d86-4a34-9e69-3900a14576bc"

{
"notifications": [
{
"ID": "d146095a-0d86-4a34-9e69-3900a14576bc",
"Type": "Result",
"Message": "mid-sem",
"Timestamp": "2026-04-22 17:51:30"
},
]
}
