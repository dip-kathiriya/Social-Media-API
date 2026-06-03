# 🚀 Social Media API

A production-grade RESTful Social Media API built with **Node.js**, **Express**, and **MongoDB** — designed from the ground up using industry-standard architecture, security practices, and scalability patterns.

> This project is being built as a structured learning exercise covering everything from Express internals to MongoDB schema design, auth systems, file uploads, pagination, rate limiting, and deployment-ready architecture.

---

## 🧱 Architecture

This project follows a strict **Layered Architecture** pattern:

```
Request → Router → Controller → Service → Model → MongoDB
```

| Layer | Responsibility |
|---|---|
| **Router** | Define routes only. Zero logic. |
| **Controller** | Handle HTTP (req/res). Call services. |
| **Service** | All business logic lives here. |
| **Model** | Mongoose schemas + DB query methods. |
| **Middleware** | Auth, error handling, rate limiting, validation. |

---

## 📁 Folder Structure

```
social-api/
├── src/
│   ├── config/           # DB connection, env config
│   ├── controllers/      # HTTP layer — reads req, sends res
│   ├── services/         # Business logic — pure functions
│   ├── models/           # Mongoose schemas + indexes
│   ├── routes/           # Express routers
│   ├── middlewares/      # Auth, error handler, rate limiter
│   ├── utils/            # ApiResponse, ApiError, helpers
│   ├── validators/       # Input validation schemas
│   ├── app.js            # Express app setup + middleware stack
│   └── server.js         # Entry point — boots DB then HTTP server
├── .env.example
├── .gitignore
└── package.json
```

---

## ⚙️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js v20 | JavaScript runtime |
| Express v5 | HTTP framework |
| MongoDB | Primary NoSQL database |
| Mongoose | ODM — schema modeling + queries |
| JWT (jsonwebtoken) | Stateless authentication — access + refresh tokens |
| bcryptjs | Password hashing |
| helmet | HTTP security headers |
| cors | Cross-origin resource sharing |
| morgan | HTTP request logger |
| cookie-parser | Parse cookies (refresh token) |
| dotenv | Environment variable loader |
| nodemon | Dev server with auto-restart |

---

## 🔐 Auth Strategy

- **Access Token** — short-lived (15 min), sent in `Authorization: Bearer` header
- **Refresh Token** — long-lived (7 days), stored in `httpOnly` cookie
- Separate secrets for each token type
- Token rotation on refresh

---

## 📦 Features (Progressive Build)

- [x] Project scaffolding + layered architecture
- [x] MongoDB connection with error handling
- [x] Global error handler with Mongoose error normalization
- [x] Standardized `ApiResponse` / `ApiError` utilities
- [ ] User model + schema design
- [ ] Auth — register, login, logout, refresh token
- [ ] Post CRUD with pagination
- [ ] Comments system
- [ ] Like / Unlike
- [ ] Follow / Unfollow
- [ ] File upload (profile picture, post images)
- [ ] Rate limiting
- [ ] Input validation middleware
- [ ] Search with MongoDB text indexes

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB running locally or MongoDB Atlas URI

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/social-api.git
cd social-api

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Fill in your values in .env
```

### Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/social-api
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
```

### Run

```bash
# Development (auto-restart on save)
npm run dev

# Production
npm start
```

### Health Check

```
GET http://localhost:5000/health
```

```json
{ "status": "OK", "timestamp": "2026-06-03T..." }
```

---

## 📐 API Design Conventions

- All routes prefixed with `/api/v1/`
- All responses follow this shape:

**Success:**
```json
{
  "success": true,
  "message": "User created",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Email already exists",
  "errors": []
}
```

---

## 🧠 Learning Goals

This project is being built to master:

- Express 5 internals and middleware chain
- MongoDB schema design from first principles
- JWT auth with refresh token rotation
- Mongoose performance — indexes, projections, lean queries
- Layered architecture and separation of concerns
- Industry-standard error handling and API response design
- Pagination strategies (cursor vs offset)
- File upload handling
- Rate limiting and security hardening

---

## 📄 License

MIT
