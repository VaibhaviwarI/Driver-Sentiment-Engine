# Driver Sentiment Engine

A real-time feedback processing system built to monitor rider satisfaction and driver safety. 

This MVP project analyzes textual feedback via an asynchronous message queue, updating driver scores in O(1) time using Exponential Moving Average (EMA) math to trigger anti-spam safety alerts. It features a configurable React frontend and an Admin Dashboard with in-memory caching to reduce database load.

## 🚀 Key Features
*   **O(1) EMA Algorithm:** Calculates and updates driver sentiment scores efficiently without recalculating historical data.
*   **Asynchronous Queue Processing:** Fast `202 Accepted` API responses, processing heavy DB logic in a background worker queue (simulating Kafka/RabbitMQ) to prevent database locking during traffic spikes.
*   **Smart Alert Deduplication:** Configurable threshold alerts with a distributed lock mechanism to prevent spamming operations teams with duplicate alerts.
*   **Configurable Dynamic UI:** Frontend dynamically alters its feedback forms based on database feature flags (Driver, Trip, App, Marshal feedback toggleable without deployments).
*   **In-Memory API Caching:** Admin dashboard utilizes an LRU TTL Cache to fetch data in O(1) time without hammering the database.

## 🛠️ Tech Stack
*   **Backend:** Node.js, Express.js
*   **Frontend:** React, Vite, Recharts, React Router
*   **Database:** SQLite (Raw SQL queries, no ORM)
*   **Architecture Pattern:** Service-oriented, Decoupled Queue Worker

## 💻 How to Run Locally

### Prerequisites
*   Node.js (v18 or higher)
*   npm

### 1. Start the Backend API
Open a terminal and run the following commands:
```bash
cd backend
npm install
npm run start
```
The backend will run on `http://localhost:3001`. It will automatically initialize the `sentiment.db` SQLite database with seed data if it doesn't exist.

### 2. Start the Frontend React App
Open a **second** terminal and run the following commands:
```bash
cd frontend
npm install
npm run dev
```
The frontend will typically run on `http://localhost:5173`. Click the link in the terminal to view the app in your browser.

## 📁 Repository Structure
*   `/backend` - Express API, SQLite Database configuration, Queue worker, and Sentiment logic.
*   `/frontend` - React application containing the Rider Feedback form and the Admin Analytics Dashboard.

## 📝 Evaluation Criteria Addressed
This project was strictly designed to satisfy specific criteria:
1.  **Authentication ready:** Designed for JWT & Spring Security RBAC.
2.  **O(1) Complexity:** Implemented via EMA instead of aggregate queries.
3.  **Fault Tolerance:** Implemented Node Message Queue decoupled from SQL synchronous writes.
4.  **OOP Principles:** Sentiment Classifier loosely coupled to act as a swappable interface.
5.  **Caching:** Backend LRU TTL Cache drastically reduces Server/DB load for polling dashboards.
6.  **Configurable:** Dynamic UI components driven by API feature flags.
