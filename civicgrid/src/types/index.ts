/**
 * CivicGrid Global Types
 * Used globally for type safety. Claude users: Refer to these for prop typings when generating components.
 */

export type UUID = string;

export interface Location {
  address?: string;
  lat: number;
  lng: number;
}

export interface SLA {
  targetHours: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  source: 'city' | 'heuristic' | 'manual';
}

export type CaseCategory = 'pothole' | 'tree' | 'trash' | 'streetlight' | 'other';
export type CaseSeverity = 'low' | 'medium' | 'high';
export type CaseStatus =
  | 'created'
  | 'routed'
  | 'accepted'
  | 'in_progress'
  | 'verification'
  | 'resolved'
  | 'paid'
  | 'disputed';

export type ReporterChannel = 'voice' | 'sms' | 'web';

export interface Case {
  id: UUID;
  category: CaseCategory;
  severity: CaseSeverity;
  description?: string;
  location: Location;
  createdAt: string;
  reporterChannel: ReporterChannel;
  status: CaseStatus;
  sla: SLA;
  taskId?: UUID;
  proofs?: ProofOfService[];
  txLinks?: {
    escrow?: string;
    payout?: string;
  };
}

export type TaskState =
  | 'open'
  | 'accepted'
  | 'en_route'
  | 'delivered'
  | 'submitted'
  | 'verified'
  | 'paid';

export interface Task {
  id: UUID;
  caseId: UUID;
  spec: string; // e.g., dimensions, materials
  bountyUSD: number;
  acceptBy: string; // ISO deadline
  state: TaskState;
  vendorId?: UUID;
}

export type ProofType = 'photo' | 'video' | 'note';

export interface ProofOfService {
  id: UUID;
  type: ProofType;
  url: string;
  capturedAt: string;
  location: Location;
  hash?: string; // attestation
}

export type TrustTier = 1 | 2 | 3;

export interface Vendor {
  id: UUID;
  name: string;
  trustTier: TrustTier;
  kybVerified: boolean;
}

// LiveKit Integration Types
export interface LiveKitSession {
  roomToken: string;
  roomName: string;
}

export interface TranscriptMessage {
  id: UUID;
  speaker: 'user' | 'assistant';
  text: string;
  timestamp: string;
  partial?: boolean;
}

// WebSocket Event Types
export type WSEventType =
  | 'case.created'
  | 'case.updated'
  | 'task.opened'
  | 'task.accepted'
  | 'task.status'
  | 'proof.uploaded'
  | 'attestation.verified'
  | 'escrow.released';

export interface WSMessage {
  event: WSEventType;
  data: Case | Task | ProofOfService | { caseId: UUID; txLink: string };
}

// Feature Flags
export interface FeatureFlags {
  fast_lane: boolean;
  enable_voice: boolean;
  enable_escrow: boolean;
  enable_robotics: boolean;
  [key: string]: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// User & Authentication Types
export type UserRole = 'civilian' | 'contractor' | 'official';

export interface User {
  id: UUID;
  role: UserRole;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Contractor-specific types
export interface Contractor {
  id: UUID;
  name: string;
  email: string;
  isActive: boolean;
  skills: string[];
  trustTier?: TrustTier;
  kybVerified?: boolean;
}

// Request/Response Types for API
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
  contractorId: UUID;
}

export interface UpdatePaymentRequest {
  paymentAmount: number;
}

export interface CloseCaseRequest {
  closingNotes: string;
}

// Extended Case with additional fields for compatibility
export interface CaseHistory {
  timestamp: string;
  action: string;
  performedBy: string;
  details?: string;
}

// Extend Case interface with additional fields
declare module '.' {
  interface Case {
    reporterName?: string;
    reporterId?: UUID;
    photoURL?: string;
    assigneeId?: UUID;
    assigneeName?: string;
    paymentAmount?: number;
    priority?: 'normal' | 'high';
    updatedAt?: string;
    history?: CaseHistory[];
    completionPhotoURL?: string;
    completionNotes?: string;
    closingNotes?: string;
  }
}
