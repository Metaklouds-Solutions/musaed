/**
 * One-off script to redeploy all agent instances using the clinics-voice-template.
 * Run after updating the template (e.g. npm run seed) to push the new flow to Retell.
 *
 * Usage: npx ts-node src/db/redeploy-clinics-agents.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AgentDeploymentService } from '../agent-deployments/agent-deployment.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AgentInstance,
  AgentInstanceDocument,
} from '../agent-instances/schemas/agent-instance.schema';
import {
  AgentTemplate,
  AgentTemplateDocument,
} from '../agent-templates/schemas/agent-template.schema';

async function redeployClinicsAgents(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const templateModel = app.get<Model<AgentTemplateDocument>>(
      getModelToken(AgentTemplate.name),
    );
    const instanceModel = app.get<Model<AgentInstanceDocument>>(
      getModelToken(AgentInstance.name),
    );
    const deploymentService = app.get(AgentDeploymentService);

    const clinicsTemplate = await templateModel.findOne({
      slug: 'clinics-voice-template',
      deletedAt: null,
    });

    if (!clinicsTemplate) {
      console.log('❌ Clinics Voice Template not found in database.');
      process.exit(1);
    }

    const instances = await instanceModel.find({
      templateId: clinicsTemplate._id,
      status: { $nin: ['deleted'] },
      tenantId: { $ne: null },
    });

    if (instances.length === 0) {
      console.log(
        '⏭️  No agent instances use the Clinics Voice Template. Nothing to deploy.',
      );
      process.exit(0);
    }

    console.log(
      `🔄 Redeploying ${instances.length} agent instance(s) using Clinics Voice Template...`,
    );

    for (const instance of instances) {
      const tenantId = instance.tenantId?.toString();
      if (!tenantId) {
        console.warn(
          `   ⚠️  Skipping ${instance._id} (${instance.name ?? 'unnamed'}): no tenant assigned`,
        );
        continue;
      }
      try {
        await deploymentService.enqueueDeployment(
          instance._id.toString(),
          tenantId,
        );
        console.log(
          `   ✅ Queued: ${instance.name ?? instance._id} (${instance._id})`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`   ❌ Failed ${instance._id}: ${msg}`);
      }
    }

    console.log('🎉 Redeploy complete. Check deployment status in the dashboard.');
  } finally {
    await app.close();
  }
}

redeployClinicsAgents().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
