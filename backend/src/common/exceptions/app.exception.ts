import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-code.constant';

export interface AppExceptionResponse {
  code: ErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Base class for all business/domain exceptions in this system.
 * Carries a stable `code` (see ErrorCode) in addition to the HTTP status,
 * so the global exception filter can build the API-ERROR-RESPONSE envelope
 * without guessing the code from the HTTP status alone.
 */
export class AppException extends HttpException {
  constructor(
    code: ErrorCode,
    message: string,
    status: HttpStatus,
    fieldErrors?: Record<string, string[]>,
  ) {
    const response: AppExceptionResponse = { code, message, fieldErrors };
    super(response, status);
  }
}

export class ValidationException extends AppException {
  constructor(fieldErrors: Record<string, string[]>, message = 'Validation failed.') {
    super(ErrorCode.VALIDATION_ERROR, message, HttpStatus.BAD_REQUEST, fieldErrors);
  }
}

export class InvalidCredentialsException extends AppException {
  constructor() {
    super(
      ErrorCode.INVALID_CREDENTIALS,
      'Invalid email or password.',
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class UserDisabledException extends AppException {
  constructor() {
    super(ErrorCode.USER_DISABLED, 'This account has been disabled.', HttpStatus.FORBIDDEN);
  }
}

export class CurrentPasswordInvalidException extends AppException {
  constructor() {
    super(
      ErrorCode.CURRENT_PASSWORD_INVALID,
      'The current password provided is incorrect.',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class PasswordPolicyFailedException extends AppException {
  constructor() {
    super(
      ErrorCode.PASSWORD_POLICY_FAILED,
      'Password must be at least 8 characters long and contain at least one letter and one number.',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class EmployeeNotFoundException extends AppException {
  constructor(id: string) {
    super(ErrorCode.EMPLOYEE_NOT_FOUND, `Employee with id "${id}" was not found.`, HttpStatus.NOT_FOUND);
  }
}

export class EmployeeCodeExistsException extends AppException {
  constructor() {
    super(ErrorCode.EMPLOYEE_CODE_EXISTS, 'An employee with this code already exists.', HttpStatus.CONFLICT);
  }
}

export class EmployeeEmailExistsException extends AppException {
  constructor() {
    super(ErrorCode.EMPLOYEE_EMAIL_EXISTS, 'An employee with this email already exists.', HttpStatus.CONFLICT);
  }
}

export class OrganizationNotFoundException extends AppException {
  constructor(id: string) {
    super(ErrorCode.ORGANIZATION_NOT_FOUND, `Organization with id "${id}" was not found.`, HttpStatus.NOT_FOUND);
  }
}

export class OrganizationReferenceNotFoundException extends AppException {
  constructor(fieldPath: string) {
    super(
      ErrorCode.ORGANIZATION_NOT_FOUND,
      'One or more organization references do not exist.',
      HttpStatus.BAD_REQUEST,
      { [fieldPath]: ['organizationId must reference an existing organization.'] },
    );
  }
}

export class OrganizationTypeNotFoundException extends AppException {
  constructor(id: string) {
    super(
      ErrorCode.ORGANIZATION_TYPE_NOT_FOUND,
      `Organization type with id "${id}" was not found.`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class OrganizationTypeReferenceNotFoundException extends AppException {
  constructor(fieldPath: string) {
    super(
      ErrorCode.ORGANIZATION_TYPE_NOT_FOUND,
      'One or more organization type references do not exist.',
      HttpStatus.BAD_REQUEST,
      { [fieldPath]: ['organizationTypeId must reference an existing organization type.'] },
    );
  }
}

export class OrganizationTypeNameExistsException extends AppException {
  constructor() {
    super(
      ErrorCode.ORGANIZATION_TYPE_NAME_EXISTS,
      'An organization type with this name already exists.',
      HttpStatus.CONFLICT,
    );
  }
}

export class InvitationTokenInvalidException extends AppException {
  constructor() {
    super(ErrorCode.INVITATION_TOKEN_INVALID, 'Invitation token is invalid.', HttpStatus.NOT_FOUND);
  }
}

export class InvitationExpiredException extends AppException {
  constructor() {
    super(ErrorCode.INVITATION_EXPIRED, 'Invitation token has expired.', HttpStatus.GONE);
  }
}

export class InvitationAlreadyAcceptedException extends AppException {
  constructor() {
    super(ErrorCode.INVITATION_ALREADY_ACCEPTED, 'Invitation has already been accepted.', HttpStatus.CONFLICT);
  }
}

export class UserAlreadyExistsException extends AppException {
  constructor() {
    super(ErrorCode.USER_ALREADY_EXISTS, 'A user account already exists for this employee.', HttpStatus.CONFLICT);
  }
}
