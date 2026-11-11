const router = require('express').Router();
const { z } = require('zod');
const validar = require('../middlewares/validar');
const deepseek = require('../services/deepseek.service');

const preguntaSchema = z.object({
  pregunta: z.string().trim().min(3).max(2000),
});

/**
 * @openapi
 * /api/ia/preguntar:
 *   post:
 *     summary: Envía una pregunta a DeepSeek
 *     tags: [IA]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pregunta'
 *     responses:
 *       200:
 *         description: Respuesta del modelo y uso de tokens
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaIA'
 *       400:
 *         description: Pregunta inválida
 *       429:
 *         description: Límite de solicitudes del proveedor alcanzado
 *       502:
 *         description: DeepSeek no disponible o configuración inválida
 *       503:
 *         description: DeepSeek está temporalmente saturado
 */
router.post('/preguntar', validar(preguntaSchema), async (req, res) => {
  const respuesta = await deepseek.preguntar(req.body.pregunta);
  res.json(respuesta);
});

module.exports = router;