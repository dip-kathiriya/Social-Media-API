# Core
npm install express mongoose dotenv

# Security & Auth
npm install bcryptjs jsonwebtoken cookie-parser cors helmet

# Utilities
npm install morgan uuid
npm install express-async-errors  # catches async errors automatically

# Dev tools
npm install --save-dev nodemon



# Use:
What each package does:

express — web framework, handles HTTP routing
mongoose — ODM (Object Document Mapper) for MongoDB; lets you define schemas and query with JS
dotenv — loads .env file into process.env
bcryptjs — hashes passwords so you never store plain text
jsonwebtoken — creates and verifies JWT tokens for auth
cookie-parser — parses cookies from incoming requests
cors — allows/blocks which origins (domains) can call your API
helmet — sets security HTTP headers automatically
morgan — logs every HTTP request (method, url, status, time)
uuid — generates unique IDs
express-async-errors — patches Express so async errors auto-go to error handler
nodemon — restarts server on file save during dev



mkdir -p src/{config,controllers,services,models,routes,middlewares,utils,validators}
touch src/app.js src/server.js
touch .env .env.example .gitignore


social-api/
├── src/
│   ├── config/          ← DB connection, env config
│   ├── controllers/     ← HTTP layer (req, res)
│   ├── services/        ← Business logic
│   ├── models/          ← Mongoose schemas
│   ├── routes/          ← Express routers
│   ├── middlewares/     ← Auth, error handler, rate limiter
│   ├── utils/           ← Helper functions (token gen, response formatter)
│   ├── validators/      ← Input validation logic
│   ├── app.js           ← Express app setup
│   └── server.js        ← Entry point, starts HTTP server
├── .env
├── .env.example
├── .gitignore
└── package.json