// OpenAPI 3.0 description of the Expense Tracker API.
// Swagger UI reads this object and turns it into the interactive page at /api-docs.

// ---------- Reusable pieces (referenced below with $ref) ----------
const schemas = {
  RegisterRequest: {
    type: "object",
    required: ["name", "email", "password"],
    properties: {
      name: { type: "string", example: "vasanth" },
      email: { type: "string", format: "email", example: "vasanth@gamil.com" },
      password: { type: "string", minLength: 6, example: "123456" },
    },
  },
  LoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email", example: "vasanth@gamil.com" },
      password: { type: "string", example: "123456" },
    },
  },
  User: {
    type: "object",
    properties: {
      id: { type: "string", example: "665f1c2e8b3a4d0012ab34cd" },
      name: { type: "string", example: "vasanth" },
      email: { type: "string", example: "vasanth@gamil.com" },
    },
  },
  AuthResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      user: { $ref: "#/components/schemas/User" },
    },
  },
  ExpenseInput: {
    type: "object",
    required: ["title", "amount", "category"],
    properties: {
      title: { type: "string", example: "Lunch" },
      amount: { type: "number", minimum: 0, example: 250 },
      category: { type: "string", example: "Food" },
      date: {
        type: "string",
        format: "date-time",
        description: "Optional. Defaults to the current time.",
        example: "2026-09-29T10:15:00.000Z",
      },
    },
  },
  ExpenseUpdate: {
    type: "object",
    description: "Send only the fields you want to change.",
    properties: {
      title: { type: "string", example: "Team Lunch" },
      amount: { type: "number", minimum: 0, example: 300 },
      category: { type: "string", example: "Office" },
      date: { type: "string", format: "date-time" },
    },
  },
  Expense: {
    type: "object",
    properties: {
      _id: { type: "string", example: "665f1c2e8b3a4d0012ab34cd" },
      title: { type: "string", example: "Lunch" },
      amount: { type: "number", example: 250 },
      category: { type: "string", example: "Food" },
      date: { type: "string", format: "date-time" },
      user: { type: "string", description: "Id of the owner", example: "665f1b0a8b3a4d0012ab3400" },
      __v: { type: "integer", example: 0 },
    },
  },
  ExpenseList: {
    type: "object",
    properties: {
      data: { type: "array", items: { $ref: "#/components/schemas/Expense" } },
      page: { type: "integer", example: 1 },
      limit: { type: "integer", example: 5 },
      total: { type: "integer", description: "Matching expenses across all pages", example: 12 },
      totalPages: { type: "integer", example: 3 },
    },
  },
  MessageResponse: {
    type: "object",
    properties: {
      message: { type: "string", example: "Deleted Successfully" },
    },
  },
  ErrorResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      message: { type: "string", example: "expense not found" },
    },
  },
  ValidationErrorResponse: {
    type: "object",
    properties: {
      errors: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: { type: "string", example: "amount" },
            message: { type: "string", example: "amount must be a number" },
          },
        },
      },
    },
  },
  TotalAnalytics: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      totalAmount: { type: "number", example: 2210 },
      averageAmount: { type: "number", example: 552.5 },
      count: { type: "integer", example: 4 },
    },
  },
  CategoryAnalytics: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      result: {
        type: "array",
        items: {
          type: "object",
          properties: {
            category: { type: "string", example: "Food" },
            total: { type: "number", example: 650 },
            count: { type: "integer", example: 2 },
          },
        },
      },
    },
  },
  MonthlyAnalytics: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      data: {
        type: "array",
        items: {
          type: "object",
          properties: {
            year: { type: "integer", example: 2026 },
            month: { type: "integer", example: 7 },
            total: { type: "number", example: 9050 },
            count: { type: "integer", example: 2 },
          },
        },
      },
    },
  },
};

const responses = {
  Unauthorized: {
    description: "Not logged in, or the token is invalid or expired",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        example: { success: false, message: "please login" },
      },
    },
  },
  NotFound: {
    description: "Expense not found (or it belongs to another user)",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        example: { success: false, message: "expense not found" },
      },
    },
  },
  BadRequest: {
    description: "Invalid input",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  },
  ValidationFailed: {
    description: "Request validation failed. Every problem is listed.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
      },
    },
  },
};

const idParam = {
  name: "id",
  in: "path",
  required: true,
  description: "MongoDB id of the expense (24 hex characters)",
  schema: { type: "string", example: "665f1c2e8b3a4d0012ab34cd" },
};

const secured = [{ cookieAuth: [] }];

// ---------- The spec ----------
const spec = {
  openapi: "3.0.3",
  info: {
    title: "Expense Tracker API",
    version: "1.0.0",
    description:
      "REST API for tracking personal expenses.\n\n" +
      "**Authentication:** log in with `POST /api/auth/login` (or register). " +
      "The server stores a JWT in an HTTP-only cookie named `token`, and the browser sends it automatically. " +
      "Every `/api/expenses` and `/api/analytics` route needs it.\n\n" +
      "**Trying it in this page:** run login or register first using *Try it out*. " +
      "The cookie is then sent with your next requests.",
  },
  servers: [{ url: "/", description: "Current server" }],
  tags: [
    { name: "Auth", description: "Register, log in, log out" },
    { name: "Expenses", description: "Your own expenses (login required)" },
    { name: "Analytics", description: "Totals and groupings of your expenses (login required)" },
  ],
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        description: "Creates the user and logs them in by setting the `token` cookie.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
        },
        responses: {
          201: {
            description: "User created and logged in",
            headers: { "Set-Cookie": { description: "HTTP-only `token` cookie", schema: { type: "string" } } },
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          409: {
            description: "Email already registered",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: {
          200: {
            description: "Logged in",
            headers: { "Set-Cookie": { description: "HTTP-only `token` cookie", schema: { type: "string" } } },
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: {
            description: "Wrong email or password (the same message is used for both)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { success: false, message: "Invalid credentials" },
              },
            },
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out (clears the cookie)",
        responses: {
          200: {
            description: "Logged out",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "successfully logged out" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the logged-in user",
        security: secured,
        responses: {
          200: {
            description: "The current user",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    "/api/expenses": {
      get: {
        tags: ["Expenses"],
        summary: "List your expenses",
        description:
          "Supports pagination, sorting, exact filtering by category, and partial title search. " +
          "All options can be combined.",
        security: secured,
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          {
            name: "limit",
            in: "query",
            description: "Items per page (maximum 100)",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 5 },
          },
          {
            name: "sort",
            in: "query",
            description:
              "Field to sort by: `amount`, `date` or `title`. Prefix with `-` for descending " +
              "(for example `-amount`). Separate several with commas. Default: newest first.",
            schema: { type: "string", example: "-amount" },
          },
          {
            name: "category",
            in: "query",
            description: "Exact, case-sensitive match",
            schema: { type: "string", example: "Food" },
          },
          {
            name: "search",
            in: "query",
            description: "Case-insensitive match anywhere in the title",
            schema: { type: "string", example: "lunch" },
          },
        ],
        responses: {
          200: {
            description: "One page of expenses",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ExpenseList" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Expenses"],
        summary: "Create an expense",
        security: secured,
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ExpenseInput" } } },
        },
        responses: {
          201: {
            description: "Created. The owner is always the logged-in user.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Expense" } } },
          },
          400: { $ref: "#/components/responses/ValidationFailed" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/expenses/{id}": {
      get: {
        tags: ["Expenses"],
        summary: "Get one expense",
        security: secured,
        parameters: [idParam],
        responses: {
          200: {
            description: "The expense",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Expense" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Expenses"],
        summary: "Update an expense (partial)",
        description: "Only the fields you send are changed. The owner cannot be changed.",
        security: secured,
        parameters: [idParam],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ExpenseUpdate" } } },
        },
        responses: {
          200: {
            description: "The updated expense",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Expense" } } },
          },
          400: {
            description: "Invalid id, or the request validation failed",
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    { $ref: "#/components/schemas/ErrorResponse" },
                    { $ref: "#/components/schemas/ValidationErrorResponse" },
                  ],
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Expenses"],
        summary: "Delete an expense",
        security: secured,
        parameters: [idParam],
        responses: {
          200: {
            description: "Deleted",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    "/api/analytics/total": {
      get: {
        tags: ["Analytics"],
        summary: "Total, average and count of your expenses",
        security: secured,
        responses: {
          200: {
            description: "Overall statistics (zeros if you have no expenses)",
            content: { "application/json": { schema: { $ref: "#/components/schemas/TotalAnalytics" } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/analytics/category": {
      get: {
        tags: ["Analytics"],
        summary: "Spending per category, biggest first",
        security: secured,
        responses: {
          200: {
            description: "One entry per category",
            content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryAnalytics" } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/analytics/monthly": {
      get: {
        tags: ["Analytics"],
        summary: "Spending per month, oldest first",
        description:
          "Months are calculated in UTC. The result is cached in Redis for a short time " +
          "and refreshed automatically whenever you create, update or delete an expense.",
        security: secured,
        responses: {
          200: {
            description: "One entry per year and month",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MonthlyAnalytics" } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description: "JWT in an HTTP-only cookie. It is set by the login and register routes.",
      },
    },
    schemas,
    responses,
  },
};

export default spec;