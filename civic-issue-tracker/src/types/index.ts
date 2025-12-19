// Core data types matching backend API structure

export type UserRole = 'civilian' | 'contractor' | 'official';

export type CaseStatus =
  | 'pending'      // Awaiting official approval
  | 'approved'     // Approved but not assigned
  | 'assigned'     // Assigned to contractor
  | 'in_progress'  // Contractor working on it
  | 'completed'    // Contractor finished
  | 'closed'       // Officially resolved
  | 'denied';      // Rejected by official

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  token?: string;
}

export interface Case {
  id: string;
  description: string;
  location: string;
  photoURL: string;
  status: CaseStatus;
  reporterId?: string;  // null for anonymous
  reporterName?: string;
  assigneeId?: string;
  assigneeName?: string;
  paymentAmount?: number;
  priority: 'normal' | 'high';
  createdAt: string;
  updatedAt: string;
  history: CaseHistoryEntry[];
  completionPhotoURL?: string;
  completionNotes?: string;
  closingNotes?: string;
}

export interface CaseHistoryEntry {
  timestamp: string;
  action: string;
  performedBy: string;
  details?: string;
}

export interface Contractor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  skills?: string[];
  isActive: boolean;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ReportCaseRequest {
  description: string;
  location: string;
  photo: File;
  contactEmail?: string;
  contactPhone?: string;
}

export interface ReportCaseResponse {
  case: Case;
  referenceNumber: string;
}

export interface UpdateStatusRequest {
  status: CaseStatus;
  notes?: string;
  completionPhoto?: File;
}

export interface AssignCaseRequest {
  contractorId: string;
}

export interface UpdatePaymentRequest {
  paymentAmount: number;
}

export interface CloseCaseRequest {
  closingNotes: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}
