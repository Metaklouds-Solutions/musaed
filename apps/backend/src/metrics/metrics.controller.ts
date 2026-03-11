import { Controller, Get, Header, Res, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';
import { MetricsService } from './metrics.service';
import { MetricsAuthGuard } from '../common/guards/metrics-auth.guard';

@Controller('metrics')
@SkipThrottle()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Prometheus scrape endpoint. Exposed at /metrics (excluded from /api prefix).
   * Protected by METRICS_API_KEY when set; open in development by default.
   */
  @Get()
  @UseGuards(MetricsAuthGuard)
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async getMetrics(@Res() res: Response): Promise<void> {
    const contentType = this.metricsService.getContentType();
    const metrics = await this.metricsService.getMetrics();
    res.setHeader('Content-Type', contentType);
    res.send(metrics);
  }
}
