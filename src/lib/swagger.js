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
      },
    },
  },
  apis: ["./src/app/api/**/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
