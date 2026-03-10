import { Controller, Get, Header, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Prometheus scrape endpoint. Exposed at /metrics (excluded from /api prefix).
   */
  @Get()
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async getMetrics(@Res() res: Response): Promise<void> {
    const contentType = this.metricsService.getContentType();
    const metrics = await this.metricsService.getMetrics();
    res.setHeader('Content-Type', contentType);
    res.send(metrics);
  }
}
