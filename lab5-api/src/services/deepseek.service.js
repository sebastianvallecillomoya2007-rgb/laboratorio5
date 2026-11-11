const OpenAI = require('openai');

const AppError = require('../utils/errors');

const defaultBaseUrl = 'https://api.deepseek.com';

async function preguntar(texto, system) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL;

  if (!apiKey || !model) {
    throw new AppError(503, 'IA_NO_DISPONIBLE');
  }

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL || defaultBaseUrl,
  });
  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: system ?? 'Eres un asistente útil. Responde en español.',
      },
      {
        role: 'user',
        content: texto,
      },
    ],
    max_tokens: 1024,
  });

  const respuesta = completion.choices[0]?.message?.content;

  if (typeof respuesta !== 'string') {
    throw new AppError(502, 'IA_NO_DISPONIBLE');
  }

  const uso = completion.usage
    ? {
        input_tokens: completion.usage.prompt_tokens,
        output_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens,
      }
    : null;

  return { respuesta, uso };
}

module.exports = { preguntar };