const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/errors');

const app = express();

app.use(express.json({ limit: '16kb' }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/notas', require('./routes/notas.routes'));
app.use('/api/ia', require('./routes/ia.routes'));

app.use((req, res, next) => {
  next(new AppError(404, 'Ruta no encontrada'));
});
app.use(errorHandler);

module.exports = app;