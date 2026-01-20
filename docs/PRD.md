# DeHyl Project Financial System - Product Requirements Document

**Version:** 1.0  
**Date:** January 19, 2026  
**Author:** Claude (AI) + JP Domínguez  
**Status:** Draft - Awaiting Approval

---

## 1. Executive Summary

### Problem Statement
DeHyl Constructors Corp (~$500K/year demolition & restoration company) tracks projects across scattered Google Drive folders and Google Sheets. There is no single view to answer: "Which invoices haven't been paid?", "What bills do I owe?", and "Is this project profitable?" This leads to forgotten follow-ups, cash flow surprises, and inability to evaluate project performance.

### Proposed Solution
A web-based financial dashboard that:
1. Automatically pulls project data from Google Drive folder structure
2. Syncs with QuickBooks Online to show invoices (receivables) and bills (payables)
3. Provides a unified view of all active projects with their financial status
4. Alerts on overdue invoices and upcoming bills

### Value Proposition
**For JP (owner):** "Never miss a payment owed to you, never be surprised by a bill, and know at a glance which projects are making money."

**Quantified benefit:** If this system prevents even one forgotten $5,000 invoice per year, it pays for itself immediately.

---

## 2. User Personas

### Persona 1: JP (Owner/Operator)
- **Background:** Runs DeHyl Constructors, a demolition/restoration company in BC, Canada. Manages 10-20 active projects at any time. Handles sales, operations, and finances personally.
- **Goals:** 
  - Know instantly: "Who owes me money?" and "What do I owe?"
  - Understand project profitability without manual spreadsheet work
  - Stop things from falling through the cracks
- **Pain Points:** 
  - Information scattered across Drive folders, QB, and email
  - No time to manually compile financial reports
  - Has forgotten to follow up on invoices in the past
- **Technical Level:** Intermediate (comfortable with spreadsheets, not a developer)
- **Devices:** MacBook (primary), iPhone (on job sites)

### Persona 2: Client (Future - Phase 3+)
- **Background:** Project managers at client companies (Certified Demolition, ADR, Russell & Sons)
- **Goals:** View status of their projects, see invoices issued to them
- **Technical Level:** Basic
- **Note:** Out of scope for MVP

---

## 3. User Stories

### Phase 1: Core MVP (Read-Only Dashboard)

#### US-001: View All Active Projects
**As** JP  
**I want to** see a list of all active projects from my Google Drive  
**So that** I have one place to see everything I'm working on

**Acceptance Criteria:**
- [ ] Given the dashboard loads, when I view the Projects section, then I see all folders from the Projects Google Drive folder
- [ ] Given a project exists, when displayed, then I see: Project ID, Client, Description, Status (parsed from folder name)
- [ ] Given projects are listed, when I look at them, then they are sorted by most recently modified first
- [ ] Edge case: Folder name doesn't match pattern → Display with "Unknown" client, flag for review
- [ ] Edge case: Projects folder has subfolders (Closed, Cleaners) → Treat "Closed" contents as inactive projects
- [ ] Error: Google Drive API unavailable → Show cached data with "Last updated X hours ago" warning

**Technical Notes:**
- Dependencies: Google Drive API
- Data: Parse folder names using regex: `(\d{7})\s*-\s*(\w+)\s*-\s*(.+)`
- Complexity: M

---

#### US-002: View Receivables (Invoices Owed to DeHyl)
**As** JP  
**I want to** see all unpaid invoices from QuickBooks  
**So that** I know who owes me money and can follow up

**Acceptance Criteria:**
- [ ] Given QB is connected, when I view Receivables, then I see all invoices with status "Open" or "Overdue"
- [ ] Given an invoice exists, when displayed, then I see: Invoice #, Client, Amount, Date Issued, Due Date, Days Outstanding
- [ ] Given an invoice is past due date, when displayed, then it is highlighted in red/warning color
- [ ] Given invoices are listed, when I view total, then I see sum of all outstanding receivables
- [ ] Edge case: Invoice partially paid → Show remaining balance, not original amount
- [ ] Edge case: Invoice has no due date → Default to Net 30 from issue date
- [ ] Error: QB API unavailable → Show cached data with timestamp warning

**Technical Notes:**
- Dependencies: QuickBooks Online API (read invoices)
- Data: Filter where `Balance > 0`
- Complexity: M

---

#### US-003: View Payables (Bills DeHyl Owes)
**As** JP  
**I want to** see all unpaid bills from QuickBooks  
**So that** I know what I need to pay and when

**Acceptance Criteria:**
- [ ] Given QB is connected, when I view Payables, then I see all bills with status "Open"
- [ ] Given a bill exists, when displayed, then I see: Vendor, Amount, Date Received, Due Date, Days Until Due
- [ ] Given a bill is due within 7 days, when displayed, then it is highlighted in yellow/warning
- [ ] Given a bill is past due, when displayed, then it is highlighted in red
- [ ] Given bills are listed, when I view total, then I see sum of all outstanding payables
- [ ] Edge case: Bill partially paid → Show remaining balance
- [ ] Error: QB API unavailable → Show cached data with timestamp warning

**Technical Notes:**
- Dependencies: QuickBooks Online API (read bills)
- Data: Filter where `Balance > 0`
- Complexity: M

---

#### US-004: Dashboard Overview with KPIs
**As** JP  
**I want to** see key financial metrics at a glance  
**So that** I understand company health without digging through details

**Acceptance Criteria:**
- [ ] Given dashboard loads, when I view KPIs, then I see: Total Receivables, Total Payables, Net Position (Receivables - Payables), Active Project Count
- [ ] Given KPIs load, when I look at trends, then I see comparison to last month (if data available)
- [ ] Given data is loading, when I wait, then I see skeleton/loading states (not blank)
- [ ] Edge case: No open invoices/bills → Show $0 with "All caught up!" message
- [ ] Error: Partial data load failure → Show available KPIs, indicate which failed

**Technical Notes:**
- Dependencies: US-002, US-003 data
- Complexity: S

---

#### US-005: QuickBooks OAuth Connection
**As** JP  
**I want to** connect my QuickBooks Online account  
**So that** the system can read my financial data

**Acceptance Criteria:**
- [ ] Given I am on settings, when I click "Connect QuickBooks", then OAuth flow initiates
- [ ] Given OAuth completes, when I return, then I see "Connected to [Company Name]" status
- [ ] Given QB is connected, when tokens expire, then system automatically refreshes (no user action needed)
- [ ] Given I want to disconnect, when I click "Disconnect", then OAuth tokens are revoked
- [ ] Edge case: User cancels OAuth mid-flow → Return to settings with "Connection cancelled" message
- [ ] Error: OAuth fails → Show specific error with retry option

**Technical Notes:**
- Dependencies: QuickBooks OAuth 2.0
- Data: Store encrypted access/refresh tokens
- Complexity: L

---

#### US-006: Google Drive Connection
**As** JP  
**I want to** connect my Google Drive  
**So that** the system can read my project folder structure

**Acceptance Criteria:**
- [ ] Given I am on settings, when I click "Connect Google Drive", then OAuth flow initiates
- [ ] Given OAuth completes, when I return, then I see "Connected" status
- [ ] Given connected, when I specify Projects folder ID, then system scans that folder for projects
- [ ] Edge case: Wrong folder selected → Allow re-selection without full re-auth
- [ ] Error: Insufficient permissions → Explain what permissions are needed and why

**Technical Notes:**
- Dependencies: Google Drive API OAuth 2.0
- Data: Store folder ID `1qRGYL7NylTEkjjvoZStyjPWJyWR9fI6n`
- Complexity: M

---

### Phase 2: Project-Level Detail & Matching

#### US-007: Project Financial Detail View
**As** JP  
**I want to** click on a project and see its complete financial picture  
**So that** I can evaluate if a specific project is profitable

**Acceptance Criteria:**
- [ ] Given I click a project, when detail view opens, then I see: Estimate amount, Total invoiced, Total paid, Outstanding balance, Related bills/costs
- [ ] Given project has linked estimate, when displayed, then I see estimate breakdown (Lump Sum or T&M)
- [ ] Given project has multiple invoices, when displayed, then I see invoice history with statuses
- [ ] Given project has costs (bills), when displayed, then I see cost breakdown
- [ ] Given all data loads, when I view profit, then I see: Revenue (paid invoices) - Costs = Profit
- [ ] Edge case: Project has no invoices yet → Show "No invoices" with link to QB to create one
- [ ] Edge case: Project has no matched costs → Show $0 costs with note

**Technical Notes:**
- Dependencies: US-001, US-002, US-003, matching algorithm
- Complexity: L

---

#### US-008: Manual Invoice-to-Project Matching
**As** JP  
**I want to** manually link an invoice to a project  
**So that** the system correctly tracks revenue per project

**Acceptance Criteria:**
- [ ] Given an unmatched invoice exists, when I view it, then I see "Assign to Project" option
- [ ] Given I click assign, when project picker opens, then I see searchable list of active projects
- [ ] Given I select a project, when I confirm, then invoice is linked and project financials update
- [ ] Given invoice is linked, when I view it later, then I see which project it's assigned to
- [ ] Edge case: Invoice could match multiple projects → Show suggestions, let user pick
- [ ] Edge case: User assigns incorrectly → Allow reassignment anytime

**Technical Notes:**
- Dependencies: Local database to store mappings
- Complexity: M

---

#### US-009: Smart Invoice-to-Project Suggestions
**As** JP  
**I want to** the system to suggest which project an invoice belongs to  
**So that** I don't have to manually match every invoice

**Acceptance Criteria:**
- [ ] Given an unmatched invoice, when system analyzes it, then it suggests projects based on: Client name match, Description/memo keywords, Date proximity to project
- [ ] Given suggestions exist, when displayed, then I see confidence level (High/Medium/Low)
- [ ] Given a high-confidence match, when displayed, then it is pre-selected (but not auto-assigned)
- [ ] Given I confirm suggestion, when saved, then system learns from this match (improves future suggestions)
- [ ] Edge case: No good matches → Show "No suggestions" and manual picker
- [ ] Edge case: Invoice memo contains project ID (e.g., "2601007") → Auto-suggest that project with high confidence

**Technical Notes:**
- Dependencies: Client name mapping (R&S = Russell & Sons, CD = Certified Demolition)
- Complexity: L

---

### Phase 3: Alerts & Automation

#### US-010: Overdue Invoice Alerts
**As** JP  
**I want to** be notified when invoices become overdue  
**So that** I can follow up promptly and not forget

**Acceptance Criteria:**
- [ ] Given an invoice passes its due date, when I load dashboard, then I see prominent alert
- [ ] Given multiple overdue invoices, when displayed, then I see total amount and count
- [ ] Given alert shown, when I click it, then I navigate to filtered Receivables view
- [ ] Edge case: Invoice was just paid → Remove from alert immediately on next sync
- [ ] Error: Can't determine overdue status → Don't alert, log for investigation

**Technical Notes:**
- Dependencies: US-002
- Complexity: S

---

#### US-011: Upcoming Bills Alert
**As** JP  
**I want to** be warned about bills due soon  
**So that** I can ensure I have funds and pay on time

**Acceptance Criteria:**
- [ ] Given bills are due within 7 days, when I load dashboard, then I see upcoming bills alert
- [ ] Given bills are shown, when displayed, then I see total amount due this week
- [ ] Given alert shown, when I click it, then I navigate to filtered Payables view
- [ ] Edge case: No bills due soon → Show "No bills due this week" (positive reinforcement)

**Technical Notes:**
- Dependencies: US-003
- Complexity: S

---

#### US-012: Missing Estimate Warning
**As** JP  
**I want to** be warned when a project folder has no estimate  
**So that** I ensure every project is properly quoted before work starts

**Acceptance Criteria:**
- [ ] Given a project folder exists, when system scans, then it checks for Estimate subfolder contents
- [ ] Given Estimate folder is empty/missing, when project displayed, then show warning icon
- [ ] Given warnings exist, when I view alerts panel, then I see "X projects missing estimates"
- [ ] Edge case: Estimate exists but is empty sheet → Flag as "Estimate incomplete"

**Technical Notes:**
- Dependencies: US-001, Google Drive scan
- Complexity: M

---

### Phase 4: Future Enhancements (Post-MVP)

#### US-013: Email Scanning for Vendor Bills
**As** JP  
**I want to** have vendor bills from email flagged for review  
**So that** I don't miss bills hiding in my inbox

**Status:** Out of scope for MVP. Will require Gmail API integration and PDF parsing.

---

#### US-014: Client Portal
**As** a client  
**I want to** see the status of my projects with DeHyl  
**So that** I know what's been invoiced and project progress

**Status:** Out of scope for MVP. Requires authentication, access control, filtered views.

---

## 4. Technical Architecture

### System Overview
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Google Drive  │     │    DeHyl App     │     │  QuickBooks     │
│   (Projects)    │────▶│                  │◀────│  Online         │
└─────────────────┘     │  ┌────────────┐  │     └─────────────────┘
                        │  │  Next.js   │  │
┌─────────────────┐     │  │  Frontend  │  │     ┌─────────────────┐
│   User Browser  │◀────│  └────────────┘  │     │   PostgreSQL    │
│   (JP's Mac/    │     │  ┌────────────┐  │────▶│   Database      │
│    iPhone)      │     │  │  API       │  │     │   (Supabase)    │
└─────────────────┘     │  │  Routes    │  │     └─────────────────┘
                        │  └────────────┘  │
                        └──────────────────┘
```

### Tech Stack
| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 16 + React 19 | Modern, fast, good mobile support |
| Styling | Tailwind CSS 4 | Rapid development, consistent design |
| UI Components | Radix UI + shadcn/ui | Accessible, customizable |
| Charts | Recharts | Easy integration with React |
| Backend | Next.js API Routes | Serverless, simple deployment |
| Database | Supabase (PostgreSQL) | Free tier sufficient, easy auth |
| Auth | Supabase Auth + OAuth | Handles QB and Google OAuth |
| Hosting | Vercel | Easy Next.js deployment, good free tier |

### Key Integrations

#### QuickBooks Online API
- **Purpose:** Read invoices, bills, customers, vendors
- **Endpoints Used:**
  - `GET /v3/company/{realmId}/query` - Query invoices and bills
  - `GET /v3/company/{realmId}/invoice/{id}` - Invoice detail
  - `GET /v3/company/{realmId}/bill/{id}` - Bill detail
- **Auth:** OAuth 2.0 with refresh tokens
- **Rate Limits:** 500 requests/minute (more than sufficient)

#### Google Drive API
- **Purpose:** Read folder structure, detect project folders
- **Endpoints Used:**
  - `GET /drive/v3/files` - List files/folders
  - `GET /drive/v3/files/{fileId}` - Get folder metadata
- **Auth:** OAuth 2.0
- **Scope:** `drive.readonly` (read-only access)

---

## 5. Data Models

### Project
```typescript
interface Project {
  id: string;                    // UUID
  driveId: string;               // Google Drive folder ID
  code: string;                  // "2601007"
  clientCode: string;            // "CD", "ADR", "R&S"
  clientName: string;            // "Certified Demolition" (resolved)
  description: string;           // "PetroCan Kamloops"
  status: 'active' | 'closed';
  estimateAmount: number | null; // From linked estimate sheet
  estimateDriveId: string | null;
  hasPBS: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Invoice (from QB, cached locally)
```typescript
interface Invoice {
  id: string;                    // UUID
  qbId: string;                  // QuickBooks Invoice ID
  invoiceNumber: string;         // "DC0359"
  clientName: string;            // "Russell & Sons Enterprises Inc."
  amount: number;                // Total amount
  balance: number;               // Outstanding balance
  issueDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  projectId: string | null;      // Linked project (nullable)
  matchConfidence: 'high' | 'medium' | 'low' | null;
  memo: string | null;           // For matching hints
  syncedAt: Date;
}
```

### Bill (from QB, cached locally)
```typescript
interface Bill {
  id: string;                    // UUID
  qbId: string;                  // QuickBooks Bill ID
  vendorName: string;            // "Home Depot"
  amount: number;
  balance: number;               // Outstanding balance
  billDate: Date;
  dueDate: Date;
  status: 'open' | 'paid' | 'overdue';
  projectId: string | null;      // Linked project
  memo: string | null;
  syncedAt: Date;
}
```

### ClientMapping
```typescript
interface ClientMapping {
  id: string;
  code: string;                  // "CD"
  qbCustomerName: string;        // "Certified Demolition Inc."
  displayName: string;           // "Certified Demolition"
  aliases: string[];             // ["CertDemo", "Cert Demolition"]
}
```

### Relationships
- Project → Invoice: One-to-Many (a project can have multiple invoices)
- Project → Bill: One-to-Many (a project can have multiple costs)
- ClientMapping → Project: One-to-Many (a client can have many projects)

---

## 6. API Contracts

### GET /api/projects
Fetch all projects from Google Drive

**Response (200):**
```json
{
  "projects": [
    {
      "id": "uuid",
      "code": "2601007",
      "clientCode": "CD",
      "clientName": "Certified Demolition",
      "description": "PetroCan Kamloops",
      "status": "active",
      "estimateAmount": 45000,
      "hasPBS": true,
      "totals": {
        "invoiced": 25000,
        "paid": 15000,
        "outstanding": 10000,
        "costs": 8500,
        "profit": 6500
      }
    }
  ],
  "lastSyncedAt": "2026-01-19T12:00:00Z"
}
```

---

### GET /api/receivables
Fetch open invoices from QuickBooks

**Response (200):**
```json
{
  "invoices": [
    {
      "id": "uuid",
      "invoiceNumber": "DC0359",
      "clientName": "Russell & Sons",
      "amount": 383.25,
      "balance": 383.25,
      "dueDate": "2026-01-06",
      "daysOverdue": 13,
      "projectId": "uuid-or-null",
      "projectCode": "2501003",
      "matchSuggestions": [
        { "projectId": "uuid", "confidence": "high", "reason": "Client name match" }
      ]
    }
  ],
  "totals": {
    "outstanding": 15250.00,
    "overdue": 5383.25,
    "dueThisWeek": 9866.75
  },
  "lastSyncedAt": "2026-01-19T12:00:00Z"
}
```

---

### GET /api/payables
Fetch open bills from QuickBooks

**Response (200):**
```json
{
  "bills": [
    {
      "id": "uuid",
      "vendorName": "Waste Management",
      "amount": 1500.00,
      "balance": 1500.00,
      "dueDate": "2026-01-25",
      "daysUntilDue": 6,
      "projectId": "uuid-or-null"
    }
  ],
  "totals": {
    "outstanding": 8500.00,
    "dueThisWeek": 2500.00,
    "overdue": 0
  },
  "lastSyncedAt": "2026-01-19T12:00:00Z"
}
```

---

### POST /api/invoices/{id}/assign
Manually assign invoice to project

**Request:**
```json
{
  "projectId": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "invoice": { /* updated invoice */ }
}
```

---

### GET /api/dashboard
Get aggregated dashboard data

**Response (200):**
```json
{
  "kpis": {
    "totalReceivables": 15250.00,
    "totalPayables": 8500.00,
    "netPosition": 6750.00,
    "activeProjects": 7,
    "overdueInvoices": 2,
    "billsDueThisWeek": 3
  },
  "alerts": [
    { "type": "overdue_invoice", "count": 2, "total": 5383.25 },
    { "type": "bills_due_soon", "count": 3, "total": 2500.00 },
    { "type": "missing_estimate", "count": 1, "projects": ["2601007"] }
  ],
  "recentActivity": [
    { "type": "payment_received", "amount": 2500, "client": "CD", "date": "2026-01-18" }
  ]
}
```

---

## 7. UI/UX Requirements

### Key Screens

1. **Dashboard (Home)**
   - KPI cards at top (Receivables, Payables, Net, Projects)
   - Alerts panel (overdue items, upcoming bills, missing docs)
   - Quick action buttons (View Invoices, View Bills)
   - Recent activity feed

2. **Projects List**
   - Filterable table (Client, Status, Date range)
   - Columns: Code, Client, Description, Estimate, Invoiced, Costs, Profit, Status
   - Click row → Project detail

3. **Project Detail**
   - Header with project info
   - Financial summary (Estimate vs Invoiced vs Paid)
   - Invoice list for this project
   - Bills/Costs list for this project
   - Link to Google Drive folder

4. **Receivables**
   - All open invoices
   - Filter: All / Overdue / Due This Week
   - Assign to project action
   - Link to QB invoice

5. **Payables**
   - All open bills
   - Filter: All / Overdue / Due This Week
   - Assign to project action
   - Link to QB bill

6. **Settings**
   - QuickBooks connection status
   - Google Drive connection status
   - Client code mappings
   - Sync controls (manual refresh)

### Design Principles
- **Mobile-First:** Must work well on iPhone (JP uses on job sites)
- **Dark/Light Mode:** User preference toggle
- **Scannable:** Key numbers visible without scrolling
- **Actionable:** Every alert leads to an action
- **Forgiving:** Easy to fix mistakes (reassign, undo)

### Design Reference
- Style inspired by: [Aniq-UI Dashboard Template](https://dashboard-2.aniq-ui.com)
- Modern, clean financial dashboard aesthetic
- Sidebar navigation (collapsible on mobile)
- Card-based KPI display
- Data tables with sorting/filtering

---

## 8. Non-Functional Requirements

### Performance
- Dashboard load: < 2 seconds (cached data)
- Full sync (QB + Drive): < 30 seconds
- API response: < 500ms (local cache hits)

### Security
- Authentication: Supabase Auth (email/password for JP)
- OAuth tokens: Encrypted at rest
- HTTPS everywhere
- No sensitive data in URL parameters

### Reliability
- Graceful degradation if QB/Drive unavailable
- Local cache for offline dashboard viewing
- Automatic retry for failed syncs

### Scalability
- Current: 1 user, ~50 projects, ~500 invoices/year
- Design for: 5 users, 500 projects, 5000 invoices/year
- No premature optimization needed

---

## 9. Development Phases

| Phase | Scope | Duration | Deliverable |
|-------|-------|----------|-------------|
| **1** | Core Dashboard | 1-2 weeks | Dashboard with KPIs, Projects list from Drive, QB receivables/payables (read-only) |
| **2** | Project Detail | 1 week | Project detail view, manual invoice-project linking, basic alerts |
| **3** | Smart Features | 1 week | Auto-suggest matching, improved alerts, client code mapping UI |
| **4** | Polish | Ongoing | Mobile optimization, dark mode, export features |

### Phase 1 Deliverables (MVP) ✅ COMPLETE
- [x] Dashboard page with KPI cards (connected to Supabase)
- [x] Projects list pulled from Google Drive (connected to Supabase)
- [x] Receivables page (open QB invoices) (connected to Supabase)
- [x] Payables page (open QB bills) (connected to Supabase)
- [x] QuickBooks OAuth connection (complete with callbacks)
- [x] Google Drive OAuth connection (complete with callbacks)
- [x] Settings page (complete)
- [x] Connect UI to real API data (API routes fetch from Supabase)
- [x] Sync endpoints implemented (`/api/sync/quickbooks`, `/api/sync/projects`)
- [x] Loading/error states for all pages
- [ ] Deployed to Vercel

### Additional Features Built (Beyond Original Scope)
- [x] Bids tracking page (`/bids`) with status management
- [x] Estimates page with line item editor
- [x] Dark/light theme toggle
- [x] Collapsible sidebar navigation
- [x] Mobile-responsive drawer navigation
- [x] Invoice-to-project matching engine
- [x] Charts: Revenue trend, Estimate vs Actual, Bid conversion

---

## 10. Out of Scope

Explicitly NOT included in this version:
- **Creating invoices in QuickBooks** (read-only)
- **Creating bills in QuickBooks** (read-only)
- **Payroll tracking**
- **Inventory management**
- **Time tracking / timesheets**
- **Native mobile app** (web responsive is sufficient)
- **Email scanning for bills** (Phase 4+ consideration)
- **Client portal** (future feature)
- **Multi-currency** (CAD only)
- **Multi-company** (single QB company)

---

## 11. Open Questions

All critical questions have been answered. Remaining minor items:

- [ ] Confirm Supabase free tier is acceptable for database/auth
- [ ] Confirm Vercel free tier is acceptable for hosting
- [ ] Get QuickBooks API credentials (requires Intuit Developer account)
- [ ] Determine if any existing client mappings exist (CD, ADR, R&S → full names)

---

## Appendix

### Glossary
- **Receivables:** Money owed TO DeHyl (unpaid invoices to clients)
- **Payables:** Money DeHyl OWES (unpaid bills from vendors)
- **PBS:** Pre-Build Sheet - planning document before starting work
- **T&M:** Time & Materials - billing method based on hours + materials used
- **Lump Sum:** Fixed price billing regardless of actual time/materials
- **GST:** Canadian Goods and Services Tax (5%)

### Client Code Reference
| Code | Full Name | Notes |
|------|-----------|-------|
| CD | Certified Demolition | Requires PO numbers |
| ADR | ADR Construction | |
| R&S | Russell & Sons Enterprises Inc. | |

### Key Google Drive Locations
- Projects Folder: `1qRGYL7NylTEkjjvoZStyjPWJyWR9fI6n`
- Closed Projects: Subfolder within Projects
- Cleaners: Subfolder (subcontractors?)

### Invoice Format Reference
- Invoice # pattern: `DC####` (e.g., DC0359)
- Standard terms: Net 15 or Net 30
- Tax: GST @ 5%
- Late fee: 3% monthly interest

---

## Approval

- [ ] **JP (Product Owner):** Approved / Changes Requested
- [ ] **Technical Review:** Approved / Changes Requested

**Next Step:** Upon approval, proceed to Phase 1 development.
