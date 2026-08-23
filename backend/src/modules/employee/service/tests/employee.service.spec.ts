import { EventEmitter2 } from '@nestjs/event-emitter';
import { Employee, EmployeeStatus } from '@prisma/client';
import { EmployeeService } from '../employee.service';
import { EmployeeRepository } from '../../repository/employee.repository';
import {
  EmployeeCodeExistsException,
  EmployeeEmailExistsException,
  EmployeeNotFoundException,
} from '../../../../common/exceptions/app.exception';
import { EMPLOYEE_CREATED_EVENT } from '../../events/employee-created.event';
import { EMPLOYEE_UPDATED_EVENT } from '../../events/employee-updated.event';
import { EMPLOYEE_DELETED_EVENT } from '../../events/employee-deleted.event';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let repository: jest.Mocked<EmployeeRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const baseEmployee: Employee = {
    id: 'emp-1',
    employeeCode: 'EMP-001',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: null,
    position: 'Engineer',
    status: EmployeeStatus.ACTIVE,
    createdByUserId: 'user-1',
    updatedByUserId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmployeeCode: jest.fn(),
      findByEmail: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<EmployeeRepository>;

    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

    service = new EmployeeService(repository, eventEmitter);
  });

  describe('create', () => {
    it('creates the employee and emits EmployeeCreatedEvent (success path)', async () => {
      repository.findByEmployeeCode.mockResolvedValue(null);
      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(baseEmployee);

      const result = await service.create(
        {
          employeeCode: 'EMP-001',
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@example.com',
          position: 'Engineer',
        },
        'user-1',
      );

      expect(result).toEqual(baseEmployee);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EMPLOYEE_CREATED_EVENT,
        expect.objectContaining({ employeeId: baseEmployee.id, employeeCode: 'EMP-001' }),
      );
    });

    it('throws EmployeeCodeExistsException when employeeCode is already taken (failure path)', async () => {
      repository.findByEmployeeCode.mockResolvedValue(baseEmployee);

      await expect(
        service.create(
          { employeeCode: 'EMP-001', firstName: 'X', lastName: 'Y', email: 'other@example.com' },
          'user-1',
        ),
      ).rejects.toThrow(EmployeeCodeExistsException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('throws EmployeeEmailExistsException when email is already taken', async () => {
      repository.findByEmployeeCode.mockResolvedValue(null);
      repository.findByEmail.mockResolvedValue(baseEmployee);

      await expect(
        service.create(
          { employeeCode: 'EMP-002', firstName: 'X', lastName: 'Y', email: 'ada@example.com' },
          'user-1',
        ),
      ).rejects.toThrow(EmployeeEmailExistsException);
    });
  });

  describe('findOne', () => {
    it('returns the employee when found (success path)', async () => {
      repository.findById.mockResolvedValue(baseEmployee);

      const result = await service.findOne(baseEmployee.id);

      expect(result).toEqual(baseEmployee);
    });

    it('throws EmployeeNotFoundException when not found (failure path)', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(EmployeeNotFoundException);
    });
  });

  describe('findMany', () => {
    it('returns paginated items and total (success path)', async () => {
      repository.findMany.mockResolvedValue({ items: [baseEmployee], total: 1 });

      const result = await service.findMany({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result).toEqual({ items: [baseEmployee], total: 1 });
    });
  });

  describe('update', () => {
    it('updates the employee and emits EmployeeUpdatedEvent with changed fields (success path)', async () => {
      repository.findById.mockResolvedValue(baseEmployee);
      repository.findByEmployeeCode.mockResolvedValue(null);
      repository.findByEmail.mockResolvedValue(null);
      const updated = { ...baseEmployee, position: 'Senior Engineer' };
      repository.update.mockResolvedValue(updated);

      const result = await service.update(baseEmployee.id, { position: 'Senior Engineer' }, 'user-1');

      expect(result).toEqual(updated);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EMPLOYEE_UPDATED_EVENT,
        expect.objectContaining({ changedFields: ['position'] }),
      );
    });

    it('throws EmployeeNotFoundException when the employee does not exist (failure path)', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('missing-id', { position: 'Senior Engineer' }, 'user-1'),
      ).rejects.toThrow(EmployeeNotFoundException);
    });

    it('throws EmployeeCodeExistsException when renaming to a code used by another row', async () => {
      repository.findById.mockResolvedValue(baseEmployee);
      repository.findByEmployeeCode.mockResolvedValue({ ...baseEmployee, id: 'other-id' });

      await expect(
        service.update(baseEmployee.id, { employeeCode: 'EMP-999' }, 'user-1'),
      ).rejects.toThrow(EmployeeCodeExistsException);
    });

    it('does not emit EmployeeUpdatedEvent when nothing actually changed', async () => {
      repository.findById.mockResolvedValue(baseEmployee);
      repository.update.mockResolvedValue(baseEmployee);

      await service.update(baseEmployee.id, {}, 'user-1');

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes the employee and emits EmployeeDeletedEvent with the pre-delete code (success path)', async () => {
      repository.findById.mockResolvedValue(baseEmployee);
      repository.delete.mockResolvedValue(baseEmployee);

      await service.delete(baseEmployee.id, 'user-1');

      expect(repository.delete).toHaveBeenCalledWith(baseEmployee.id);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EMPLOYEE_DELETED_EVENT,
        expect.objectContaining({ employeeId: baseEmployee.id, employeeCode: baseEmployee.employeeCode }),
      );
    });

    it('throws EmployeeNotFoundException when the employee does not exist (failure path)', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete('missing-id', 'user-1')).rejects.toThrow(EmployeeNotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
