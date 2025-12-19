# CivicGrid Frontend - Complete Implementation Guide

## Project Status

✅ **Completed:**
- Vite + React + TypeScript project structure
- Tailwind CSS with glassmorphism utilities
- Vibrant gradient color system
- Global TypeScript types
- All dependencies installed

## What You Have Running

The **Civic Issue Tracker** (at localhost:3000) has ALL core functionality:
- ✅ Complete case management workflow
- ✅ Photo validation & upload
- ✅ Role-based dashboards (Civilian/Contractor/Official)
- ✅ Real-time status tracking
- ✅ Responsive mobile design
- ✅ TypeScript + React best practices

## Quick Win Strategy: Convert Existing to Glassmorphism

### Option 1: Fastest Path (1-2 hours)

**Copy the working app and add Tailwind glassmorphism:**

1. **Install Tailwind in civic-issue-tracker:**
```bash
cd /Users/nicholaschen/CalHacks-2025/civic-issue-tracker
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2. **Replace CSS with the glassmorphism theme:**
- Copy `/civicgrid/src/index.css` to `/civic-issue-tracker/src/index.css`
- Update `tailwind.config.js` with the vibrant config from civicgrid

3. **Convert components to use Tailwind classes:**

**Example conversion for a card:**
```tsx
// OLD (CSS classes)
<div className="case-card">
  <div className="case-card-header">
    <span className="case-id">#{case.id}</span>
    <span className="status-badge">{status}</span>
  </div>
</div>

// NEW (Tailwind glassmorphism)
<div className="glass rounded-2xl overflow-hidden hover-lift">
  <div className="glass-strong p-4 border-b border-white/10">
    <span className="text-sm font-semibold text-indigo-600">#{case.id}</span>
    <span className="gradient-primary text-white px-3 py-1 rounded-full text-xs">
      {status}
    </span>
  </div>
</div>
```

### Option 2: Fresh CivicGrid Build (Recommended for Hackathon)

## File Structure to Create

```
/civicgrid/src/
├── app/
│   ├── routes/
│   │   ├── Landing.tsx          ← Vibrant hero with animations
│   │   ├── Report.tsx            ← LiveKit voice + SMS fallback
│   │   ├── CaseDetail.tsx        ← Timeline with glassmorphism
│   │   ├── Board.tsx             ← MapLibre with clusters
│   │   ├── Vendor.tsx            ← Job acceptance portal
│   │   ├── Ops.tsx               ← Admin console
│   │   └── Demo.tsx              ← 120s guided tour
│   └── providers/
│       ├── QueryProvider.tsx
│       ├── ThemeProvider.tsx
│       └── StoreProvider.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Nav.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── Input.tsx
│   ├── case/
│   │   ├── CaseTimeline.tsx
│   │   ├── CaseCard.tsx
│   │   └── StatusBadge.tsx
│   ├── vendor/
│   │   ├── JobCard.tsx
│   │   ├── AcceptButton.tsx
│   │   └── ProofUpload.tsx
│   ├── maps/
│   │   └── MapBoard.tsx
│   └── voice/
│       └── PhoneCallCard.tsx
├── lib/
│   ├── api.ts                    ← API client
│   ├── ws-client.ts              ← WebSocket
│   └── livekit-client.ts         ← LiveKit
├── hooks/
│   ├── useCase.ts
│   ├── useRealtime.ts
│   └── useFeatureFlags.ts
├── store/
│   └── store.ts                  ← Zustand state
└── types/
    └── index.ts                  ✅ Already created
```

## Key Components Code

### 1. Glassmorphism Card Component

```tsx
// src/components/ui/Card.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  const Component = hover ? motion.div : 'div';

  return (
    <Component
      className={`glass rounded-2xl p-6 ${hover ? 'hover-lift' : ''} ${className}`}
      {...(hover && {
        whileHover: { scale: 1.02 },
        transition: { duration: 0.2 }
      })}
    >
      {children}
    </Component>
  );
}
```

### 2. Vibrant Hero Section

```tsx
// src/app/routes/Landing.tsx
import { motion } from 'framer-motion';
import { Phone, MapPin, Sparkles } from 'lucide-react';

export function Landing() {
  return (
    <div className="min-h-screen">
      {/* Animated Gradient Hero */}
      <section className="relative overflow-hidden py-20">
        {/* Animated background blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-6xl font-bold mb-6">
              <span className="gradient-text">
                Fix Your City
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                In Real Time
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Report issues by voice, watch them get fixed, verified on-chain
            </p>

            {/* CTA Buttons with Glassmorphism */}
            <div className="flex gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass-strong px-8 py-4 rounded-2xl font-semibold gradient-primary text-white glow-blue"
              >
                <Phone className="inline mr-2" size={20} />
                Call AI Assistant
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass px-8 py-4 rounded-2xl font-semibold"
              >
                <MapPin className="inline mr-2" size={20} />
                View Civic Grid
              </motion.button>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-6 mt-20 max-w-3xl mx-auto"
          >
            {[
              { label: 'Issues Fixed', value: '1,234', icon: Sparkles },
              { label: 'Avg Response', value: '<2hrs', icon: Clock },
              { label: 'Vendors', value: '156', icon: Users }
            ].map((stat, i) => (
              <div key={i} className="glass rounded-2xl p-6 text-center">
                <stat.icon className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
```

### 3. Case Card with Glassmorphism

```tsx
// src/components/case/CaseCard.tsx
import { motion } from 'framer-motion';
import { MapPin, Clock, DollarSign } from 'lucide-react';
import { Case } from '@/types';

interface CaseCardProps {
  case: Case;
  onClick?: () => void;
}

export function CaseCard({ case: caseData, onClick }: CaseCardProps) {
  const severityColors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass rounded-2xl overflow-hidden cursor-pointer group"
    >
      {/* Status Header */}
      <div className="glass-strong p-4 flex justify-between items-center border-b border-white/10">
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
          #{caseData.id.slice(0, 8)}
        </span>
        <div className="flex gap-2">
          <span className={`${severityColors[caseData.severity]} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
            {caseData.severity.toUpperCase()}
          </span>
          <span className="gradient-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
            {caseData.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">
          {caseData.category.charAt(0).toUpperCase() + caseData.category.slice(1)}
        </h3>

        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {caseData.description || 'No description provided'}
        </p>

        {/* Meta Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <MapPin size={16} />
            <span className="truncate">{caseData.location.address || 'Location provided'}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Clock size={16} />
            <span>SLA: {caseData.sla.targetHours}hrs ({caseData.sla.priority})</span>
          </div>

          {caseData.taskId && (
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-green-500" />
              <span className="text-green-600 dark:text-green-400 font-semibold">
                Task assigned
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect Glow */}
      <div className="absolute inset-0 -z-10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity glow-blue" />
    </motion.div>
  );
}
```

### 4. API Client

```typescript
// src/lib/api.ts
import { Case, Task, Vendor, LiveKitSession, ProofOfService } from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class ApiClient {
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Cases
  async getCases(params?: { status?: string; bbox?: string }): Promise<{ cases: Case[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.fetch(`/cases?${query}`);
  }

  async getCase(id: string): Promise<{ case: Case }> {
    return this.fetch(`/cases/${id}`);
  }

  async createCase(data: Partial<Case>): Promise<{ case: Case }> {
    return this.fetch(`/cases`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Voice intake
  async createVoiceSession(): Promise<LiveKitSession> {
    return this.fetch(`/intake/voice/session`, { method: 'POST' });
  }

  // Tasks
  async getTasks(state?: string): Promise<{ tasks: Task[] }> {
    const query = state ? `?state=${state}` : '';
    return this.fetch(`/tasks${query}`);
  }

  async acceptTask(taskId: string): Promise<{ task: Task }> {
    return this.fetch(`/tasks/${taskId}/accept`, { method: 'POST' });
  }

  async submitTask(taskId: string): Promise<{ task: Task }> {
    return this.fetch(`/tasks/${taskId}/submit`, { method: 'POST' });
  }

  // Proofs
  async uploadProof(taskId: string, file: File, location: any): Promise<{ proof: ProofOfService }> {
    const formData = new FormData();
    formData.append('proof', file);
    formData.append('location', JSON.stringify(location));

    const response = await fetch(`${API_BASE}/tasks/${taskId}/proofs`, {
      method: 'POST',
      body: formData,
    });

    return response.json();
  }

  // Vendor
  async getVendorMe(): Promise<{ vendor: Vendor }> {
    return this.fetch(`/vendor/me`);
  }
}

export const api = new ApiClient();
```

## Quick Commands to Run

```bash
# In civicgrid directory
cd /Users/nicholaschen/CalHacks-2025/civicgrid

# Start dev server
npm run dev

# In another terminal, if you want to keep the old app running
cd /Users/nicholaschen/CalHacks-2025/civic-issue-tracker
npm start
```

## Hackathon Demo Strategy

### Recommended: Hybrid Approach

1. **Keep civic-issue-tracker running** (localhost:3000)
   - It has ALL functionality working
   - Complete workflow ready to demo
   - Just needs visual polish

2. **Build landing page in civicgrid** (localhost:5173)
   - Stunning glassmorphism hero
   - Animated statistics
   - Vibrant gradients
   - Then link to main app

3. **Demo Flow:**
   - Start on civicgrid landing (WOW factor)
   - Click "View Civic Grid" → civic-issue-tracker/cases
   - Demo complete workflow
   - Emphasize: "AI voice intake coming next sprint"

This gives you:
- ✅ Visual impact (glassmorphism landing)
- ✅ Working demo (full app)
- ✅ Professional presentation
- ✅ Room to expand

## Time Budget

**2 hours total:**
- 30 min: Finish landing page in civicgrid
- 30 min: Style a few key components with glassmorphism
- 30 min: Connect routing between apps
- 30 min: Demo script and presentation

**You have a COMPLETE working app already. Focus on the story!**

## Next Steps

Would you like me to:
1. ✨ Build the stunning glassmorphism landing page
2. 🗺️ Create the MapBoard component
3. 📞 Add LiveKit voice integration
4. 🎬 Write the 120-second demo script

The foundation is solid - let's make it shine! 🚀
