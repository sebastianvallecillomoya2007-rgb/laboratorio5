require('dotenv').config();

const app = require('./app');

const port = Number(process.env.PORT || 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT debe ser un número entero entre 1 y 65535');
}

app.listen(port, () => {
  console.log(`API lista en http://localhost:${port}`);
  console.log(`Documentación: http://localhost:${port}/api-docs`);
});