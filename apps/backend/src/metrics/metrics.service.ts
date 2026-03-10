import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Counter,
  Histogram,
  collectDefaultMetrics,
  Registry,
  register,
} from 'prom-client';

/**
 * Prometheus metrics service. Exposes HTTP request metrics and custom counters.
 * Use this service to record business metrics (e.g. webhooks_received_total).
 */
@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry = register;
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestTotal: Counter<string>;
  private readonly emailSentTotal: Counter<string>;
  private readonly emailFailedTotal: Counter<string>;
  private readonly webhooksReceivedTotal: Counter<string>;

  constructor() {
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    this.emailSentTotal = new Counter({
      name: 'email_sent_total',
      help: 'Total number of emails sent successfully',
      labelNames: ['type'],
      registers: [this.registry],
    });

    this.emailFailedTotal = new Counter({
      name: 'email_failed_total',
      help: 'Total number of email send failures',
      labelNames: ['type'],
      registers: [this.registry],
    });

    this.webhooksReceivedTotal = new Counter({
      name: 'webhooks_received_total',
      help: 'Total number of webhooks received (by source)',
      labelNames: ['source'],
      registers: [this.registry],
    });
  }

  /**
   * Records a successful email send.
   */
  recordEmailSent(type: string): void {
    this.emailSentTotal.inc({ type });
  }

  /**
   * Records an email send failure.
   */
  recordEmailFailed(type: string): void {
    this.emailFailedTotal.inc({ type });
  }

  /**
   * Records a webhook received (after signature verification).
   */
  recordWebhookReceived(source: string): void {
    this.webhooksReceivedTotal.inc({ source });
  }

  onModuleInit(): void {
    collectDefaultMetrics({ register: this.registry });
  }

  /**
   * Records an HTTP request for metrics. Call from middleware on response finish.
   */
  recordHttpRequest(method: string, path: string, status: number, durationMs: number): void {
    const durationSec = durationMs / 1000;
    const pathLabel = this.normalizePath(path);
    const statusLabel = String(status);
    const labels = { method, path: pathLabel, status: statusLabel };
    this.httpRequestDuration.observe(labels, durationSec);
    this.httpRequestTotal.inc(labels);
  }

  /**
   * Returns Prometheus exposition format for scraping.
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Returns content type for Prometheus scrape.
   */
  getContentType(): string {
    return this.registry.contentType;
  }

  private normalizePath(path: string): string {
    if (!path || path === '/') return '/';
    const parts = path.split('/').filter(Boolean);
    const normalized = parts.map((p) => (/^\d+$|^[a-f0-9-]{24}$/i.test(p) ? ':id' : p)).join('/');
    return '/' + normalized;
  }
}
