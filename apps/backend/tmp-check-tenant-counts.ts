import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { TenantsService } from './src/tenants/tenants.service';

dotenv.config({ path: '.env' });

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const svc = app.get(TenantsService);
  const res = await svc.findAll({ page: 1, limit: 20 });
  console.log(JSON.stringify(res.data.map((t) => ({ id: (t as any)._id, name: (t as any).name, status: (t as any).status, agentCount: (t as any).agentCount })), null, 2));
  await app.close();
}
run().catch((e) => { console.error(e); process.exit(1); });
