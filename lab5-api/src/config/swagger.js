const path = require('node:path');
const swaggerJsdoc = require('swagger-jsdoc');
const routesGlob = path
  .join(__dirname, '..', 'routes', '*.js')
  .replace(/\\/g, '/');

module.exports = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Laboratorio 5: Notas e IA con DeepSeek',
      version: '1.0.0',
      description:
        'API backend para administrar notas y consultar DeepSeek. No requiere un frontend propio.',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
    tags: [
      { name: 'Notas', description: 'Operaciones sobre notas en memoria' },
      { name: 'IA', description: 'Operaciones que consultan DeepSeek' },
    ],
    components: {
      schemas: {
        Nota: {
          type: 'object',
          required: ['id', 'titulo', 'contenido'],
          properties: {
            id: { type: 'integer', example: 1 },
            titulo: { type: 'string', example: 'Apuntes de Express' },
            contenido: {
              type: 'string',
              example: 'Express permite crear rutas y middleware para una API.',
            },
          },
        },
        NuevaNota: {
          type: 'object',
          required: ['titulo', 'contenido'],
          properties: {
            titulo: { type: 'string', minLength: 1, maxLength: 100 },
            contenido: { type: 'string', minLength: 1, maxLength: 5000 },
          },
        },
        Pregunta: {
          type: 'object',
          required: ['pregunta'],
          properties: {
            pregunta: { type: 'string', minLength: 3, maxLength: 2000 },
          },
        },
        RespuestaIA: {
          type: 'object',
          required: ['respuesta', 'uso'],
          properties: {
            respuesta: { type: 'string' },
            uso: {
              type: 'object',
              nullable: true,
              properties: {
                input_tokens: { type: 'integer' },
                output_tokens: { type: 'integer' },
                total_tokens: { type: 'integer' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  },
  apis: [routesGlob],
});