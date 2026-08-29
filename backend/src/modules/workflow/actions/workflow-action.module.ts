import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../../auth/auth.module';
import { AppConfig } from '../../../config/configuration';
import { WorkflowActionController } from './controller/workflow-action.controller';
import { WorkflowActionService } from './service/workflow-action.service';
import { WorkflowSocketListener } from '../listeners/workflow-socket.listener';
import { WorkflowGateway } from '../gateway/workflow.gateway';

@Module({
  imports: [
    AuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => ({
        publicKey: configService.get('jwt.publicKey', { infer: true }),
        verifyOptions: { algorithms: ['RS256'] },
      }),
    }),
  ],
  controllers: [WorkflowActionController],
  providers: [
    WorkflowActionService,
    WorkflowGateway,
    WorkflowSocketListener,
    {
      provide: 'IWorkflowActionService',
      useExisting: WorkflowActionService,
    },
  ],
  exports: [WorkflowActionService],
})
export class WorkflowActionModule {}
