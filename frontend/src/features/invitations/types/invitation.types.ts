export interface CreateInvitationPayload {
  employeeIds: string[];
}

export interface AcceptInvitationPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface InvitationResponse {
  id: string;
  email: string;
  status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'EXPIRED';
  createdAt: string;
  acceptedAt?: string | null;
}
