export class AiClient {
  constructor(config, fetchImpl = fetch) {
    this.config = config;
    this.fetch = fetchImpl;
  }

  get configured() {
    return Boolean(this.config.baseUrl && this.config.apiKey && this.config.model);
  }

  async chat(messages, options = {}) {
    if (!this.configured) {
      const keyName = this.config.provider === 'gemini' ? 'GEMINI_API_KEY' : 'LMARENA_API_KEY';
      throw new Error(`AI belum dikonfigurasi. Isi ${keyName} dan nama model di file .env.`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      return this.config.provider === 'gemini'
        ? await this.chatGemini(messages, controller.signal, options)
        : await this.chatOpenAiCompatible(messages, controller.signal, options);
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error(`API AI timeout setelah ${this.config.timeoutMs} ms.`);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async chatGemini(messages, signal, options) {
    const models = [...new Set([
      this.config.model,
      ...(this.config.fallbackModels || [])
    ].map((model) => model.replace(/^models\//, '')).filter(Boolean))];
    const maxRetries = Math.max(0, Math.min(Number(this.config.maxRetries) || 0, 5));
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Coba model utama dua kali sebelum berpindah ke model fallback.
      const modelIndex = attempt < 2 ? 0 : Math.min(attempt - 1, models.length - 1);
      const model = models[modelIndex];
      const response = await this.fetch(`${this.config.baseUrl}/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': this.config.apiKey
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: this.config.systemPrompt }] },
          contents: messages.map((message) => ({
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(message.content) }]
          })),
          generationConfig: {
            maxOutputTokens: options.maxTokens || this.config.maxTokens,
            temperature: options.temperature ?? this.config.temperature
          }
        }),
        signal
      });

      const body = await parseResponse(response);
      if (response.ok) {
        const parts = body?.candidates?.[0]?.content?.parts;
        const content = Array.isArray(parts) ? parts.map((part) => part.text || '').join('').trim() : '';
        if (!content) {
          const reason = body?.candidates?.[0]?.finishReason || body?.promptFeedback?.blockReason;
          throw new Error(`Gemini tidak mengembalikan teks${reason ? ` (${reason})` : ''}.`);
        }
        return content;
      }

      lastError = apiError(`Gemini model ${model}`, response, body);
      const retryable = [429, 500, 502, 503, 504].includes(response.status);
      if (!retryable || attempt === maxRetries) throw lastError;
      await delay(retryDelay(response, attempt), signal);
    }
    throw lastError;
  }

  async chatOpenAiCompatible(messages, signal, options) {
    const response = await this.fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'system', content: this.config.systemPrompt }, ...messages],
        max_tokens: options.maxTokens || this.config.maxTokens,
        temperature: options.temperature ?? this.config.temperature,
        stream: false
      }),
      signal
    });

    const body = await parseResponse(response);
    if (!response.ok) throw apiError('API AI', response, body);
    const content = body?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('Format respons API AI tidak dikenali. Pastikan endpoint OpenAI-compatible.');
    return content;
  }
}

async function parseResponse(response) {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    return { _raw: raw.slice(0, 300) };
  }
}

function apiError(provider, response, body) {
  const detail = body?.error?.message || body?.message || body?._raw || response.statusText;
  return new Error(`${provider} gagal (${response.status}): ${detail}`);
}

function retryDelay(response, attempt) {
  const retryAfter = Number(response.headers.get('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1_000, 10_000);
  return Math.min(750 * (2 ** attempt), 5_000);
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
    }, { once: true });
  });
}

export class ConversationStore {
  constructor(maxMessages = 12) {
    this.maxMessages = maxMessages;
    this.items = new Map();
  }
  get(key) { return this.items.get(key) || []; }
  append(key, ...messages) {
    const next = [...this.get(key), ...messages].slice(-this.maxMessages);
    this.items.set(key, next);
    return next;
  }
  clear(key) { return this.items.delete(key); }
}
