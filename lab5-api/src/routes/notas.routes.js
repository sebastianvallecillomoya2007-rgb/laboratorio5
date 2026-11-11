const router = require('express').Router();
const { z } = require('zod');
const validar = require('../middlewares/validar');
const notas = require('../services/notas.service');
const deepseek = require('../services/deepseek.service');

const notaSchema = z.object({
  titulo: z.string().trim().min(1).max(100),
  contenido: z.string().trim().min(1).max(5000),
});

/**
 * @openapi
 * /api/notas:
 *   get:
 *     summary: Lista todas las notas
 *     tags: [Notas]
 *     responses:
 *       200:
 *         description: Lista de notas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Nota'
 */
router.get('/', (req, res) => {
  res.json(notas.listar());
});

/**
 * @openapi
 * /api/notas:
 *   post:
 *     summary: Crea una nota
 *     tags: [Notas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NuevaNota'
 *     responses:
 *       201:
 *         description: Nota creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Nota'
 *       400:
 *         description: Datos inválidos
 */
router.post('/', validar(notaSchema), (req, res) => {
  res.status(201).json(notas.crear(req.body));
});

/**
 * @openapi
 * /api/notas/{id}:
 *   get:
 *     summary: Obtiene una nota por su ID
 *     tags: [Notas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Nota encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Nota'
 *       404:
 *         description: Nota no encontrada
 */
router.get('/:id', (req, res) => {
  res.json(notas.buscar(Number(req.params.id)));
});

/**
 * @openapi
 * /api/notas/{id}:
 *   delete:
 *     summary: Elimina una nota
 *     tags: [Notas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Nota eliminada
 *       404:
 *         description: Nota no encontrada
 */
router.delete('/:id', (req, res) => {
  notas.eliminar(Number(req.params.id));
  res.status(204).end();
});

/**
 * @openapi
 * /api/notas/{id}/resumen:
 *   post:
 *     summary: Resume el contenido de una nota en tres viñetas
 *     tags: [IA, Notas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resumen generado por DeepSeek
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [notaId, resumen]
 *               properties:
 *                 notaId:
 *                   type: integer
 *                 resumen:
 *                   type: string
 *       404:
 *         description: Nota no encontrada; no se consulta DeepSeek
 *       429:
 *         description: Límite de solicitudes del proveedor alcanzado
 *       502:
 *         description: DeepSeek no disponible o configuración inválida
 *       503:
 *         description: DeepSeek está temporalmente saturado
 */
router.post('/:id/resumen', async (req, res) => {
  const nota = notas.buscar(Number(req.params.id));
  const respuesta = await deepseek.preguntar(
    nota.contenido,
    'Resume el texto en 3 viñetas breves, en español.',
  );

  res.json({ notaId: nota.id, resumen: respuesta.respuesta });
});

module.exports = router;