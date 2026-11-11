module.exports = (schema) => (req, res, next) => {
  const resultado = schema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      errores: resultado.error.issues,
    });
  }

  req.body = resultado.data;
  return next();
};