import { HttpException, HttpStatus } from '@nestjs/common';

function response(code: string, message: string) {
  return { code, message };
}

export class WorkflowRequestNotFoundException extends HttpException {
  constructor(id: string) {
    super(response('WORKFLOW_REQUEST_NOT_FOUND', `Workflow request with id "${id}" was not found.`), HttpStatus.NOT_FOUND);
  }
}

export class WorkflowRequestStaleException extends HttpException {
  constructor() {
    super(response('WORKFLOW_REQUEST_STALE', 'Workflow request revision is stale.'), HttpStatus.CONFLICT);
  }
}

export class WorkflowRequestInvalidStateException extends HttpException {
  constructor() {
    super(response('WORKFLOW_REQUEST_INVALID_STATE', 'Workflow request state does not allow this action.'), HttpStatus.CONFLICT);
  }
}

export class WorkflowActionNotAllowedException extends HttpException {
  constructor() {
    super(response('WORKFLOW_ACTION_NOT_ALLOWED', 'You are not allowed to perform this workflow action.'), HttpStatus.FORBIDDEN);
  }
}

export class NotificationNotFoundException extends HttpException {
  constructor(id: string) {
    super(response('NOTIFICATION_NOT_FOUND', `Notification with id "${id}" was not found.`), HttpStatus.NOT_FOUND);
  }
}
