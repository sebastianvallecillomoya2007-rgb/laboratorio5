# Laboratorio 5: API de notas con DeepSeek

API REST de backend para administrar notas en memoria y consultar DeepSeek. No incluye un frontend propio; Swagger UI sirve como documentación interactiva y cliente de pruebas.

## Integrantes

- Integrante A — API de notas y documentación: **[completar nombre]**
- Integrante B — integración con DeepSeek: **[completar nombre]**

## Requisitos

- Node.js 20 o superior.
- La API key de DeepSeek que proporcionará el docente.

## Instalación y ejecución

Desde esta carpeta (`lab5-api`):

```bash
npm install
```

Copien `.env.example` a `.env` y configuren localmente la clave entregada por el docente. No compartan ni suban `.env`.

```env
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
PORT=3000
```

Si el docente proporciona una URL base o un modelo distintos, configuren `DEEPSEEK_BASE_URL` y `DEEPSEEK_MODEL` en `.env`. La clave solo se usa en el backend.

```bash
npm run dev
```

La documentación y las pruebas manuales están en `http://localhost:3000/api-docs`. Para iniciar sin modo de desarrollo, ejecuten `npm start`. Las notas viven en memoria y se eliminan al reiniciar el servidor.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/notas` | Lista las notas |
| GET | `/api/notas/:id` | Obtiene una nota |
| POST | `/api/notas` | Crea una nota con `titulo` y `contenido` |
| DELETE | `/api/notas/:id` | Elimina una nota |
| POST | `/api/ia/preguntar` | Envía una pregunta a DeepSeek |
| POST | `/api/notas/:id/resumen` | Resume una nota en tres viñetas |
| GET | `/api-docs` | Abre Swagger UI |

Ejemplos de cuerpos JSON:

```json
{
  "titulo": "Apuntes de Express",
  "contenido": "Express permite crear rutas y middleware para una API."
}
```

```json
{
  "pregunta": "¿Qué diferencia hay entre una ruta y un middleware?"
}
```

La respuesta de IA incluye `uso.input_tokens`, `uso.output_tokens` y `uso.total_tokens` cuando el proveedor devuelve esos datos. Los errores del proveedor se registran en el servidor; la respuesta pública es genérica y nunca incluye la clave.

## Pruebas

```bash
npm test
```

En Swagger UI, verifiquen creación/listado de notas, validación de cuerpos, IDs inexistentes, eliminación, una pregunta y un resumen. Para las llamadas reales a DeepSeek se necesita la clave del docente. Guarden las capturas de las pruebas marcadas en `docs/` antes de entregar.

## Reflexiones para completar con las pruebas del equipo

1. **¿Por qué la API key no puede estar en el frontend?** Una clave incluida en código JavaScript o en una solicitud del navegador puede inspeccionarse desde el navegador o la red y ser reutilizada por cualquier persona. El backend la mantiene en `.env` y no la envía al cliente.
2. **¿Qué responde la API si DeepSeek devuelve 401?** Responde `502` con `{"error":"IA_NO_DISPONIBLE"}` y deja el detalle para los registros del servidor. El 401 del proveedor indica un problema con las credenciales del servidor; no debe revelar errores internos ni confundirse con la autenticación del cliente de esta API.
3. **¿Qué diferencia hay entre `system` y `messages`?** `system` define el comportamiento esperado del modelo; el mensaje `user` contiene la solicitud concreta. En el resumen se usa la instrucción “Resume el texto en 3 viñetas breves, en español” como `system` y el contenido de la nota como mensaje del usuario.
4. **Tokens de dos llamadas reales:** completen después de probar con la clave del docente: llamada 1 (`input_tokens`: ___, `output_tokens`: ___); llamada 2 (`input_tokens`: ___, `output_tokens`: ___). `max_tokens` limita la longitud de la respuesta generada.
5. **¿Qué pasaría sin validar el body?** Se podrían enviar solicitudes vacías, demasiado largas o con tipos incorrectos al modelo, consumiendo créditos innecesariamente; además, las rutas podrían fallar o producir respuestas inconsistentes al procesar datos inesperados.
6. **Conflicto de Git y resolución:** describan el conflicto que ocurrió realmente al integrar `feature/notas` y `feature/ia`, cómo lo resolvieron y el pull request revisado: **[completar con la experiencia del equipo]**.

## Entrega pendiente del equipo

Completen los nombres, registren los tokens de dos llamadas reales, describan la integración de ramas y agreguen las capturas de Swagger. No incluyan la API key en el README, las capturas ni el historial de Git.