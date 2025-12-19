// API Service Layer - All backend communication goes through here
// This file defines the interface between frontend and backend
// Mock data is provided for development; switch to real API calls when backend is ready

import axios, { AxiosInstance } from 'axios';
import config from '../config';
import {
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
} from '../types';

// Create axios instance with base configuration
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

// Mock data for development
const mockCases: Case[] = [
  {
    id: '1',
    description: 'Large pothole on Main Street causing traffic issues',
    location: '123 Main St, Springfield',
    photoURL: 'https://via.placeholder.com/400x300?text=Pothole',
    status: 'in_progress',
    reporterName: 'Anonymous',
    assigneeId: 'contractor1',
    assigneeName: 'John Smith',
    paymentAmount: 150,
    priority: 'high',
    createdAt: '2025-01-20T10:30:00Z',
    updatedAt: '2025-01-22T14:00:00Z',
    history: [
      { timestamp: '2025-01-20T10:30:00Z', action: 'Reported', performedBy: 'Citizen' },
      { timestamp: '2025-01-20T11:00:00Z', action: 'Approved', performedBy: 'Official Jane Doe' },
      { timestamp: '2025-01-21T09:00:00Z', action: 'Assigned', performedBy: 'Official Jane Doe', details: 'Assigned to John Smith' },
      { timestamp: '2025-01-22T14:00:00Z', action: 'In Progress', performedBy: 'Contractor John Smith' },
    ],
  },
  {
    id: '2',
    description: 'Broken streetlight near school zone',
    location: '456 Oak Avenue, Springfield',
    photoURL: 'https://via.placeholder.com/400x300?text=Streetlight',
    status: 'pending',
    reporterName: 'Sarah Johnson',
    priority: 'normal',
    createdAt: '2025-01-23T08:15:00Z',
    updatedAt: '2025-01-23T08:15:00Z',
    history: [
      { timestamp: '2025-01-23T08:15:00Z', action: 'Reported', performedBy: 'Sarah Johnson' },
    ],
  },
  {
    id: '3',
    description: 'Graffiti on public park wall',
    location: 'Central Park, West Entrance',
    photoURL: 'https://via.placeholder.com/400x300?text=Graffiti',
    status: 'assigned',
    reporterName: 'Anonymous',
    assigneeId: 'contractor2',
    assigneeName: 'Maria Garcia',
    paymentAmount: 200,
    priority: 'normal',
    createdAt: '2025-01-21T15:45:00Z',
    updatedAt: '2025-01-22T10:30:00Z',
    history: [
      { timestamp: '2025-01-21T15:45:00Z', action: 'Reported', performedBy: 'Citizen' },
      { timestamp: '2025-01-22T09:00:00Z', action: 'Approved', performedBy: 'Official Bob Wilson' },
      { timestamp: '2025-01-22T10:30:00Z', action: 'Assigned', performedBy: 'Official Bob Wilson', details: 'Assigned to Maria Garcia' },
    ],
  },
];

const mockContractors: Contractor[] = [
  { id: 'contractor1', name: 'John Smith', email: 'john@contractors.com', isActive: true, skills: ['Road repair', 'Pothole filling'] },
  { id: 'contractor2', name: 'Maria Garcia', email: 'maria@contractors.com', isActive: true, skills: ['Painting', 'Graffiti removal'] },
  { id: 'contractor3', name: 'James Wilson', email: 'james@contractors.com', isActive: true, skills: ['Electrical', 'Lighting'] },
];

// API Functions - These will call real endpoints when backend is ready

class ApiService {
  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    if (config.useMockData) {
      // Mock login
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

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

    // Real API call (uncomment when backend is ready)
    const response = await apiClient.post<LoginResponse>('/login', credentials);
    return response.data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Public Case Operations
  async getOpenCases(): Promise<Case[]> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockCases.filter(c => c.status !== 'closed' && c.status !== 'denied');
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

  // Civilian Operations
  async reportCase(data: ReportCaseRequest): Promise<ReportCaseResponse> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newCase: Case = {
        id: 'case-' + Date.now(),
        description: data.description,
        location: data.location,
        photoURL: URL.createObjectURL(data.photo),
        status: 'pending',
        reporterName: data.contactEmail || 'Anonymous',
        priority: 'normal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

    // Real API call with multipart form data
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
      // Return cases for logged in user (filter by reporter)
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
      mockCases[caseIndex].history.push({
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

  async approveCase(caseId: string): Promise<Case> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const caseIndex = mockCases.findIndex(c => c.id === caseId);
      if (caseIndex === -1) throw new Error('Case not found');

      mockCases[caseIndex].status = 'approved';
      mockCases[caseIndex].updatedAt = new Date().toISOString();
      mockCases[caseIndex].history.push({
        timestamp: new Date().toISOString(),
        action: 'Approved',
        performedBy: 'Official',
      });

      return mockCases[caseIndex];
    }

    const response = await apiClient.post<Case>(`/cases/${caseId}/approve`);
    return response.data;
  }

  async denyCase(caseId: string, reason: string): Promise<Case> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const caseIndex = mockCases.findIndex(c => c.id === caseId);
      if (caseIndex === -1) throw new Error('Case not found');

      mockCases[caseIndex].status = 'denied';
      mockCases[caseIndex].updatedAt = new Date().toISOString();
      mockCases[caseIndex].history.push({
        timestamp: new Date().toISOString(),
        action: 'Denied',
        performedBy: 'Official',
        details: reason,
      });

      return mockCases[caseIndex];
    }

    const response = await apiClient.post<Case>(`/cases/${caseId}/deny`, { reason });
    return response.data;
  }

  async assignCase(caseId: string, data: AssignCaseRequest): Promise<Case> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const caseIndex = mockCases.findIndex(c => c.id === caseId);
      if (caseIndex === -1) throw new Error('Case not found');

      const contractor = mockContractors.find(c => c.id === data.contractorId);
      if (!contractor) throw new Error('Contractor not found');

      mockCases[caseIndex].status = 'assigned';
      mockCases[caseIndex].assigneeId = contractor.id;
      mockCases[caseIndex].assigneeName = contractor.name;
      mockCases[caseIndex].updatedAt = new Date().toISOString();
      mockCases[caseIndex].history.push({
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

  async updatePayment(caseId: string, data: UpdatePaymentRequest): Promise<Case> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const caseIndex = mockCases.findIndex(c => c.id === caseId);
      if (caseIndex === -1) throw new Error('Case not found');

      const oldAmount = mockCases[caseIndex].paymentAmount;
      mockCases[caseIndex].paymentAmount = data.paymentAmount;
      mockCases[caseIndex].updatedAt = new Date().toISOString();
      mockCases[caseIndex].history.push({
        timestamp: new Date().toISOString(),
        action: 'Payment Updated',
        performedBy: 'Official',
        details: `Changed from $${oldAmount || 0} to $${data.paymentAmount}`,
      });

      return mockCases[caseIndex];
    }

    const response = await apiClient.post<Case>(`/cases/${caseId}/payment`, data);
    return response.data;
  }

  async escalateCase(caseId: string): Promise<Case> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const caseIndex = mockCases.findIndex(c => c.id === caseId);
      if (caseIndex === -1) throw new Error('Case not found');

      mockCases[caseIndex].priority = 'high';
      mockCases[caseIndex].updatedAt = new Date().toISOString();
      mockCases[caseIndex].history.push({
        timestamp: new Date().toISOString(),
        action: 'Escalated',
        performedBy: 'Official',
        details: 'Marked as high priority',
      });

      return mockCases[caseIndex];
    }

    const response = await apiClient.post<Case>(`/cases/${caseId}/escalate`);
    return response.data;
  }

  async closeCase(caseId: string, data: CloseCaseRequest): Promise<Case> {
    if (config.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const caseIndex = mockCases.findIndex(c => c.id === caseId);
      if (caseIndex === -1) throw new Error('Case not found');

      mockCases[caseIndex].status = 'closed';
      mockCases[caseIndex].closingNotes = data.closingNotes;
      mockCases[caseIndex].updatedAt = new Date().toISOString();
      mockCases[caseIndex].history.push({
        timestamp: new Date().toISOString(),
        action: 'Closed',
        performedBy: 'Official',
        details: data.closingNotes,
      });

      return mockCases[caseIndex];
    }

    const response = await apiClient.post<Case>(`/cases/${caseId}/close`, data);
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
