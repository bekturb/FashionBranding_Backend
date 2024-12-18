import * as swaggerJsdoc from 'swagger-jsdoc';

export const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation For Fashion && Brand',
      version: '1.0.0',
      description: 'Api documentation for Fashion && Brand',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    servers: [
      {
        url: 'http://localhost:5000',
      },
    ],
  },
  apis: ["./src/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);