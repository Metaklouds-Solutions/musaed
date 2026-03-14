import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
// Mongoose watch() returns a compatible stream; use any to avoid mongodb@7 ChangeStream type mismatch
import {
  CallSession,
  CallSessionDocument,
} from './schemas/call-session.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CallChangeStreamService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CallChangeStreamService.name);
  private stream: { on: (event: string, fn: (...args: unknown[]) => void) => void; close: () => Promise<void> } | null = null;
  private restarting = false;

  constructor(
    @InjectModel(CallSession.name)
    private readonly callSessionModel: Model<CallSessionDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit(): void {
    this.startStream();
  }

  async onModuleDestroy(): Promise<void> {
    await this.closeStream();
  }

  private startStream(): void {
    if (this.stream) return;

    const stream = this.callSessionModel.watch(
      [{ $match: { operationType: 'insert' } }],
      { fullDocument: 'default' },
    ) as { on: (event: string, fn: (...args: unknown[]) => void) => void; close: () => Promise<void> };
    this.stream = stream;

    stream.on('change', (change: Record<string, unknown>) => {
      void this.handleInsertChange(change);
    });

    stream.on('error', (err: unknown) => {
      this.logger.error(
        `Call change stream error: ${err instanceof Error ? err.message : String(err)}`,
      );
      void this.restartStreamWithDelay();
    });

    stream.on('end', () => {
      this.logger.warn('Call change stream ended; restarting');
      void this.restartStreamWithDelay();
    });

    this.logger.log('Call change stream started');
  }

  private async restartStreamWithDelay(): Promise<void> {
    if (this.restarting) return;
    this.restarting = true;
    await this.closeStream();
    await new Promise((resolve) => setTimeout(resolve, 3000));
    this.restarting = false;
    this.startStream();
  }

  private async closeStream(): Promise<void> {
    if (!this.stream) return;
    const current = this.stream;
    this.stream = null;
    try {
      await current.close();
    } catch {
      // noop
    }
  }

  private async handleInsertChange(
    change: Record<string, unknown>,
  ): Promise<void> {
    const fullDocument =
      typeof change.fullDocument === 'object' &&
      change.fullDocument !== null &&
      !Array.isArray(change.fullDocument)
        ? (change.fullDocument as Record<string, unknown>)
        : null;

    if (!fullDocument) return;

    const tenantRaw = fullDocument.tenantId;
    const tenantId =
      tenantRaw instanceof Types.ObjectId
        ? tenantRaw.toString()
        : typeof tenantRaw === 'string'
          ? tenantRaw
          : null;
    if (!tenantId || !Types.ObjectId.isValid(tenantId)) return;

    await this.notificationsService.createForTenantStaff(tenantId, {
      tenantId,
      type: 'new_call',
      source: 'retell',
      severity: 'normal',
      title: 'New AI call received',
      message: 'New AI call received',
      metadata: {
        callId: fullDocument.callId ?? null,
      },
    });
  }
}
