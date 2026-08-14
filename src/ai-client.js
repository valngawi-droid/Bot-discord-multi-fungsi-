export class AiClient {
  constructor(config) {
    this.config = config;
  }

  get configured() {
    return Boolean(this.config.baseUrl && this.config.apiKey && this.config.model);
  }

  async chat(messages) {
    if (!this.configured) {
      throw new Error('AI belum dikonfigurasi. Isi LMARENA_BASE_URL, LMARENA_API_KEY, dan LMARENA_MODEL.');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'system', content: this.config.systemPrompt }, ...messages],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: false
        }),
        signal: controller.signal
      });

      const raw = await response.text();
      let body;
      try { body = JSON.parse(raw); } catch { body = null; }
      if (!response.ok) {
        const detail = body?.error?.message || body?.message || raw.slice(0, 300) || response.statusText;
        throw new Error(`API AI gagal (${response.status}): ${detail}`);
      }
      const content = body?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error('Format respons API AI tidak dikenali. Pastikan endpoint OpenAI-compatible.');
      return content;
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error(`API AI timeout setelah ${this.config.timeoutMs} ms.`);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
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
