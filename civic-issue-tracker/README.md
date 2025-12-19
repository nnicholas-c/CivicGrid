# Civic Issue Tracker - Frontend Application

A comprehensive role-based frontend application for managing community issues with seamless backend integration support.

## Overview

This application enables transparent community governance through a multi-role system:

- **Civilians (Public Users)**: Report issues with photo validation, track case status
- **Verified Contractors**: View assigned tasks, update work progress, upload completion photos
- **Government Officials**: Admin dashboard to review, approve, assign, and manage all cases

## Key Features

### For All Users
- Public case listing (no authentication required)
- Transparent status tracking
- Photo-validated submissions
- Responsive mobile-first design
- Search and filter capabilities

### For Civilians
- Report issues with required photo upload
- Optional account creation for notifications
- Personal dashboard to track submitted reports
- Reference number system for anonymous tracking

### For Contractors
- Dedicated task dashboard
- Real-time assignment notifications
- Status update controls (In Progress, Completed)
- Payment tracking
- Completion photo upload

### For Government Officials
- Comprehensive admin control panel
- Case approval/denial workflow
- Contractor assignment system
- Payment management
- Case escalation
- Manual closure with notes
- Full case history and audit trail

## Installation & Setup

```bash
# Navigate to project directory
cd civic-issue-tracker

# Install dependencies (already done)
npm install

# Start development server
npm start
```

The application will run at `http://localhost:3000`

## Development Login (Mock Mode)

The app currently runs with mock data. You can log in with **any email/password**:

- **Civilian**: Select role "Civilian (Reporter)"
- **Contractor**: Select role "Verified Contractor"
- **Official**: Select role "Government Official"

## Technology Stack

- React 18 with TypeScript
- React Router DOM for routing
- Axios for HTTP requests
- Context API for state management
- CSS3 with custom design system

## Backend Integration

### Configuration

Edit `src/config.ts` to connect to your backend:

```typescript
const config = {
  apiBaseUrl: 'http://localhost:8000/api', // Change to your backend URL
  useMockData: false, // Set to false when backend is ready
};
```

### Expected API Endpoints

The frontend expects these REST API endpoints:

**Authentication**
- `POST /api/login` - User authentication

**Public**
- `GET /api/cases` - Get all open cases
- `POST /api/report` - Submit new case (multipart/form-data)

**Civilian**
- `GET /api/my-cases` - Get user's cases

**Contractor**
- `GET /api/assigned-cases` - Get assigned tasks
- `POST /api/cases/:id/status` - Update status

**Official**
- `GET /api/admin/cases` - Get all cases
- `POST /api/cases/:id/approve` - Approve case
- `POST /api/cases/:id/assign` - Assign to contractor
- `POST /api/cases/:id/payment` - Update payment
- `POST /api/cases/:id/escalate` - Escalate priority
- `POST /api/cases/:id/close` - Close case

See TypeScript types in `src/types/index.ts` for data contracts.

## Project Structure

```
src/
├── components/       # Reusable components
├── context/         # Auth context
├── pages/           # Route pages (Home, Dashboards, etc)
├── services/        # API service layer with mock data
├── types/           # TypeScript definitions
├── config.ts        # Configuration
├── App.tsx          # Main app
└── App.css          # Styling
```

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm run build`
Builds the app for production to the `build` folder

### `npm test`
Launches the test runner

## Deployment

```bash
# Build for production
npm run build

# Deploy the build/ folder to your hosting service
```

## Future Enhancements

- Map integration for geolocation
- Real-time updates via WebSockets
- Email/SMS notifications
- Analytics dashboard
- Advanced search and filtering

---

Built for transparent community governance with seamless backend integration.
