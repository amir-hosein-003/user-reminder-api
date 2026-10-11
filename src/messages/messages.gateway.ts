import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageStatus } from './entities/message.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    client.emit('connection:success', {
      message: 'Connected to messages gateway',
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  emitMessageStatusUpdated(messageId: string, status: MessageStatus) {
    this.server.emit('messages:status-updated', {
      messageId,
      status,
    });
  }

  sendTestEvent() {
    this.server.emit('messages:test', {
      message: 'This event was sent by the server',
      timestamp: new Date().toISOString(),
    });
  }
}
