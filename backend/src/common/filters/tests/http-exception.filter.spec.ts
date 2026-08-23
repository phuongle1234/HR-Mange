import { HttpStatus } from '@nestjs/common';
import { GlobalHttpExceptionFilter } from '../http-exception.filter';
import { EmployeeNotFoundException } from '../../exceptions/app.exception';
import { ErrorCode } from '../../constants/error-code.constant';

function createHost(requestId: string) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', url: '/api/employees/1', requestId }),
      getResponse: () => ({ status }),
    }),
  } as never;
  return { host, status, json };
}

describe('GlobalHttpExceptionFilter', () => {
  it('maps an AppException to the full API-ERROR-RESPONSE envelope (success path)', () => {
    const filter = new GlobalHttpExceptionFilter();
    const { host, status, json } = createHost('req-1');

    filter.catch(new EmployeeNotFoundException('emp-1'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        code: ErrorCode.EMPLOYEE_NOT_FOUND,
        requestId: 'req-1',
      }),
    );
  });

  it('maps an unexpected non-HttpException error to a safe 500 without leaking internals (failure path)', () => {
    const filter = new GlobalHttpExceptionFilter();
    const { host, status, json } = createHost('req-2');

    filter.catch(new Error('raw internal db error with a secret connection string'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred.',
      requestId: 'req-2',
    });
  });
});
