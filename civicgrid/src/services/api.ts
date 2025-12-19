// API Service Layer - All backend communication
// Mock data provided for development

import axios from 'axios';
import type { AxiosInstance } from 'axios';
import config from '../config';
import type {
  Case,
  Contractor,
  LoginRequest,
  LoginResponse,
  ReportCaseRequest,
  ReportCaseResponse,
  UpdateStatusRequest,
  AssignCaseRequest,
  UpdatePaymentRequest,
  CloseCaseRequest,
  CaseHistory,
} from '../types';

// Axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock data
const mockCases: Case[] = [
  {
    id: '1',
    category: 'pothole',
    severity: 'high',
    description: 'Large pothole on Main Street causing traffic issues',
    location: { address: '123 Main St, Springfield', lat: 37.7749, lng: -122.4194 },
    createdAt: '2025-01-20T10:30:00Z',
    updatedAt: '2025-01-22T14:00:00Z',
    reporterChannel: 'web',
    status: 'in_progress',
    sla: { targetHours: 48, priority: 'high', source: 'city' },
    reporterName: 'Anonymous',
    photoURL: 'https://via.placeholder.com/400x300?text=Pothole',
    assigneeId: 'contractor1',
    assigneeName: 'John Smith',
    paymentAmount: 150,
    priority: 'high',
    history: [
      { timestamp: '2025-01-20T10:30:00Z', action: 'Reported', performedBy: 'Citizen' },
      { timestamp: '2025-01-20T11:00:00Z', action: 'Approved', performedBy: 'Official Jane Doe' },
      { timestamp: '2025-01-21T09:00:00Z', action: 'Assigned', performedBy: 'Official Jane Doe', details: 'Assigned to John Smith' },
      { timestamp: '2025-01-22T14:00:00Z', action: 'In Progress', performedBy: 'Contractor John Smith' },
    ],
  },
  {
    id: '2',
    category: 'streetlight',
    severity: 'medium',
    description: 'Broken streetlight near school zone',
    location: { address: '456 Oak Avenue, Springfield', lat: 37.7849, lng: -122.4094 },
    createdAt: '2025-01-23T08:15:00Z',
    updatedAt: '2025-01-23T08:15:00Z',
    reporterChannel: 'voice',
    status: 'created',
    sla: { targetHours: 72, priority: 'normal', source: 'heuristic' },
    reporterName: 'Sarah Johnson',
    photoURL: 'https://via.placeholder.com/400x300?text=Streetlight',
    priority: 'normal',
    history: [
      { timestamp: '2025-01-23T08:15:00Z', action: 'Reported', performedBy: 'Sarah Johnson' },
    ],
  },
  {
    id: '3',
    category: 'trash',
    severity: 'low',
    description: 'Illegal dumping in Central Park',
    location: { address: 'Central Park, West Entrance', lat: 37.7649, lng: -122.4294 },
    createdAt: '2025-01-21T15:45:00Z',
    updatedAt: '2025-01-22T10:30:00Z',
    reporterChannel: 'sms',
    status: 'accepted',
    sla: { targetHours: 96, priority: 'normal', source: 'city' },
    reporterName: 'Anonymous',
    photoURL: 'https://via.placeholder.com/400x300?text=Trash',
    assigneeId: 'contractor2',
    assigneeName: 'Maria Garcia',
    paymentAmount: 200,
    priority: 'normal',
    history: [
      { timestamp: '2025-01-21T15:45:00Z', action: 'Reported', performedBy: 'Citizen' },
      { timestamp: '2025-01-22T09:00:00Z', action: 'Approved', performedBy: 'Official Bob Wilson' },
      { timestamp: '2025-01-22T10:30:00Z', action: 'Assigned', performedBy: 'Official Bob Wilson', details: 'Assigned to Maria Garcia' },
    ],
  },
  {
    id: '4',
    category: 'pothole',
    severity: 'medium',
    description: 'Cracked pavement on Market Street',
    location: { address: 'Market St & 5th St, San Francisco', lat: 37.7836, lng: -122.4075 },
    createdAt: '2025-01-24T09:00:00Z',
    updatedAt: '2025-01-25T16:00:00Z',
    reporterChannel: 'web',
    status: 'resolved',
    sla: { targetHours: 48, priority: 'normal', source: 'city' },
    reporterName: 'Mike Chen',
    photoURL: 'https://via.placeholder.com/400x300?text=Pavement',
    assigneeId: 'contractor1',
    assigneeName: 'John Smith',
    paymentAmount: 180,
    priority: 'normal',
    completionPhotoURL: 'https://via.placeholder.com/400x300?text=Fixed',
    history: [
      { timestamp: '2025-01-24T09:00:00Z', action: 'Reported', performedBy: 'Mike Chen' },
      { timestamp: '2025-01-24T10:00:00Z', action: 'Approved', performedBy: 'Official Jane Doe' },
      { timestamp: '2025-01-24T11:00:00Z', action: 'Assigned', performedBy: 'Official Jane Doe' },
      { timestamp: '2025-01-25T14:00:00Z', action: 'Completed', performedBy: 'Contractor John Smith' },
      { timestamp: '2025-01-25T16:00:00Z', action: 'Resolved', performedBy: 'Official Jane Doe' },
    ],
  },
  {
    id: '5',
    category: 'tree',
    severity: 'high',
    description: 'Fallen tree blocking sidewalk after storm',
    location: { address: 'Golden Gate Park, JFK Drive', lat: 37.7694, lng: -122.4862 },
    createdAt: '2025-01-25T07:30:00Z',
    updatedAt: '2025-01-25T07:30:00Z',
    reporterChannel: 'voice',
    status: 'created',
    sla: { targetHours: 24, priority: 'high', source: 'city' },
    reporterName: 'Laura Park',
    photoURL: 'https://via.placeholder.com/400x300?text=Tree',
    priority: 'high',
    history: [
      { timestamp: '2025-01-25T07:30:00Z', action: 'Reported', performedBy: 'Laura Park' },
    ],
  },
  {
    id: '6',
    category: 'streetlight',
    severity: 'medium',
    description: 'Flickering streetlight in Mission District',
    location: { address: 'Mission St & 24th St, San Francisco', lat: 37.7522, lng: -122.4186 },
    createdAt: '2025-01-24T18:00:00Z',
    updatedAt: '2025-01-25T12:00:00Z',
    reporterChannel: 'web',
    status: 'in_progress',
    sla: { targetHours: 72, priority: 'normal', source: 'heuristic' },
    reporterName: 'David Martinez',
    photoURL: 'https://via.placeholder.com/400x300?text=Streetlight',
    assigneeId: 'contractor3',
    assigneeName: 'James Wilson',
    paymentAmount: 120,
    priority: 'normal',
    history: [
      { timestamp: '2025-01-24T18:00:00Z', action: 'Reported', performedBy: 'David Martinez' },
      { timestamp: '2025-01-25T09:00:00Z', action: 'Approved', performedBy: 'Official Bob Wilson' },
      { timestamp: '2025-01-25T12:00:00Z', action: 'In Progress', performedBy: 'Contractor James Wilson' },
    ],
  },
  {
    id: '7',
    category: 'other',
    severity: 'low',
    description: 'Graffiti on public building',
    location: { address: 'Civic Center Plaza, San Francisco', lat: 37.7799, lng: -122.4193 },
    createdAt: '2025-01-23T14:20:00Z',
    updatedAt: '2025-01-25T10:00:00Z',
    reporterChannel: 'sms',
    status: 'resolved',
    sla: { targetHours: 96, priority: 'normal', source: 'city' },
    reporterName: 'Anonymous',
    photoURL: 'https://via.placeholder.com/400x300?text=Graffiti',
    assigneeId: 'contractor2',
    assigneeName: 'Maria Garcia',
    paymentAmount: 150,
    priority: 'normal',
    completionPhotoURL: 'https://via.placeholder.com/400x300?text=Clean',
    history: [
      { timestamp: '2025-01-23T14:20:00Z', action: 'Reported', performedBy: 'Citizen' },
      { timestamp: '2025-01-24T09:00:00Z', action: 'Approved', performedBy: 'Official Jane Doe' },
      { timestamp: '2025-01-24T10:00:00Z', action: 'Assigned', performedBy: 'Official Jane Doe' },
      { timestamp: '2025-01-25T08:00:00Z', action: 'Completed', performedBy: 'Contractor Maria Garcia' },
      { timestamp: '2025-01-25T10:00:00Z', action: 'Resolved', performedBy: 'Official Jane Doe' },
    ],
  },
  {
    id: '8',
    category: 'pothole',
    severity: 'high',
    description: 'Deep pothole near Fisherman\'s Wharf',
    location: { address: 'Jefferson St & Taylor St, San Francisco', lat: 37.8080, lng: -122.4177 },
    createdAt: '2025-01-25T11:15:00Z',
    updatedAt: '2025-01-25T11:15:00Z',
    reporterChannel: 'web',
    status: 'created',
    sla: { targetHours: 48, priority: 'high', source: 'city' },
    reporterName: 'Tourist Guide Services',
    photoURL: 'https://via.placeholder.com/400x300?text=Pothole',
    priority: 'high',
    history: [
      { timestamp: '2025-01-25T11:15:00Z', action: 'Reported', performedBy: 'Tourist Guide Services' },
    ],
  },
];

const mockContractors: Contractor[] = [
  { id: 'contractor1', name: 'John Smith', email: 'john@contractors.com', isActive: true, skills: ['Road repair', 'Pothole filling'], trustTier: 3, kybVerified: true },
  { id: 'contractor2', name: 'Maria Garcia', email: 'maria@contractors.com', isActive: true, skills: ['Painting', 'Graffiti removal'], trustTier: 2, kybVerified: true },
  { id: 'contractor3', name: 'James Wilson', email: 'james@contractors.com', isActive: true, skills: ['Electrical', 'Lighting'], trustTier: 3, kybVerified: false },
];

class ApiService {
  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockUser = {
        id: credentials.role === 'civilian' ? 'user1' : credentials.role === 'contractor' ? 'contractor1' : 'official1',
        role: credentials.role,
        name: credentials.role === 'civilian' ? 'Test User' : credentials.role === 'contractor' ? 'John Smith' : 'Jane Doe',
        email: credentials.email,
      };

      return {
        user: mockUser,
        token: 'mock-jwt-token-' + Date.now(),
      };
    }

    const response = await apiClient.post<LoginResponse>('/login', credentials);
    return response.data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Case Operations
  async getOpenCases(): Promise<Case[]> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockCases.filter(c => c.status !== 'resolved' && c.status !== 'paid');
    }

    const response = await apiClient.get<Case[]>('/cases');
    return response.data;
  }

  async getCaseById(id: string): Promise<Case> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const caseData = mockCases.find(c => c.id === id);
      if (!caseData) throw new Error('Case not found');
      return caseData;
    }

    const response = await apiClient.get<Case>(`/cases/${id}`);
    return response.data;
  }

  async reportCase(data: ReportCaseRequest): Promise<ReportCaseResponse> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newCase: Case = {
        id: 'case-' + Date.now(),
        category: 'other',
        severity: 'medium',
        description: data.description,
        location: { address: data.location, lat: 37.7749, lng: -122.4194 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reporterChannel: 'web',
        status: 'created',
        sla: { targetHours: 48, priority: 'normal', source: 'heuristic' },
        reporterName: data.contactEmail || 'Anonymous',
        photoURL: URL.createObjectURL(data.photo),
        priority: 'normal',
        history: [
          { timestamp: new Date().toISOString(), action: 'Reported', performedBy: data.contactEmail || 'Anonymous Citizen' }
        ],
      };

      mockCases.push(newCase);

      return {
        case: newCase,
        referenceNumber: 'REF-' + newCase.id.toUpperCase(),
      };
    }

    const formData = new FormData();
    formData.append('description', data.description);
    formData.append('location', data.location);
    formData.append('photo', data.photo);
    if (data.contactEmail) formData.append('contactEmail', data.contactEmail);
    if (data.contactPhone) formData.append('contactPhone', data.contactPhone);

    const response = await apiClient.post<ReportCaseResponse>('/report', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getMyCases(): Promise<Case[]> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockCases.filter(c => c.reporterId === 'user1');
    }

    const response = await apiClient.get<Case[]>('/my-cases');
    return response.data;
  }

  // Contractor Operations
  async getAssignedCases(): Promise<Case[]> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return mockCases.filter(c => c.assigneeId === user.id);
    }

    const response = await apiClient.get<Case[]>('/assigned-cases');
    return response.data;
  }

  async updateCaseStatus(caseId: string, data: UpdateStatusRequest): Promise<Case> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 500));

      const caseIndex = mockCases.findIndex(c => c.id === caseId);
      if (caseIndex === -1) throw new Error('Case not found');

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      mockCases[caseIndex].status = data.status;
      mockCases[caseIndex].updatedAt = new Date().toISOString();
      mockCases[caseIndex].history = mockCases[caseIndex].history || [];
      mockCases[caseIndex].history!.push({
        timestamp: new Date().toISOString(),
        action: data.status.charAt(0).toUpperCase() + data.status.slice(1).replace('_', ' '),
        performedBy: user.name || 'User',
        details: data.notes,
      });

      if (data.completionPhoto) {
        mockCases[caseIndex].completionPhotoURL = URL.createObjectURL(data.completionPhoto);
        mockCases[caseIndex].completionNotes = data.notes;
      }

      return mockCases[caseIndex];
    }

    const formData = new FormData();
    formData.append('status', data.status);
    if (data.notes) formData.append('notes', data.notes);
    if (data.completionPhoto) formData.append('completionPhoto', data.completionPhoto);

    const response = await apiClient.post<Case>(`/cases/${caseId}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Official Operations
  async getAllCases(): Promise<Case[]> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [...mockCases];
    }

    const response = await apiClient.get<Case[]>('/admin/cases');
    return response.data;
  }

  async assignCase(caseId: string, data: AssignCaseRequest): Promise<Case> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const caseIndex = mockCases.findIndex(c => c.id === caseId);
      if (caseIndex === -1) throw new Error('Case not found');

      const contractor = mockContractors.find(c => c.id === data.contractorId);
      if (!contractor) throw new Error('Contractor not found');

      mockCases[caseIndex].status = 'accepted';
      mockCases[caseIndex].assigneeId = contractor.id;
      mockCases[caseIndex].assigneeName = contractor.name;
      mockCases[caseIndex].updatedAt = new Date().toISOString();
      mockCases[caseIndex].history = mockCases[caseIndex].history || [];
      mockCases[caseIndex].history!.push({
        timestamp: new Date().toISOString(),
        action: 'Assigned',
        performedBy: 'Official',
        details: `Assigned to ${contractor.name}`,
      });

      return mockCases[caseIndex];
    }

    const response = await apiClient.post<Case>(`/cases/${caseId}/assign`, data);
    return response.data;
  }

  async getContractors(): Promise<Contractor[]> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return [...mockContractors];
    }

    const response = await apiClient.get<Contractor[]>('/contractors');
    return response.data;
  }
}

const apiService = new ApiService();
export default apiService;
