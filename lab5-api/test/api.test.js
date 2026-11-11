require('dotenv').config();

const assert = require('node:assert/strict');
const http = require('node:http');
const { after, before, test } = require('node:test');
const { createServer } = require('node:http');
const app = require('../src/app');
const swaggerSpec = require('../src/config/swagger');

let apiServer;
let apiPort;
let providerServer;
let providerPort;
let providerStatus = 200;
const providerRequests = [];

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve(server.address().port);
    });
  });
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: apiPort,
        path,
        method,
        headers: payload
          ? {
              'content-type': 'application/json',
              'content-length': Buffer.byteLength(payload),
            }
          : {},
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString();
          let responseBody = text;

          if (text && res.headers['content-type']?.includes('application/json')) {
            try {
              responseBody = JSON.parse(text);
            } catch (error) {
              return reject(error);
            }
          }

          resolve({ status: res.statusCode, body: responseBody });
        });
      },
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

before(async () => {
  providerServer = createServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      providerRequests.push({
        method: req.method,
        url: req.url,
        authorization: req.headers.authorization,
        body: JSON.parse(Buffer.concat(chunks).toString()),
      });

      if (providerStatus !== 200) {
        res.writeHead(providerStatus, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ error: { message: 'detalle privado' } }));
      }

      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(
        JSON.stringify({
          id: 'test-completion',
          object: 'chat.completion',
          created: 1,
          model: process.env.DEEPSEEK_MODEL,
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: { role: 'assistant', content: '- Resumen de prueba' },
            },
          ],
          usage: {
            prompt_tokens: 12,
            completion_tokens: 5,
            total_tokens: 17,
          },
        }),
      );
    });
  });

  providerPort = await listen(providerServer);
  process.env.DEEPSEEK_BASE_URL = `http://127.0.0.1:${providerPort}/v1`;
  process.env.DEEPSEEK_MODEL = 'deepseek-chat';
  process.env.DEEPSEEK_API_KEY = 'test-key-not-real';
  apiServer = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    apiServer.once('error', reject);
    apiServer.once('listening', resolve);
  });
  apiPort = apiServer.address().port;
});

after(async () => {
  await Promise.all(
    [apiServer, providerServer].map(
      (server) =>
        new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

test('Swagger UI publica la especificación y las seis rutas de la API', async () => {
  const page = await request('GET', '/api-docs/');

  assert.equal(page.status, 200);
  assert.match(page.body, /swagger-ui/);
  const operationCount = Object.values(swaggerSpec.paths).reduce(
    (count, path) => count + Object.keys(path).length,
    0,
  );
  assert.equal(operationCount, 6);
  assert.ok(swaggerSpec.paths['/api/notas/{id}/resumen']);
  assert.ok(swaggerSpec.components.schemas.Nota);
});

test('CRUD de notas, validación y errores 404', async () => {
  const primera = await request('POST', '/api/notas', {
    titulo: 'Nota uno',
    contenido: 'Contenido para resumir.',
  });
  const segunda = await request('POST', '/api/notas', {
    titulo: 'Nota dos',
    contenido: 'Contenido secundario.',
  });

  assert.equal(primera.status, 201);
  assert.equal(segunda.status, 201);
  assert.equal((await request('GET', '/api/notas')).body.length, 2);
  assert.deepEqual((await request('GET', `/api/notas/${primera.body.id}`)).body, primera.body);

  const invalida = await request('POST', '/api/notas', {});
  assert.equal(invalida.status, 400);
  assert.ok(invalida.body.errores.length > 0);
  assert.equal((await request('GET', '/api/notas/99')).status, 404);
  assert.equal((await request('DELETE', `/api/notas/${segunda.body.id}`)).status, 204);
  assert.equal((await request('GET', `/api/notas/${segunda.body.id}`)).status, 404);
  assert.equal((await request('GET', '/ruta-inexistente')).status, 404);
});

test('valida solicitudes de IA y evita llamadas sin clave o sin nota', async () => {
  const key = process.env.DEEPSEEK_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  const llamadasAntes = providerRequests.length;

  try {
    const originalError = console.error;
    console.error = () => {};
    let invalida;
    let sinClave;
    let sinNota;

    try {
      invalida = await request('POST', '/api/ia/preguntar', { pregunta: 'x' });
      sinClave = await request('POST', '/api/ia/preguntar', {
        pregunta: 'Pregunta válida',
      });
      sinNota = await request('POST', '/api/notas/99/resumen');
    } finally {
      console.error = originalError;
    }

    assert.equal(invalida.status, 400);
    assert.equal(sinClave.status, 503);
    assert.deepEqual(sinClave.body, { error: 'IA_NO_DISPONIBLE' });
    assert.equal(sinNota.status, 404);
    assert.equal(providerRequests.length, llamadasAntes);
  } finally {
    process.env.DEEPSEEK_API_KEY = key;
  }
});

test('pregunta y resumen consultan DeepSeek y devuelven el uso de tokens', async () => {
  const pregunta = await request('POST', '/api/ia/preguntar', {
    pregunta: '¿Qué es Express?',
  });
  const nota = (await request('GET', '/api/notas/1')).body;
  const resumen = await request('POST', `/api/notas/${nota.id}/resumen`);

  assert.equal(pregunta.status, 200);
  assert.deepEqual(pregunta.body.uso, {
    input_tokens: 12,
    output_tokens: 5,
    total_tokens: 17,
  });
  assert.equal(resumen.status, 200);
  assert.equal(resumen.body.notaId, nota.id);
  assert.equal(providerRequests.at(-2).authorization, 'Bearer test-key-not-real');
  assert.equal(providerRequests.at(-2).url, '/v1/chat/completions');
  assert.equal(providerRequests.at(-1).body.messages[0].role, 'system');
  assert.equal(
    providerRequests.at(-1).body.messages[0].content,
    'Resume el texto en 3 viñetas breves, en español.',
  );
  assert.equal(providerRequests.at(-1).body.messages[1].content, nota.contenido);
});

test('no expone errores de autenticación del proveedor', async () => {
  providerStatus = 401;
  const originalError = console.error;
  console.error = () => {};

  try {
    const respuesta = await request('POST', '/api/ia/preguntar', {
      pregunta: '¿Está disponible el servicio?',
    });

    assert.equal(respuesta.status, 502);
    assert.deepEqual(respuesta.body, { error: 'IA_NO_DISPONIBLE' });
    assert.equal(JSON.stringify(respuesta.body).includes('detalle privado'), false);
  } finally {
    providerStatus = 200;
    console.error = originalError;
  }
});
