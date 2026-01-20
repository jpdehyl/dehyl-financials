# Claude Code Prompt: Build DeHyl Project Financial System

## Context

You are building a financial dashboard for DeHyl Constructors Corp, a demolition & restoration company in BC, Canada (~$500K/year). The owner (JP) needs one place to see all active projects, who owes him money (receivables), and what bills he needs to pay (payables).

**Read these files first:**
- `CLAUDE.md` - Technical context and architecture decisions
- `docs/PRD.md` - Full product requirements with user stories
- `src/types/index.ts` - TypeScript interfaces already defined

## What to Build (Phase 1 MVP)

Build a Next.js 16 web app with these pages:

### 1. Dashboard (`/`)
- KPI cards showing: Total Receivables, Total Payables, Net Position, Active Projects count
- Alerts panel: Overdue invoices, Bills due this week, Projects missing estimates
- Recent activity feed
- Design: Modern financial dashboard, dark/light mode toggle, inspired by Aniq-UI template aesthetic

### 2. Projects Page (`/projects`)
- Table listing all projects from Google Drive folder
- Columns: Project Code, Client, Description, Estimate $, Invoiced $, Paid $, Costs $, Profit $, Status
- Filterable by: Client, Status (Active/Closed), Date range
- Click row → Project detail page
- Project folder naming convention: `YYMM### - ClientCode - Description` (e.g., `2601007 - CD - PetroCan Kamloops`)

### 3. Project Detail (`/projects/[id]`)
- Header with project info (code, client, description, Drive folder link)
- Financial summary cards: Estimate vs Invoiced vs Paid vs Costs = Profit
- List of invoices linked to this project
- List of bills/costs linked to this project
- Action: Link unassigned invoices/bills to this project

### 4. Receivables Page (`/receivables`)
- Table of all open invoices from QuickBooks (where Balance > 0)
- Columns: Invoice #, Client, Amount, Balance, Issue Date, Due Date, Days Overdue, Project (if linked)
- Highlight overdue invoices in red
- Filter: All / Overdue / Due This Week
- Action: Assign invoice to project (dropdown picker)
- Show total outstanding at top

### 5. Payables Page (`/payables`)
- Table of all open bills from QuickBooks (where Balance > 0)
- Columns: Vendor, Amount, Balance, Bill Date, Due Date, Days Until Due, Project (if linked)
- Highlight overdue in red, due within 7 days in yellow
- Filter: All / Overdue / Due This Week
- Action: Assign bill to project
- Show total outstanding at top

### 6. Settings Page (`/settings`)
- QuickBooks connection status + Connect/Disconnect button
- Google Drive connection status + Connect/Disconnect button
- Manual sync button with last synced timestamp
- Client code mappings table (CD → Certified Demolition, etc.)

## Tech Stack (Already Decided)

```
Framework: Next.js 16 (App Router)
Styling: Tailwind CSS 4
UI Components: shadcn/ui + Radix UI
Charts: Recharts
Database: Supabase (PostgreSQL)
Auth: Supabase Auth
Hosting: Vercel
```

## Setup Instructions

1. Initialize Next.js in the existing folder:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

2. Install dependencies:
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install recharts lucide-react
npm install date-fns
npm install zustand (for state management)
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card table input select badge alert tabs dropdown-menu dialog sheet skeleton toast
```

3. Set up Supabase schema (create migration file):

```sql
-- Projects (cached from Google Drive)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  client_code TEXT NOT NULL,
  client_name TEXT,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  estimate_amount DECIMAL(12,2),
  estimate_drive_id TEXT,
  has_pbs BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices (cached from QuickBooks)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qb_id TEXT UNIQUE NOT NULL,
  invoice_number TEXT,
  client_name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance DECIMAL(12,2) NOT NULL,
  issue_date DATE,
  due_date DATE,
  status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  project_id UUID REFERENCES projects(id),
  memo TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bills (cached from QuickBooks)
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qb_id TEXT UNIQUE NOT NULL,
  vendor_name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance DECIMAL(12,2) NOT NULL,
  bill_date DATE,
  due_date DATE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'paid', 'overdue')),
  project_id UUID REFERENCES projects(id),
  memo TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client mappings (for matching invoices to projects)
CREATE TABLE client_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  qb_customer_name TEXT,
  display_name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}'
);

-- OAuth tokens (encrypted)
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('quickbooks', 'google')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider)
);

-- Sync log
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Insert default client mappings
INSERT INTO client_mappings (code, qb_customer_name, display_name, aliases) VALUES
('CD', 'Certified Demolition Inc.', 'Certified Demolition', ARRAY['CertDemo', 'Cert Demolition']),
('ADR', 'ADR Construction', 'ADR Construction', ARRAY['ADR']),
('R&S', 'Russell & Sons Enterprises Inc.', 'Russell & Sons', ARRAY['Russell', 'R&S Enterprises']);

-- Create indexes
CREATE INDEX idx_invoices_project ON invoices(project_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_bills_project ON bills(project_id);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_code ON projects(code);
```

## API Routes to Create

```
GET  /api/dashboard         → Dashboard KPIs and alerts
GET  /api/projects          → List all projects with financial totals
GET  /api/projects/[id]     → Single project with invoices and bills
GET  /api/receivables       → Open invoices from QB
GET  /api/payables          → Open bills from QB
POST /api/invoices/[id]/assign   → Assign invoice to project
POST /api/bills/[id]/assign      → Assign bill to project
POST /api/sync/projects     → Sync projects from Google Drive
POST /api/sync/quickbooks   → Sync invoices/bills from QB
GET  /api/auth/quickbooks   → Start QB OAuth
GET  /api/auth/quickbooks/callback → QB OAuth callback
GET  /api/auth/google       → Start Google OAuth
GET  /api/auth/google/callback   → Google OAuth callback
GET  /api/connections       → Get connection status
```

## Key Implementation Details

### Project Code Parsing
```typescript
// Parse folder name: "2601007 - CD - PetroCan Kamloops"
const FOLDER_PATTERN = /^(\d{7})\s*-\s*(\w+)\s*-\s*(.+)$/;

function parseProjectFolder(folderName: string) {
  const match = folderName.match(FOLDER_PATTERN);
  if (!match) return null;
  return {
    code: match[1],      // "2601007"
    clientCode: match[2], // "CD"
    description: match[3].trim() // "PetroCan Kamloops"
  };
}
```

### Invoice Status Logic
```typescript
function getInvoiceStatus(invoice: { balance: number; dueDate: Date }): string {
  if (invoice.balance === 0) return 'paid';
  if (new Date(invoice.dueDate) < new Date()) return 'overdue';
  return 'sent';
}
```

### QuickBooks API Queries
```typescript
// Open invoices
const invoiceQuery = "SELECT * FROM Invoice WHERE Balance > '0'";

// Open bills
const billQuery = "SELECT * FROM Bill WHERE Balance > '0'";
```

### Google Drive Projects Folder
```typescript
const PROJECTS_FOLDER_ID = '1qRGYL7NylTEkjjvoZStyjPWJyWR9fI6n';
```

## UI/UX Requirements

- **Mobile-first**: Must work well on iPhone (owner uses on job sites)
- **Dark/Light mode**: Toggle in header, persist preference
- **Loading states**: Use skeleton loaders, never blank screens
- **Error handling**: Toast notifications for errors, graceful fallbacks
- **Color coding**:
  - Green (#10b981): Profit, paid, success
  - Red (#ef4444): Overdue, loss, danger
  - Amber (#f59e0b): Due soon, warning
  - Blue (#3b82f6): Primary actions, neutral info

## Component Structure

```
src/components/
├── ui/                    # shadcn components
├── layout/
│   ├── sidebar.tsx        # Collapsible sidebar nav
│   ├── header.tsx         # Top bar with search, dark mode, sync
│   └── mobile-nav.tsx     # Bottom nav for mobile
├── dashboard/
│   ├── kpi-card.tsx       # Single KPI metric card
│   ├── kpi-grid.tsx       # Grid of 4-6 KPI cards
│   ├── alerts-panel.tsx   # Warnings and action items
│   └── activity-feed.tsx  # Recent transactions
├── projects/
│   ├── projects-table.tsx # Sortable, filterable table
│   ├── project-card.tsx   # Card view alternative
│   └── project-filters.tsx # Filter controls
├── invoices/
│   ├── invoices-table.tsx
│   ├── invoice-row.tsx
│   └── assign-dialog.tsx  # Modal to assign to project
└── bills/
    ├── bills-table.tsx
    ├── bill-row.tsx
    └── assign-dialog.tsx
```

## State Management

Use Zustand for global state:
```typescript
// src/lib/store.ts
interface AppState {
  // Connection status
  connections: ConnectionStatus;
  setConnections: (c: ConnectionStatus) => void;
  
  // Sync status
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  triggerSync: () => Promise<void>;
  
  // Projects cache
  projects: Project[];
  setProjects: (p: Project[]) => void;
}
```

## Environment Variables Needed

Copy `.env.example` to `.env.local` and fill in:
- Supabase URL and keys
- QuickBooks OAuth credentials (from developer.intuit.com)
- Google OAuth credentials (from console.cloud.google.com)

## Build Order

1. **Setup**: Initialize Next.js, install deps, configure Tailwind, init shadcn
2. **Database**: Create Supabase project, run migrations, test connection
3. **Layout**: Build sidebar, header, mobile nav, dark mode toggle
4. **Dashboard**: KPI cards with mock data, then wire to API
5. **Projects**: Table with mock data, then wire to Google Drive sync
6. **Receivables**: Table with mock data, then wire to QuickBooks sync
7. **Payables**: Same pattern as receivables
8. **OAuth flows**: QuickBooks connection, Google connection
9. **Settings page**: Connection status, sync controls
10. **Polish**: Loading states, error handling, mobile testing

## Mock Data for Development

Until OAuth is connected, use this mock data:

```typescript
export const mockProjects: Project[] = [
  {
    id: '1',
    driveId: 'abc123',
    code: '2601007',
    clientCode: 'CD',
    clientName: 'Certified Demolition',
    description: 'PetroCan Kamloops',
    status: 'active',
    estimateAmount: 45000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    driveId: 'def456',
    code: '2601006',
    clientCode: 'ADR',
    clientName: 'ADR Construction',
    description: 'Unit 43 Purcell',
    status: 'active',
    estimateAmount: 28000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: '1',
    qbId: 'qb-inv-1',
    invoiceNumber: 'DC0359',
    clientName: 'Russell & Sons Enterprises Inc.',
    amount: 383.25,
    balance: 383.25,
    issueDate: new Date('2025-12-22'),
    dueDate: new Date('2026-01-06'),
    status: 'overdue',
    projectId: null,
    memo: 'Wesley Place: 20,21 dec, 2025',
    syncedAt: new Date(),
  },
];
```

## Success Criteria

The MVP is complete when JP can:
1. ✅ Open the dashboard and see total receivables, payables, and net position
2. ✅ See a list of all active projects from his Google Drive
3. ✅ See all unpaid invoices from QuickBooks, with overdue ones highlighted
4. ✅ See all unpaid bills from QuickBooks, with due-soon ones highlighted
5. ✅ Manually assign an invoice or bill to a project
6. ✅ View a single project and see all its linked invoices and costs
7. ✅ Access the app from his iPhone and have it work well
8. ✅ Toggle dark/light mode

## Go Build It!

Start with the layout and work your way through each page. Use mock data first, then wire up the real integrations. Ask me if you need clarification on any business logic or data structures.

Remember: The PRD has detailed acceptance criteria for each feature. Reference `docs/PRD.md` for edge cases and error handling requirements.
