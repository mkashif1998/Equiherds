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
