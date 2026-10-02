# Expense Tracker API

A REST API for managing personal expenses built with **Node.js, Express.js, MongoDB, and Redis**.

## Features

* User registration and login
* JWT authentication with HTTP-only cookies
* Create, read, update, and delete expenses
* Pagination
* Sorting
* Filtering
* Search
* Expense analytics
* Redis caching
* Input validation and error handling
* Swagger / OpenAPI documentation
* Jest and Supertest testing
* Docker support
* Deployment on Render

## Tech Stack

* Node.js
* Express.js
* MongoDB / Mongoose
* Redis
* JWT
* bcrypt
* Jest / Supertest
* Swagger / OpenAPI
* Docker

## API Routes

### Authentication

| Method | Endpoint             | Description         |
| ------ | -------------------- | ------------------- |
| POST   | `/api/auth/register` | Register a new user |
| POST   | `/api/auth/login`    | Login user          |
| GET    | `/api/auth/me`       | Get current user    |
| POST   | `/api/auth/logout`   | Logout user         |

### Expenses

| Method | Endpoint            | Description          |
| ------ | ------------------- | -------------------- |
| POST   | `/api/expenses`     | Create an expense    |
| GET    | `/api/expenses`     | Get expenses         |
| GET    | `/api/expenses/:id` | Get a single expense |
| PATCH  | `/api/expenses/:id` | Update an expense    |
| DELETE | `/api/expenses/:id` | Delete an expense    |

### Analytics

| Method | Endpoint                  | Description                   |
| ------ | ------------------------- | ----------------------------- |
| GET    | `/api/analytics/total`    | Get total expenses            |
| GET    | `/api/analytics/category` | Get expenses by category      |
| GET    | `/api/analytics/monthly`  | Get monthly expense analytics |

## Swagger Documentation

Interactive Swagger API documentation:

[Open Swagger API Documentation](https://expense-track-api-qgbm.onrender.com/api-docs/?utm_source=chatgpt.com)

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/vasanth038/expense-track-api.git
cd expense-track-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file and add your MongoDB, JWT, and Redis configuration.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
REDIS_URL=your_redis_connection_string
```

### 4. Start the server

```bash
npm start
```

The API will be available locally at:

```text
http://localhost:5000
```

## Docker

Build and start the application:

```bash
docker compose up --build
```

Stop the containers:

```bash
docker compose down
```

## Testing

Run the test suite:

```bash
npm test
```

The project uses:

* Jest
* Supertest

for API testing.

## Deployment

The API is deployed using:

* GitHub
* Render
* MongoDB Atlas
* Redis

### Live Swagger Documentation

[https://expense-track-api-qgbm.onrender.com/api-docs/](https://expense-track-api-qgbm.onrender.com/api-docs/?utm_source=chatgpt.com)

## Author

**Vasanth Kumar**

GitHub: https://github.com/vasanth038
