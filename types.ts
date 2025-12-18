
export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  ADMIN = 'ADMIN'
}

export enum AdminSubRole {
  GENERAL = 'GENERAL',
  IT = 'IT',
  FINANCE = 'FINANCE',
  SUPER = 'SUPER'
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED'
}

export enum RequestType {
  GENERAL = 'GENERAL',
  IT = 'IT',
  FINANCE = 'FINANCE',
  HR = 'HR'
}

export type ReimbursementType = 'WiFi' | 'Mobile';

export interface TicketComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  employeeName: string;
  type: RequestType;
  summary: string;
  description: string;
  location?: string;
  status: TicketStatus;
  createdAt: string;
  resolutionNotes?: string;
  priority?: 'Low' | 'Medium' | 'High';
  comments: TicketComment[];
  isReopened?: boolean;
}

export interface ReimbursementClaim {
  id: string;
  employeeName: string;
  billName: string;
  months: string[];
  totalAmount: number;
  eligibleAmount: number;
  excessAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW';
  anomalies: string[];
  aiReasoning: string;
  createdAt: string;
  type: ReimbursementType;
  provider?: string;
}
