import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppConfig } from '../../../config/configuration';
import { PrismaService } from '../../../prisma/prisma.service';
import type { EmployeeEntity, WorkflowRequestEntity } from '../shared/workflow-contract.types';
import { WorkflowPrismaClient, workflowPrisma } from '../shared/workflow-prisma.bridge';
import { canActAt } from '../actions/utils/workflow-permission.util';
import type { NotificationCreatedEvent, WorkflowRequestEvent } from '../events/workflow-request.event';

interface WorkflowSocket extends Socket {
  employeeId?: string;
}

@WebSocketGateway({ namespace: '/ws', cors: true })
export class WorkflowGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(WorkflowGateway.name);
  private readonly workflowDb: WorkflowPrismaClient;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig>,
    prisma: PrismaService,
  ) {
    this.workflowDb = workflowPrisma(prisma);
  }

  async handleConnection(client: WorkflowSocket): Promise<void> {
    try {
      const token = client.handshake.auth?.token;
      if (typeof token !== 'string' || !token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<{ sub?: string; id?: string }>(token, {
        publicKey: this.configService.get('jwt.publicKey', { infer: true }),
        algorithms: ['RS256'],
      });
      const userId = payload.sub ?? payload.id;
      if (!userId) {
        client.disconnect(true);
        return;
      }

      const employee = (await this.workflowDb.employee.findUnique({ where: { userId } })) as EmployeeEntity | null;
      if (!employee) {
        client.disconnect(true);
        return;
      }

      client.employeeId = employee.id;
      await client.join(this.employeeRoom(employee.id));
    } catch (error) {
      this.logger.warn(`Socket handshake rejected: ${(error as Error).message}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('workflow-request:subscribe')
  async subscribeToRequest(@ConnectedSocket() client: WorkflowSocket, @MessageBody() body: { requestId?: string }): Promise<void> {
    if (!client.employeeId || !body?.requestId) {
      return;
    }

    if (await this.canReadRequest(client.employeeId, body.requestId)) {
      await client.join(this.workflowRequestRoom(body.requestId));
    }
  }

  @SubscribeMessage('workflow-request:unsubscribe')
  async unsubscribeFromRequest(@ConnectedSocket() client: WorkflowSocket, @MessageBody() body: { requestId?: string }): Promise<void> {
    if (!body?.requestId) {
      return;
    }
    await client.leave(this.workflowRequestRoom(body.requestId));
  }

  emitWorkflowRequestEvent(eventName: string, payload: WorkflowRequestEvent): void {
    this.server.to(this.workflowRequestRoom(payload.workflowRequestId)).emit(eventName, payload);
    this.server.to(this.employeeRoom(payload.actorEmployeeId)).emit(eventName, payload);
  }

  emitNotificationCreated(payload: NotificationCreatedEvent): void {
    this.server.to(this.employeeRoom(payload.recipientEmployeeId)).emit('notification.created', payload);
  }

  private async canReadRequest(employeeId: string, requestId: string): Promise<boolean> {
    const actor = (await this.workflowDb.employee.findUnique({ where: { id: employeeId } })) as EmployeeEntity | null;
    const request = (await this.workflowDb.workflowRequest.findUnique({ where: { id: requestId }, include: { employee: true, currentStep: true } })) as WorkflowRequestEntity | null;
    if (!actor || !request?.employee) {
      return false;
    }
    if (request.employeeId === actor.id) {
      return true;
    }
    if (!request.currentStep) {
      return false;
    }
    return canActAt(this.workflowDb as any, actor, request.employee, request.currentStep);
  }

  private employeeRoom(employeeId: string): string {
    return `employee:${employeeId}`;
  }

  private workflowRequestRoom(requestId: string): string {
    return `workflow-request:${requestId}`;
  }
}
