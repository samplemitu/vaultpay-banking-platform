
# 🚀 **1 — TECHNOLOGIES USED (FULL STACK OF VAULTPAY)**

### **🔹 Core Backend Technology**

| Technology                   | Why Used                                                                |
| ---------------------------- | ----------------------------------------------------------------------- |
| **Node.js + TypeScript**     | Strong type safety + enterprise coding patterns                         |
| **Express.js**               | Fast, minimal HTTP framework with middleware ecosystem                  |
| **MongoDB**                  | Distributed database with per-service autonomy                          |
| **Redis**                    | Used for: idempotency, rate limiting, OTP, anti-fraud velocity tracking |
| **NATS JetStream**           | Event-driven communication, durable messaging, saga orchestration       |
| **Kubernetes**               | For scalable deployment and zero-downtime services                      |
| **Docker**                   | Containerized microservices                                             |
| **Bcrypt.js**                | Secure password hashing                                                 |
| **Crypto (AES-256)**         | Bank-grade encryption for sensitive fields                              |
| **JWT (Access + Refresh)**   | Secure auth session with device fingerprinting                          |
| **Zod / Validation library** | Request validation (optional)                                           |

---

# 🧱 **2 — SYSTEM ARCHITECTURE (ENTERPRISE-GRADE)**

VaultPay follows **5 core architecture principles**:

## **1️⃣ Microservices Architecture**

Each domain is isolated into its own service:

* Auth Service
* API Gateway
* Account Service
* Transaction Service
* Fraud Service
* Audit Service

👉 *This ensures each service can scale independently, be deployed independently, and fail independently.*

---

## **2️⃣ Event-driven architecture (via JetStream)**

Every important action in the system emits events:

Examples:

* `auth.user.created`
* `transaction.initiated`
* `debit.requested`
* `fraud.check.requested`
* `fraud.result`
* `transaction.completed`
* `gateway.request.logged`

💡 This creates a **reactive**, **fault-tolerant**, and **loosely-coupled** ecosystem.

---

## **3️⃣ Saga Pattern (Distributed Transaction Handling)**

Used in **Transaction Service** to guarantee money movement consistency:

### Saga steps:

1. User starts transfer → `transaction.initiated`
2. Debit account → `debit.requested`
3. Fraud check → `fraud.check.requested`
4. If passed → Credit account → `credit.requested`
5. Transaction Completed → `transaction.completed`
6. If failed at any step → Compensation (rollback debit)

👉 This enables **distributed ACID transactions across microservices**.

---

## **4️⃣ Per-Service Database & DDD**

Each service has its own MongoDB database, promoting:

* DDD isolation
* No accidental cross-domain coupling
* Event-based sync instead of shared DB

This is how **Stripe, Uber, Amazon** structure their systems.

---

## **5️⃣ Zero-trust Communication**

No service trusts another service automatically.

API Gateway enforces:

* JWT validation
* Role check
* Device fingerprint match
* Rate limiting
* Correlation IDs for distributed tracing

Backend services ONLY trust **validated JetStream events**.

---

# 🔐 **3 — FULL SECURITY STACK (BANK-GRADE)**

Here is the complete security system implemented:

---

## **1️⃣ JWT Authentication (Access + Refresh tokens)**

### ACCESS TOKEN:

* Short-lived (15m)
* Contains: userId, role, deviceId

### REFRESH TOKEN:

* Long-lived (7 days)
* Rotate on every refresh (prevents token theft)

### Token Theft Protection:

* DeviceID embedded in JWT
* If token used on different device → FRAUD FLAG

---

## **2️⃣ Device Fingerprinting**

Every login stores a device signature:

`devices[] array`

Used by:

* Auth service (trusted device system)
* Fraud service (device mismatch rule)
* API Gateway (zero-trust validation)

---

## **3️⃣ MFA with OTP (Redis-backed)**

* OTP stored in Redis with 5-min TTL
* One-time use (deleted after consumption)
* Prevents brute force via TTL + rate limiting

---

## **4️⃣ AES-256 Encryption**

Used in:

* Account numbers
* Phone numbers
* Sensitive user data

AES-256-CBC with IV makes attacks very difficult.

---

## **5️⃣ Rate Limiting (IP + User-level)**

At API Gateway via Redis:

* Prevents DDoS
* Prevents brute force login attempts
* Prevents excessive transaction initiation

---

## **6️⃣ Role Based Access Control (RBAC)**

Two roles:

* **admin**: access audit, fraud dashboard
* **customer**: normal banking ops

Enforced at API Gateway → zero-trust model.

---

## **7️⃣ Immutable Audit Logs**

Audit service stores:

* Every request
* Every user action
* Every event result
* No update/delete allowed (append-only DB)

This ensures:

* Compliance (bank regulations)
* Security investigations
* Fraud traceability

---

# 📡 **4 — COMMUNICATION SYSTEM: NATS JETSTREAM**

### Benefits:

* Durable messages
* Replay events
* Stream persistence
* DLQ (Dead Letter Queue)
* Consumer groups (horizontal scaling)
* Backpressure handling

### Durable Consumers used:

* fraud-workers
* audit-workers
* transaction-workers

JetStream makes the system **fault-tolerant and eventually consistent**.

---

# 💵 **5 — ACCOUNT SERVICE (BANK DOMAIN)**

### Features:

* AES-encrypted account number
* Savings & Current accounts
* idempotency on account creation
* balance stored in **integer paise** (bank standard)
* emits `account.created` event

### Safety:

* No shared DB access
* All updates atomic
* Events used for asynchronous sync

---

# 🔁 **6 — TRANSACTION SERVICE (THE HEART OF THE SYSTEM)**

### Supports:

* idempotency keys
* event-driven saga
* debit/credit orchestration
* fraud check integration

### Guarantees:

* No double spend
* No partial transactions
* No inconsistent state
* All steps auditable

This is **exactly** how UPI/Stripe-like systems work.

---

# 🛡️ **7 — FRAUD SERVICE (REAL-TIME RISK ENGINE)**

### Rules implemented:

* High Amount Risk
* Rapid Transfer Velocity
* Device Mismatch
* Behavioral scoring

Each rule returns:

* risk score
* optional reason

Fraud Evaluator merges all rules → final decision.

### Benefits:

* pluggable rules
* scalable
* machine-learning ready
* real-time detection

---

# 🧾 **8 — AUDIT SERVICE (IMMUTABLE EVENT HISTORY)**

### Stores:

* request logs from gateway
* transaction events
* fraud outcomes
* user registration events

### Properties:

* append-only
* no updates/deletes
* chronological ordering
* correlation ID support

This is **enterprise-grade compliance architecture**.

---

# 🧠 **9 — API GATEWAY (THE BRAIN OF SECURITY)**

### Responsibilities:

* JWT validation
* role enforcement
* correlation ID injection
* rate limiting
* service routing
* publish request logs to JetStream

### Essentially acts like:

* Cloudflare
* Kong API Gateway
* AWS API Gateway

But fully custom-built.

---

# 🧩 **10 — DESIGN PATTERNS USED**

| Pattern                      | Where Used                         |
| ---------------------------- | ---------------------------------- |
| **Microservices**            | Entire architecture                |
| **Event-driven**             | JetStream communication            |
| **Saga Pattern**             | Transaction consistency            |
| **Outbox Pattern**           | Publishing events from services    |
| **Idempotency**              | Transaction + Account services     |
| **Zero-trust**               | API Gateway security               |
| **Circuit Breaker (future)** | Optional                           |
| **Durable Consumers**        | Fraud, Audit, Transaction services |

---

