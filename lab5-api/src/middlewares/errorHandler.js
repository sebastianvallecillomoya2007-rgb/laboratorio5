const OpenAI = require('openai');
const AppError = require('../utils/errors');

module.exports = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    if (err.status >= 500) {
      console.error(err);
    }

    return res.status(err.status).json({ error: err.message });
  }

  if (
    err instanceof OpenAI.APIError ||
    err instanceof OpenAI.APIConnectionError
  ) {
    console.error('Error de DeepSeek:', err.status || 'conexión', err.message);

    const status =
      err.status === 429
        ? 429
        : err.status === 503 || err.status === 529
          ? 503
          : 502;

    return res.status(status).json({ error: 'IA_NO_DISPONIBLE' });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }

  if (err.type === 'entity.too.large') {
    return res
      .status(413)
      .json({ error: 'El cuerpo de la solicitud es demasiado grande' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Error interno' });
};