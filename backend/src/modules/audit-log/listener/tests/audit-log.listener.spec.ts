import { AuditLogListener } from '../audit-log.listener';
import { AuditLogRepository } from '../../repository/audit-log.repository';
import { AuditAction, AuditEntityType } from '../../../../common/constants/audit-action.constant';
import { EmployeeCreatedEvent } from '../../../employee/events/employee-created.event';
import { EmployeeUpdatedEvent } from '../../../employee/events/employee-updated.event';
import { EmployeeDeletedEvent } from '../../../employee/events/employee-deleted.event';

describe('AuditLogListener', () => {
  let listener: AuditLogListener;
  let repository: jest.Mocked<AuditLogRepository>;

  beforeEach(() => {
    repository = { create: jest.fn() } as unknown as jest.Mocked<AuditLogRepository>;
    listener = new AuditLogListener(repository);
  });

  it('writes an EMPLOYEE_CREATED row with { employeeCode, email } payload (success path)', async () => {
    repository.create.mockResolvedValue({} as never);

    await listener.handleEmployeeCreated(
      new EmployeeCreatedEvent('emp-1', 'EMP-001', 'ada@example.com', 'user-1', new Date()),
    );

    expect(repository.create).toHaveBeenCalledWith({
      action: AuditAction.EMPLOYEE_CREATED,
      entityType: AuditEntityType.EMPLOYEE,
      entityId: 'emp-1',
      performedByUserId: 'user-1',
      payload: { employeeCode: 'EMP-001', email: 'ada@example.com' },
    });
  });

  it('writes an EMPLOYEE_UPDATED row with { changedFields } payload', async () => {
    repository.create.mockResolvedValue({} as never);

    await listener.handleEmployeeUpdated(
      new EmployeeUpdatedEvent('emp-1', ['position', 'phone'], 'user-1', new Date()),
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.EMPLOYEE_UPDATED,
        payload: { changedFields: ['position', 'phone'] },
      }),
    );
  });

  it('writes an EMPLOYEE_DELETED row with the pre-delete { employeeCode } payload', async () => {
    repository.create.mockResolvedValue({} as never);

    await listener.handleEmployeeDeleted(
      new EmployeeDeletedEvent('emp-1', 'EMP-001', 'user-1', new Date()),
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.EMPLOYEE_DELETED,
        payload: { employeeCode: 'EMP-001' },
      }),
    );
  });

  it('does not throw when the repository write fails - it logs loudly instead (failure path)', async () => {
    const error = new Error('DB unreachable');
    repository.create.mockRejectedValue(error);
    const errorSpy = jest.spyOn((listener as unknown as { logger: { error: jest.Mock } }).logger, 'error');

    await expect(
      listener.handleEmployeeCreated(
        new EmployeeCreatedEvent('emp-1', 'EMP-001', 'ada@example.com', 'user-1', new Date()),
      ),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalled();
  });
});
