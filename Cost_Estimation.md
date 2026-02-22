# Cost Estimation: Time and Space Complexity

This document outlines the evaluation of time and space complexity in the Driver Sentiment Engine.

## Time Complexity

### 1. Sentiment Score Calculation
**Algorithm:** Rule-Based Dictionary Lookups (`sentiment.js`)
**Time Complexity:** `O(N + P + N)` where `N` is the length of the string, `P` is the number of positive keywords, and `N` is the number of negative keywords. It simplifies to **O(L ** K)** where L is text length and K is dictionary size.
**Optimization:** By using an `O(1)` HashMap instead of an array `includes` check, we could reduce this to `O(L)`, but for the MVP array loops suffice.

### 2. Updating Driver Average Score
**Algorithm:** Exponential Moving Average (EMA) (`ema.js`)
**Time Complexity:** **O(1)**
**Rationale:** Rather than pulling all historical `feedbacks` from the database and recalculating the sum (`O(N)` queries), the system stores the current count and average, using math to update the new score in constant `O(1)` time. This prevents database degradation as the table grows to millions of rows.

### 3. Dashboard Queries
**Algorithm:** LRU TTL Memory Cache (`cache.js`)
**Time Complexity:** **O(1)** (Cache Hit) / **O(D)** (Cache Miss, D = drivers)
**Rationale:** The Admin Dashboard hits the `/api/admin/drivers` endpoint. Instead of querying the database every 3 seconds, a memory cache serves the data instantly, saving compute resources.

## Space Complexity

### 1. In-Memory Alert Locks
**Algorithm:** JavaScript Map (`alertLocks`)
**Space Complexity:** **O(U)** where `U` is the number of unique drivers who have triggered alerts in the last 1 hour.
**Rationale:** Minimal memory footprint. Keys that expire are overwritten.

### 2. Persistent SQLite Database
**Algorithm:** Relational Tables with Indexes
**Space Complexity:** **O(D + F)** where `D` is drivers and `F` is total feedbacks.
**Rationale:** Text data takes bytes. 1 million rows of feedback text averaging 100 characters each takes ~100MB, easily manageable on modern block storage.

### 3. Background Job Queue
**Algorithm:** Database Table Polling
**Space Complexity:** **O(Q)** where `Q` is the backlog of pending jobs.
**Rationale:** Pending jobs are cleared immediately (deleted from `jobs_queue`) upon success, keeping the actual queue table extremely small in size during normal operation.
