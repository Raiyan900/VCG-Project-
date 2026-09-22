/**
 * Thin client for calling a real, configurable AI provider (OpenAI-compatible
 * chat completions API). Supports OpenAI, Azure OpenAI-compatible gateways,
 * and any self-hosted/OpenAI-compatible endpoint (e.g. Ollama, OpenRouter, Groq)
 * via AI_BASE_URL. No API key ever leaves the backend.
 */

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';
const REQUEST_TIMEOUT_MS = 20000;

function isAIConfigured() {
  return Boolean(process.env.AI_API_KEY);
}

function getProviderInfo() {
  return {
    configured: isAIConfigured(),
    provider: process.env.AI_PROVIDER || 'openai',
    model: process.env.AI_MODEL || DEFAULT_MODEL,
  };
}

class AIError extends Error {
  constructor(message, code = 'AI_ERROR', status = 502) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * Calls the configured chat-completions endpoint and requests a strict JSON object response.
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<object>} parsed JSON object from the model
 */
async function callAIForJSON(messages) {
  if (!isAIConfigured()) {
    throw new AIError(
      'AI provider is not configured. Configure the AI API key in the server environment to enable AI features.',
      'AI_NOT_CONFIGURED',
      503
    );
  }

  const baseUrl = process.env.AI_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.AI_MODEL || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new AIError('AI provider request timed out. Please try again.', 'AI_TIMEOUT', 504);
    }
    throw new AIError(`Unable to reach the AI provider: ${err.message}`, 'AI_UNREACHABLE', 502);
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429) {
    throw new AIError('AI provider rate limit exceeded. Please try again shortly.', 'AI_RATE_LIMIT', 429);
  }
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new AIError(`AI provider returned an error (${response.status}): ${errText.slice(0, 300)}`, 'AI_PROVIDER_ERROR', 502);
  }

  const payload = await response.json().catch(() => null);
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new AIError('AI provider returned an empty response.', 'AI_EMPTY_RESPONSE', 502);
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new AIError('AI provider returned a response that was not valid JSON.', 'AI_INVALID_JSON', 502);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new AIError('AI provider returned an unexpected response shape.', 'AI_INVALID_SHAPE', 502);
  }

  return parsed;
}

module.exports = { isAIConfigured, getProviderInfo, callAIForJSON, AIError };
