# MWAS Backend

A modern Express.js backend built with Bun, featuring CORS, MongoDB integration with Mongoose, and a complete REST API.

## Features

- ✅ Express.js server with TypeScript
- ✅ CORS enabled for cross-origin requests
- ✅ Body-parser middleware (built into Express)
- ✅ MongoDB connection with Mongoose
- ✅ Complete CRUD API for users
- ✅ Environment variable support
- ✅ Error handling middleware
- ✅ Health check endpoint

## Prerequisites

- [Bun](https://bun.sh/) installed
- MongoDB running locally or MongoDB Atlas connection

## Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Create environment file:**
   Create a `.env` file in the backend directory with:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/mwas
   NODE_ENV=development
   ```

3. **Start MongoDB:**
   Make sure MongoDB is running on your system or use MongoDB Atlas.

## Running the Server

**Development mode (with auto-reload):**
```bash
bun run dev
```

**Production mode:**
```bash
bun run start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Base URLs
- **Server:** `http://localhost:3000`
- **Health Check:** `http://localhost:3000/health`
- **API Base:** `http://localhost:3000/api`

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| POST | `/api/users` | Create a new user |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update user by ID |
| DELETE | `/api/users/:id` | Delete user by ID |

### Example Requests

**Create a user:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

**Get all users:**
```bash
curl http://localhost:3000/api/users
```

**Health check:**
```bash
curl http://localhost:3000/health
```

## Project Structure

```
backend/
├── index.ts          # Main server file
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── .env              # Environment variables (create this)
└── README.md         # This file
```

## Dependencies

- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **mongoose**: MongoDB ODM
- **dotenv**: Environment variable management

## Development

The server includes:
- TypeScript support
- Hot reloading in development
- Comprehensive error handling
- MongoDB connection status monitoring
- RESTful API design patterns
