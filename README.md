# Async Task Processing System

A full-stack application that demonstrates asynchronous background job processing with real-time status tracking using a queue-based worker architecture.

## Features List
### Core Features
- ✔ **Create background job**
- ✔ **Priority-based processing (HIGH > MEDIUM > LOW)**
- ✔ **Real-time status tracking**
- ✔ **Progress percentage**
- ✔ **Final result storage**
- ✔ **Failure handling with retries**
- ✔ **Idempotent worker**
- ✔ **Non-blocking API**
- ✔ **Separate worker process**

### Concurrency & Consistency
- ✔ **BullMQ job locking** prevents duplicate processing
- ✔ **MongoDB atomic updates** per job
- ✔ Worker safe to run multiple instances
- ✔ Retry with **exponential backoff**
- ✔ System remains consistent on API restart

---

## High-Level Architecture

The system is designed with a true decoupled, queue-driven architecture, ensuring fault tolerance, concurrency, and horizontal scalability.

### 1️ API Server (Node + Express)
**Responsible for:** Creating jobs, storing initial state in MongoDB, sending jobs to the BullMQ queue, and providing status APIs to the client. *It does NOT process jobs and remains completely non-blocking.*

### 2️ Redis + BullMQ (Queue Layer)
**Handles:** Job storage, priority ordering (HIGH vs LOW), retry-on-failure orchestration, job locking (guaranteeing single-worker execution), and concurrency safety.

### 3️ Worker Process (Separate Node Process)
**Responsible for:** Consuming jobs asynchronously from the queue, updating the job lifecycle (`PENDING` → `PROCESSING` → `COMPLETED`/`FAILED`), updating progress %, and simulating handling errors & retries. It runs in a completely separate terminal from the API Server.

### 4️ MongoDB
**Stores persistent state:** Job title, priority, status, progress, and result.

### 5️ Frontend (React + Vite)
**Displays:** A minimalist UI featuring a Create Job form, priority selector, job list, dynamic status badges, and animated progress bars. Uses polling every 2 seconds to reflect real-time updates from the background.

---

## Full Job Lifecycle

1. **Step 1 – User Creates Job:** User enters Task title and Priority (LOW/MEDIUM/HIGH). The API saves the job in MongoDB (`status: PENDING`, `progress: 0`), adds the job to BullMQ with priority, and returns a response immediately *(⚡ Non-blocking API)*.
2. **Step 2 – Queue Behavior:** BullMQ orders jobs by priority (`HIGH` processed first) and ensures single-worker-per-job locking.
3. **Step 3 – Worker Picks Job:** The worker checks idempotency (skips if already `COMPLETED`). Transitions to `PROCESSING`, increments progress progressively (`25%` -> `50%` -> `100%`), and finally marks `COMPLETED` with a success result string.
4. **Step 4 – Failure Handling:** To demonstrate robustness, the worker has a simulated 20% failure rate. If it fails, BullMQ retries automatically up to 3 attempts with an exponential backoff. After max attempts, the job state changes correctly to `FAILED`.
5. **Step 5 – Frontend Updates:** The React app polls `GET /entries` every 2 seconds, dynamically updating the status badge, progress bar, and final result.

---

## Setup Instructions

### Prerequisites
You must have **MongoDB** (running locally or via Atlas) and **Redis** (running locally or via Upstash) available.
Ensure your `.env` in the `server` directory has your credentials.

**1. Start the API server**
```bash
cd server
npm install
npm run dev
```

**2. Start the Worker process**
*This runs in completely separate terminal to prove architectural decoupling.*
```bash
cd server
npm run worker
```

**3. Start the Frontend UI**
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173`.

---

## Demo Scenarios (For Reviewers)

Use these tests to verify the robustness of the system geometry.

**Demo 1 – Normal flow**
- Setup: Have API, Worker, and Frontend running.
- Action: Create a normal job.
- Result: Watch lifecycle safely transition to `COMPLETED` alongside real-time progress bars.

**Demo 2 – Priority Routing**
- Action: Rapidly create three `LOW` priority jobs, followed immediately by one `HIGH` priority job.
- Result: Watch the Worker bypass the `LOW` jobs and immediately process the `HIGH` job first, as orchestrated strictly by the Queue layer.

**Demo 3 – Failure & Retries**
- Action: Create multiple jobs. A simulated 20% failure rate is active.
- Result: Watch a job fail internally. BullMQ will hold the job, wait 2 seconds, and retry. If it persistently fails 3 times, the UI correctly transitions the job state to `FAILED`.

**Demo 4 – API Restart Tolerance**
- Action: Create a job, let it begin `PROCESSING`.
- Disturbance: Immediately kill (`Ctrl+C`) the API server terminal.
- Result: The UI stops updating, *but the separate Worker terminal finishes the job securely in the background*. Restart the API terminal, and the UI will fetch the job properly as `COMPLETED`. This proves true fault-tolerant decoupling.
