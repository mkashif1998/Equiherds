import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Next.js User API",
      version: "1.0.0",
    },
    components: {
      schemas: {
        Schedule: {
          type: "object",
          required: ["day", "startTime", "endTime"],
          properties: {
            day: { type: "string", example: "Monday" },
            startTime: { type: "string", example: "09:00" },
            endTime: { type: "string", example: "17:00" },
          },
        },
        Trainer: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            title: { type: "string" },
            details: { type: "string" },
            price: { type: "number" },
            schedule: { $ref: '#/components/schemas/Schedule' },
            images: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        TrainerInput: {
          type: "object",
          required: ["userId", "title", "details", "price", "schedule"],
          properties: {
            userId: { type: "string" },
            title: { type: "string" },
            details: { type: "string" },
            price: { type: "number" },
            schedule: { $ref: '#/components/schemas/Schedule' },
            images: { type: "array", items: { type: "string" } },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string" },
            accountType: { type: "string", enum: ["buyer", "seller", "superAdmin"] },
            phoneNumber: { type: "string" },
            companyName: { type: "string" },
            brandImage: { type: "string" },
            companyInfo: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        PriceRate: {
          type: "object",
          required: ["PriceRate", "RateType"],
          properties: {
            PriceRate: { type: "number", example: 100 },
            RateType: { type: "string", example: "hour" },
          },
        },
        Slot: {
          type: "object",
          required: ["date", "startTime", "endTime"],
          properties: {
            date: { type: "string", example: "2025-09-22" },
            startTime: { type: "string", example: "10:00" },
            endTime: { type: "string", example: "12:00" },
          },
        },
        Stable: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            Tittle: { type: "string" },
            Deatils: { type: "string" },
            image: { type: "array", items: { type: "string" } },
            Rating: { type: "number" },
            PriceRate: { $ref: '#/components/schemas/PriceRate' },
            Slotes: { type: "array", items: { $ref: '#/components/schemas/Slot' } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        StableInput: {
          type: "object",
          required: ["userId", "Tittle", "Deatils", "PriceRate"],
          properties: {
            userId: { type: "string" },
            Tittle: { type: "string" },
            Deatils: { type: "string" },
            image: { type: "array", items: { type: "string" } },
            Rating: { type: "number" },
            PriceRate: { $ref: '#/components/schemas/PriceRate' },
            Slotes: { type: "array", items: { $ref: '#/components/schemas/Slot' } },
          },
        },
        Subscription: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string", example: "Premium Plan" },
            price: { type: "number", example: 99.99 },
            discount: { type: "number", example: 10, default: 0 },
            duration: { type: "number", example: 30 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        SubscriptionInput: {
          type: "object",
          required: ["name", "price", "duration"],
          properties: {
            name: { type: "string", example: "Premium Plan" },
            price: { type: "number", example: 99.99 },
            discount: { type: "number", example: 10, default: 0 },
            duration: { type: "number", example: 30 },
          },
        },
      },
    },
  },
  apis: ["./src/app/api/**/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
