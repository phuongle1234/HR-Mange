export interface InvitationCreatedResult {
  employeeId: string;
  invitationId: string;
}

export interface InvitationSkippedResult {
  employeeId: string;
  reason: 'EMPLOYEE_NOT_FOUND' | 'USER_ALREADY_EXISTS' | 'EMPLOYEE_MISSING_EMAIL';
}

export interface CreateInvitationsResult {
  created: InvitationCreatedResult[];
  skipped: InvitationSkippedResult[];
}

export interface IInvitationsService {
  createMany(employeeIds: string[], actorUserId: string): Promise<CreateInvitationsResult>;
}
