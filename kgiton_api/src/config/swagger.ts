import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KGiTON API - License & Token Management',
      version: '1.0.0',
      description: 'API documentation for KGiTON license key and token management system.',
      contact: {
        name: 'KGiTON API Support',
        email: 'support@kgiton.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token from /api/auth/login',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'Enter your API key from registration',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              type: 'object',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints (register, login, verify email)',
      },
      {
        name: 'License Keys',
        description: 'License key management (Super Admin only)',
      },
      {
        name: 'User',
        description: 'User profile and license information',
      },
      {
        name: 'Top-up',
        description: 'Token balance top-up via payment gateway (Winpay/Xendit/Midtrans)',
      },
      {
        name: 'Webhook',
        description: 'Internal payment webhook endpoints (called by payment gateway)',
      },
      {
        name: 'Webhook - Universal',
        description: 'Universal callback endpoint for all payment gateways',
      },
      {
        name: 'Webhook - Winpay',
        description: 'Winpay specific callback endpoints (VA & Checkout)',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
