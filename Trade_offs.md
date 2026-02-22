# System Architecture Trade-offs

During the design and implementation of the Driver Sentiment Engine, several trade-offs were made. These decisions reflect a balance between performance, scalability, development speed, and maintainability.

## 1. Relational DB (SQLite) vs. NoSQL (MongoDB/DynamoDB)
**Decision:** We chose a Relational Database (SQLite) for the MVP, which would easily map to PostgreSQL or MySQL in production.
**Trade-off:** 
* **Pros:** Data integrity, ACID compliance, structured relationships (Foreign Keys connecting Feedbacks to Drivers), and easy aggregations.
* **Cons:** Less flexible schema than NoSQL. Horizontal scaling (sharding) for purely raw text feedback writes is harder than in NoSQL databases like DynamoDB.
* **Conclusion:** Because we need strict consistency on the driver's aggregate scores, Relational was chosen.

## 2. Persistent DB Queue vs. In-Memory Array Queue vs. Kafka
**Decision:** Upgraded from an in-memory array to a SQLite `jobs_queue` table.
**Trade-off:**
* **Pros:** Fault-tolerant. If the Node.js server crashes, the pending jobs in the queue are not lost; they reside on disk.
* **Cons:** Polling a database table (`setInterval` checking the DB) adds slight I/O overhead compared to an instantaneous in-memory array.
* **Conclusion:** Reliability trumps the microsecond speed advantage of an in-memory queue. In a large enterprise, this would be replaced by Apache Kafka or AWS SQS.

## 3. Mathematical EMA vs. Exact History Aggregation
**Decision:** We use Exponential Moving Average (EMA) logic to calculate scores.
**Trade-off:**
* **Pros:** Processing a new feedback takes exactly `O(1)` constant time. The database only performs 1 simple `UPDATE`.
* **Cons:** The exact aggregate decimal point might lose micro-precision compared to a raw `SUM(scores)/COUNT(scores)` query running over 50,000 rows.
* **Conclusion:** `O(1)` compute is absolutely necessary for scale, making the slight loss in mathematical precision an acceptable trade-off.

## 4. Rule-Based Sentiment vs. Machine Learning Models
**Decision:** A simple term-matching dictionary (`sentiment.js`).
**Trade-off:**
* **Pros:** Highly performant, requires zero GPU resources, zero cloud API costs (unlike AWS Comprehend or OpenAI).
* **Cons:** Cannot detect sarcasm or contextual nuance. 
* **Conclusion:** We implemented it using OOP (`ISentimentAnalyzer`) so that the business can swap it for an ML-based model in the future without changing the rest of the application.

## 5. Dashboard Polling vs. WebSockets
**Decision:** The React frontend dashboard fetches new data every 3 seconds (HTTP Polling).
**Trade-off:**
* **Pros:** Extremely simple to implement and reliable over bad network conditions.
* **Cons:** Creates constant backend traffic.
* **Conclusion:** By implementing a TTL LRU Cache on the backend, we negate the DB load caused by HTTP polling, making WebSockets (which are harder to scale and maintain) unnecessary for this MVP.
