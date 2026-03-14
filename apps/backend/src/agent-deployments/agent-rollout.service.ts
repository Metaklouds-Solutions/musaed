import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Encapsulates feature flags for safe deployment rollout.
 */
@Injectable()
export class AgentRolloutService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Returns true when v2 deployment flows are enabled.
   */
  isDeploymentV2Enabled(): boolean {
    return this.readBoolean('AGENT_DEPLOYMENT_V2_ENABLED', true);
  }

  /**
   * Returns true when create flows should enqueue deployment automatically.
   */
  isAutoDeployOnCreateEnabled(): boolean {
    return this.readBoolean('AGENT_AUTO_DEPLOY_ON_CREATE', true);
  }

  private readBoolean(key: string, fallback: boolean): boolean {
    const value = this.configService.get<string | boolean | undefined>(key);
    if (value === undefined || value === null) return fallback;
    if (typeof value === 'boolean') return value;
    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes')
      return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no')
      return false;
    return fallback;
  }
}
