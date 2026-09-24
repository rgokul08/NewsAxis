/**
 * Base Abstract Provider
 */
export class BaseProvider {
  constructor(config = {}) {
    this.id = config.id || 'base';
    this.name = config.name || 'Base Provider';
    this.type = config.type || 'news';
    this.enabled = config.enabled ?? true;
    this.priority = config.priority || 5;
    this.requestsPerMinute = config.requestsPerMinute || 30;
    this.cooldownSeconds = config.cooldownSeconds || 300;
    this.cacheMinutes = config.cacheMinutes || 30;
    this.lastHealthCheck = null;
    this.status = 'healthy'; // 'healthy' | 'degraded' | 'rate_limited' | 'unauthorized' | 'failed'
    this.latencyMs = 0;
  }

  async fetchLatest(params = {}) {
    throw new Error(`fetchLatest() not implemented on ${this.name}`);
  }

  async fetchTrending(params = {}) {
    return this.fetchLatest(params);
  }

  async search(query, params = {}) {
    throw new Error(`search() not implemented on ${this.name}`);
  }

  normalize(rawItem) {
    throw new Error(`normalize() not implemented on ${this.name}`);
  }

  async healthCheck() {
    const start = Date.now();
    try {
      this.lastHealthCheck = new Date().toISOString();
      this.latencyMs = Date.now() - start;
      this.status = 'healthy';
      return { healthy: true, latencyMs: this.latencyMs, status: this.status };
    } catch (err) {
      this.status = 'failed';
      return { healthy: false, error: err.message, status: this.status };
    }
  }
}
