# Firebase Cloud Functions Integration

This document details the complete integration of all Firebase Cloud Functions into the CivicGrid frontend.

## All Integrated Endpoints

### Work Items Management

| Function | URL | Method | Frontend Usage |
|----------|-----|--------|----------------|
| `getAllWorkItems` | https://getallworkitems-xglsok67aq-uc.a.run.app | GET | GovernmentDashboard, ContractorWorkItems |
| `getPendingGovApprovalItems` | https://getpendinggovapprovalitems-xglsok67aq-uc.a.run.app | GET | GovernmentDashboard |
| `getSelfReportedCompletedItems` | https://getselfreportedcompleteditems-xglsok67aq-uc.a.run.app | GET | GovernmentDashboard |
| `assignWorkItemToContractor` | https://assignworkitemtocontractor-xglsok67aq-uc.a.run.app | GET | GovernmentDashboard |

### Status Updates

| Function | URL | Method | Frontend Usage |
|----------|-----|--------|----------------|
| `updateGovApprovalStatus` | https://updategovapprovalstatus-xglsok67aq-uc.a.run.app | POST | GovernmentDashboard |
| `updateStatusToFixing` | https://updatestatustofixing-xglsok67aq-uc.a.run.app | POST | ContractorWorkItems |
| `submitFixedWork` | https://submitfixedwork-xglsok67aq-uc.a.run.app | POST | ContractorWorkItems |

### User Uploads

| Function | URL | Method | Frontend Usage |
|----------|-----|--------|----------------|
| `addUserUpload` | https://adduserupload-xglsok67aq-uc.a.run.app | POST | VoiceReportIssue (via voiceAgentApi) |
| `getUserUpload` | https://getuserupload-xglsok67aq-uc.a.run.app | GET | Available for future features |
| `updateProcessedUpload` | https://updateprocessedupload-xglsok67aq-uc.a.run.app | POST | Claude Analyzer backend |
| `deleteAllUserUploads` | https://deletealluseruploads-xglsok67aq-uc.a.run.app | POST | AdminPanel |

### Communication

| Function | URL | Method | Frontend Usage |
|----------|-----|--------|----------------|
| `addmessage` | https://addmessage-xglsok67aq-uc.a.run.app | POST | WorkItemMessaging component |

## Frontend Components

### New Pages Created

#### 1. `/contractor/work-items` - ContractorWorkItems
**File:** `src/pages/ContractorWorkItems.tsx`

Features:
- View all assigned work items (gov_approved, fixing, self_report_completed)
- Start fixing work items with `updateStatusToFixing()`
- Submit completion evidence with photos using `submitFixedWork()`
- Real-time status tracking
- Photo upload for completion verification

**Key Endpoints Used:**
- `getAllWorkItems()` - Load work items
- `updateStatusToFixing(caseId)` - Start work
- `submitFixedWork(caseId, base64Photo)` - Submit completion

#### 2. `/admin/panel` - AdminPanel
**File:** `src/pages/AdminPanel.tsx`

Features:
- Administrative system management
- Delete all user uploads (with confirmation)
- System information display
- Danger zone with safety checks

**Key Endpoints Used:**
- `deleteAllUserUploads()` - Admin cleanup function

#### 3. WorkItemMessaging Component
**File:** `src/components/WorkItemMessaging.tsx`

Features:
- Real-time messaging between stakeholders
- Message history display
- Send messages with sender identification
- Can be embedded in any work item view

**Key Endpoints Used:**
- `addMessage(caseId, message, sender)` - Send messages

### Existing Pages Using Firebase

#### GovernmentDashboard (`/government/dashboard`)
**Endpoints Used:**
- `getAllWorkItems()`
- `getPendingGovApprovalItems()`
- `getSelfReportedCompletedItems()`
- `updateGovApprovalStatus(caseId, status)`
- `assignWorkItemToContractor(caseId, contractorId)`

#### VoiceReportIssue (`/report`)
**Endpoints Used (via voiceAgentApi):**
- Voice agent triggers `addUserUpload()` automatically
- Claude Analyzer processes and calls `updateProcessedUpload()`

## API Service

### Location
`src/services/workItemsApi.ts`

### All Available Methods

```typescript
// Get operations
getAllWorkItems(): Promise<WorkItem[]>
getPendingGovApprovalItems(): Promise<WorkItem[]>
getSelfReportedCompletedItems(): Promise<WorkItem[]>
getUserUpload(uploadId: string): Promise<any>

// Update operations
updateStatusToFixing(caseId: string): Promise<any>
submitFixedWork(caseId: string, fixedPicture: string): Promise<any>
updateGovApprovalStatus(caseId: string, status: 'gov_approved' | 'gov_denied' | 'completed'): Promise<any>
assignWorkItemToContractor(caseId: string, contractorId: string): Promise<any>

// Upload operations
addUserUpload(transcript: string, picture?: string): Promise<any>
processUpload(data: ProcessUploadRequest): Promise<any>

// Communication
addMessage(caseId: string, message: string, sender: string): Promise<any>

// Admin
deleteAllUserUploads(): Promise<any>
```

## Configuration Changes

### Mock Data Disabled
**File:** `src/config.ts`

```typescript
useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true'
// Default: false - uses real Firebase data
```

To enable mock data for testing:
```bash
VITE_USE_MOCK_DATA=true npm run dev
```

## Routes

### New Routes Added to App.tsx

```typescript
// Contractor
/contractor/work-items - ContractorWorkItems (Protected: contractor role)

// Admin
/admin/panel - AdminPanel (Protected: official role)
```

## Data Flow

### Complete Workflow

1. **Citizen Reports Issue** (Voice Agent)
   - Voice conversation → WebSocket → ML Backend
   - Transcript + photo → `addUserUpload()`
   - Saved to Firebase `user_uploads` collection

2. **Claude Analyzer Processes**
   - Triggers automatically
   - Analyzes transcript + images
   - Creates structured JSON
   - Calls `updateProcessedUpload()` → Creates work_items

3. **Government Review**
   - `getPendingGovApprovalItems()` - View pending
   - `updateGovApprovalStatus()` - Approve/deny
   - `assignWorkItemToContractor()` - Assign work

4. **Contractor Work**
   - `getAllWorkItems()` - View assigned items
   - `updateStatusToFixing()` - Start work
   - `submitFixedWork()` - Submit completion with photo

5. **Government Verification**
   - `getSelfReportedCompletedItems()` - View completed work
   - `updateGovApprovalStatus('completed')` - Mark as verified

## TypeScript Interfaces

### WorkItem
```typescript
interface WorkItem {
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
  contractor_id?: string;
  case_id?: string;
  fixed_picture?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}
```

## Testing

### Manual Testing Workflow

1. **Test Voice Reporting**
   ```
   - Navigate to /report
   - Start voice call
   - Report an issue
   - Upload photo
   - End call
   ```

2. **Test Government Approval**
   ```
   - Login as official
   - Navigate to /government/dashboard
   - View pending items
   - Approve/assign work
   ```

3. **Test Contractor Workflow**
   ```
   - Login as contractor
   - Navigate to /contractor/work-items
   - Start fixing an approved item
   - Upload completion photo
   - Submit for verification
   ```

4. **Test Admin Functions**
   ```
   - Login as official
   - Navigate to /admin/panel
   - Use deleteAllUserUploads (with caution!)
   ```

## Environment Variables

Required variables (set in `.env`):
```bash
VITE_ML_BACKEND_URL=http://localhost:3000  # Voice agent backend
VITE_USE_MOCK_DATA=false                   # Use real Firebase data
```

## Security Notes

1. **Admin Functions**: Only accessible to users with 'official' role
2. **Protected Routes**: All new routes use ProtectedRoute component
3. **Destructive Operations**: Require confirmation (e.g., deleteAllUserUploads)
4. **Real-time Data**: All endpoints use live Firebase data by default

## Future Enhancements

Potential features using existing endpoints:

1. **getUserUpload Integration**
   - View raw upload data before processing
   - Audit trail for uploaded content

2. **Enhanced Messaging**
   - Retrieve message history
   - Real-time message updates
   - Notification system

3. **Analytics Dashboard**
   - Use getAllWorkItems for statistics
   - Performance metrics
   - Contractor efficiency tracking

## Troubleshooting

### Common Issues

1. **Mock data still showing**
   - Check `VITE_USE_MOCK_DATA` environment variable
   - Ensure it's set to `false` or not set

2. **Endpoints not responding**
   - Verify Firebase Cloud Functions are deployed
   - Check network tab for CORS errors
   - Ensure functions are in us-central1 region

3. **Photo upload failing**
   - Check base64 encoding
   - Verify file size limits
   - Check Firebase storage rules

## Summary

✅ All 12 Firebase Cloud Functions integrated
✅ 3 new frontend components created
✅ Real Firebase data enabled by default
✅ Complete contractor workflow implemented
✅ Admin panel for system management
✅ Messaging system ready
✅ Full TypeScript type safety
