/**
 * Work Items API Service
 * Handles all work item related API calls to Firebase backend
 */

import axios from 'axios';

// API Base URLs
const API_BASE = {
  UPDATE_PROCESSED: 'https://updateprocessedupload-xglsok67aq-uc.a.run.app',
  GET_ALL_WORK: 'https://getallworkitems-xglsok67aq-uc.a.run.app',
  ASSIGN_CONTRACTOR: 'https://assignworkitemtocontractor-xglsok67aq-uc.a.run.app',
  GET_PENDING_GOV: 'https://getpendinggovapprovalitems-xglsok67aq-uc.a.run.app',
  GET_SELF_COMPLETED: 'https://getselfreportedcompleteditems-xglsok67aq-uc.a.run.app',
  UPDATE_GOV_STATUS: 'https://updategovapprovalstatus-xglsok67aq-uc.a.run.app',
  UPDATE_TO_FIXING: 'https://updatestatustofixing-xglsok67aq-uc.a.run.app',
  SUBMIT_FIXED: 'https://submitfixedwork-xglsok67aq-uc.a.run.app',
  ADD_USER_UPLOAD: 'https://adduserupload-xglsok67aq-uc.a.run.app',
  GET_USER_UPLOAD: 'https://getuserupload-xglsok67aq-uc.a.run.app',
  ADD_MESSAGE: 'https://addmessage-xglsok67aq-uc.a.run.app',
  DELETE_ALL_USER_UPLOADS: 'https://deletealluseruploads-xglsok67aq-uc.a.run.app'
};

// Types
export interface WorkItem {
  id: string;
  sourceRef?: string;
  status: 'identified' | 'pending_gov_approval' | 'gov_approved' | 'gov_denied' | 'fixing' | 'self_report_completed' | 'completed';
  issue_summary: string;
  category: string;
  location: {
    free_text: string;
    coordinates?: { lat: number; lon: number };
  };
  scores: {
    priority_score: number;
    severity_score?: number;
    severity_label?: 'low' | 'medium' | 'high' | 'critical';
  };
  evidence?: {
    photos?: string[];
  };
  safety_flags?: {
    immediate_danger: boolean;
    road_blocked: boolean;
    critical_infrastructure: boolean;
    vulnerable_persons: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
  assignedAt?: string;
  contractor_id?: string;
  case_id?: string;
  fixed_picture?: string;
  completedAt?: string;
  govReviewedAt?: string;
  fixingStartedAt?: string;
}

export interface ProcessUploadRequest {
  sourceRef: string;
  issue_summary: string;
  category: string;
  location: {
    free_text: string;
  };
  scores: {
    priority_score: number;
    severity_score?: number;
    severity_label?: string;
  };
  evidence?: any;
  factors?: any;
  entities?: any;
  confidence?: any;
}

class WorkItemsApiService {
  // Get all work items ordered by priority
  async getAllWorkItems(): Promise<WorkItem[]> {
    try {
      const response = await axios.get(API_BASE.GET_ALL_WORK);
      return response.data.workItems || [];
    } catch (error) {
      console.error('Failed to get work items:', error);
      throw error;
    }
  }

  // Get pending government approval items
  async getPendingGovApprovalItems(): Promise<WorkItem[]> {
    try {
      const response = await axios.get(API_BASE.GET_PENDING_GOV);
      return response.data.items || [];
    } catch (error) {
      console.error('Failed to get pending approval items:', error);
      throw error;
    }
  }

  // Get self-reported completed items
  async getSelfReportedCompletedItems(): Promise<WorkItem[]> {
    try {
      const response = await axios.get(API_BASE.GET_SELF_COMPLETED);
      return response.data.items || [];
    } catch (error) {
      console.error('Failed to get completed items:', error);
      throw error;
    }
  }

  // Assign work item to contractor
  async assignWorkItemToContractor(caseId: string, contractorId: string): Promise<any> {
    try {
      const response = await axios.get(API_BASE.ASSIGN_CONTRACTOR, {
        params: {
          case_id: caseId,
          contractor_id: contractorId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to assign work item:', error);
      throw error;
    }
  }

  // Update government approval status
  async updateGovApprovalStatus(caseId: string, status: 'gov_approved' | 'gov_denied' | 'completed'): Promise<any> {
    try {
      const response = await axios.post(API_BASE.UPDATE_GOV_STATUS, {
        case_id: caseId,
        status: status
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update approval status:', error);
      throw error;
    }
  }

  // Update status to fixing
  async updateStatusToFixing(caseId: string): Promise<any> {
    try {
      const response = await axios.post(API_BASE.UPDATE_TO_FIXING, {
        case_id: caseId
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update to fixing status:', error);
      throw error;
    }
  }

  // Submit fixed work
  async submitFixedWork(caseId: string, fixedPicture: string): Promise<any> {
    try {
      const response = await axios.post(API_BASE.SUBMIT_FIXED, {
        case_id: caseId,
        fixed_picture: fixedPicture
      });
      return response.data;
    } catch (error) {
      console.error('Failed to submit fixed work:', error);
      throw error;
    }
  }

  // Process an upload (used by Claude-Analyzer)
  async processUpload(data: ProcessUploadRequest): Promise<any> {
    try {
      const response = await axios.post(API_BASE.UPDATE_PROCESSED, data);
      return response.data;
    } catch (error) {
      console.error('Failed to process upload:', error);
      throw error;
    }
  }

  // Add user upload (voice transcript + picture)
  async addUserUpload(transcript: string, picture?: string): Promise<any> {
    try {
      const response = await axios.post(API_BASE.ADD_USER_UPLOAD, {
        transcript,
        picture: picture || ''
      });
      return response.data;
    } catch (error) {
      console.error('Failed to add user upload:', error);
      throw error;
    }
  }

  // Get user upload by upload ID
  async getUserUpload(uploadId: string): Promise<any> {
    try {
      const response = await axios.get(API_BASE.GET_USER_UPLOAD, {
        params: { upload_id: uploadId }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get user upload:', error);
      throw error;
    }
  }

  // Add message (for chat/communication)
  async addMessage(caseId: string, message: string, sender: string): Promise<any> {
    try {
      const response = await axios.post(API_BASE.ADD_MESSAGE, {
        case_id: caseId,
        message,
        sender
      });
      return response.data;
    } catch (error) {
      console.error('Failed to add message:', error);
      throw error;
    }
  }

  // Delete all user uploads (admin function)
  async deleteAllUserUploads(): Promise<any> {
    try {
      const response = await axios.post(API_BASE.DELETE_ALL_USER_UPLOADS);
      return response.data;
    } catch (error) {
      console.error('Failed to delete user uploads:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new WorkItemsApiService();
