import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: (process.env.ALLOWED_ORIGINS ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173')
      .split(',')
      .map((o: string) => o.trim())
      .filter(Boolean),
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    const auth = client.handshake?.auth as { token?: string } | undefined;
    const headers = client.handshake?.headers as Record<string, string> | undefined;
    const token =
      auth?.token ??
      (typeof headers?.authorization === 'string'
        ? headers.authorization.replace('Bearer ', '')
        : '');
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const secret = this.configService.getOrThrow<string>('JWT_SECRET');
      const payload = this.jwtService.verify<{ sub: string }>(token, { secret });
      const userId = payload.sub;
      if (!userId) {
        client.disconnect();
        return;
      }

      const room = `user:${userId}`;
      client.join(room);

      let sockets = this.userSockets.get(userId);
      if (!sockets) {
        sockets = new Set();
        this.userSockets.set(userId, sockets);
      }
      sockets.add(client.id);

      this.logger.debug(`Client ${client.id} connected for user ${userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, sockets] of this.userSockets) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.userSockets.delete(userId);
        break;
      }
    }
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}
