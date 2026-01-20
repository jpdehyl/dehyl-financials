# DeHyl Financials - RALPH PRD

**Phased User Stories for Autonomous Development**

This document contains bite-sized user stories that Ralph can work through autonomously. Each story is small enough to complete in one iteration with clear, verifiable acceptance criteria.

---

## Phase 1: Core Data Models + Auth (Foundation)

### US-001: Supabase Client Setup
**As a** developer  
**I want to** have a properly configured Supabase client  
**So that** all database operations use a consistent connection

**Acceptance Criteria:**
- [ ] Given src/lib/supabase/client.ts exists, when imported, then it exports `supabase` client for client components
- [ ] Given src/lib/supabase/server.ts exists, when imported, then it exports `createClient()` for server components
- [ ] Given env vars NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set, when client initializes, then connection succeeds
- [ ] Edge case: Missing env vars → TypeScript error at build time
- [ ] Error: Invalid URL → Log error and throw with helpful message

**Technical Notes:**
- Dependencies: @supabase/supabase-js, @supabase/ssr
- Complexity: S

---

### US-002: Database Schema - Projects Table
**As a** developer  
**I want to** have a projects table in Supabase  
**So that** I can store construction project data

**Acceptance Criteria:**
- [ ] Given migration runs, when checking database, then `projects` table exists with columns: id (uuid), name, client_name, address, job_number, status, contract_value, start_date, end_date, created_at, updated_at
- [ ] Given a project is inserted, when querying, then all fields return correctly typed values
- [ ] Given RLS is enabled, when unauthenticated user queries, then they receive empty results
- [ ] Edge case: Duplicate job_number → Unique constraint violation returns clear error

**Technical Notes:**
- File: supabase/migrations/002_projects.sql
- Complexity: S

---

### US-003: Database Schema - Invoices Table
**As a** developer  
**I want to** have an invoices table linked to projects  
**So that** I can track receivables per project

**Acceptance Criteria:**
- [ ] Given migration runs, when checking database, then `invoices` table exists with: id, project_id (FK), invoice_number, customer_name, amount, due_date, status, quickbooks_id, created_at
- [ ] Given invoice with project_id, when project is deleted, then invoice deletion is blocked (RESTRICT)
- [ ] Given quickbooks_id is set, when querying, then we can find synced invoices
- [ ] Edge case: Null project_id → Allowed (standalone invoices)

**Technical Notes:**
- File: supabase/migrations/003_invoices.sql
- Dependencies: US-002 (projects table)
- Complexity: S

---

### US-004: Database Schema - Bills Table
**As a** developer  
**I want to** have a bills table linked to projects  
**So that** I can track payables per project

**Acceptance Criteria:**
- [ ] Given migration runs, when checking database, then `bills` table exists with: id, project_id (FK), bill_number, vendor_name, amount, due_date, status, quickbooks_id, created_at
- [ ] Given bill with project_id, when project is deleted, then bill deletion is blocked (RESTRICT)
- [ ] Edge case: Null project_id → Allowed (overhead expenses)

**Technical Notes:**
- File: supabase/migrations/004_bills.sql
- Dependencies: US-002 (projects table)
- Complexity: S

---

### US-005: TypeScript Types for Database
**As a** developer  
**I want to** have TypeScript interfaces matching my database schema  
**So that** I get type safety across the app

**Acceptance Criteria:**
- [ ] Given src/types/database.ts exists, when imported, then Project, Invoice, Bill interfaces are available
- [ ] Given Supabase query returns data, when typed, then no TypeScript errors occur
- [ ] Given a field is added to migration, when types are regenerated, then interface updates

**Technical Notes:**
- Generate with: npx supabase gen types typescript --local > src/types/database.ts
- Complexity: S

---

### US-006: Supabase Auth with Google OAuth
**As a** user  
**I want to** sign in with my Google account  
**So that** I can access the dashboard securely

**Acceptance Criteria:**
- [ ] Given user clicks "Sign in with Google", when OAuth completes, then user is redirected to /dashboard
- [ ] Given user is not authenticated, when accessing /dashboard, then redirect to /login
- [ ] Given user is authenticated, when checking session, then user object has email and id
- [ ] Edge case: User cancels OAuth → Return to login with no error
- [ ] Error: OAuth provider error → Display "Authentication failed, try again"

**Technical Notes:**
- Enable Google provider in Supabase Dashboard > Auth > Providers
- Middleware: src/middleware.ts for route protection
- Complexity: M

---

## Phase 2: Dashboard + Projects Module

### US-007: Dashboard Layout with Sidebar
**As a** user  
**I want to** see a consistent layout with navigation  
**So that** I can move between sections easily

**Acceptance Criteria:**
- [ ] Given user is on any page, when viewing, then sidebar shows: Dashboard, Projects, Bids, Receivables, Payables, Settings
- [ ] Given user clicks nav item, when navigating, then correct page loads without full refresh
- [ ] Given current page matches nav item, when viewing, then nav item is visually highlighted
- [ ] Edge case: Mobile viewport → Sidebar collapses to hamburger menu

**Technical Notes:**
- Use shadcn/ui Sidebar component
- File: src/components/layout/sidebar.tsx
- Complexity: M

---

### US-008: Dashboard KPI Cards
**As a** business owner  
**I want to** see key financial metrics at a glance  
**So that** I understand my cash position quickly

**Acceptance Criteria:**
- [ ] Given dashboard loads, when viewing, then 4 KPI cards display: Total Receivables, Total Payables, Net Position, Active Projects
- [ ] Given data exists in database, when cards render, then values are calculated correctly
- [ ] Given no data exists, when cards render, then $0.00 displays (not error)
- [ ] Edge case: Large numbers → Format with commas ($1,234,567.89)

**Technical Notes:**
- Server Component for data fetching
- File: src/app/dashboard/page.tsx
- Complexity: M

---

### US-009: Projects List Page
**As a** user  
**I want to** see all my projects in a table  
**So that** I can find and manage them

**Acceptance Criteria:**
- [ ] Given user navigates to /projects, when page loads, then table shows: Job #, Name, Client, Status, Contract Value, Start Date
- [ ] Given 20+ projects exist, when viewing, then pagination controls appear
- [ ] Given user clicks column header, when clicked, then table sorts by that column
- [ ] Edge case: No projects → Show "No projects yet" with "Add Project" button

**Technical Notes:**
- Use shadcn/ui DataTable
- File: src/app/projects/page.tsx
- Complexity: M

---

### US-010: Create Project Form
**As a** user  
**I want to** add a new project  
**So that** I can track its financials

**Acceptance Criteria:**
- [ ] Given user clicks "New Project", when form opens, then fields display: Name, Client, Address, Job Number, Contract Value, Start Date, End Date
- [ ] Given valid data entered, when form submitted, then project creates and redirects to /projects
- [ ] Given invalid data, when form submitted, then validation errors show inline
- [ ] Edge case: Duplicate job number → "Job number already exists" error

**Technical Notes:**
- Use react-hook-form + zod validation
- Server Action for insert
- File: src/app/projects/new/page.tsx
- Complexity: M

---

### US-011: Project Detail Page
**As a** user  
**I want to** see all details for a single project  
**So that** I can review its financials

**Acceptance Criteria:**
- [ ] Given user clicks project row, when navigating, then /projects/[id] loads
- [ ] Given project exists, when page renders, then all project fields display
- [ ] Given project has invoices/bills, when viewing, then summary shows: Total Billed, Total Costs, Margin
- [ ] Edge case: Project not found → 404 page

**Technical Notes:**
- Dynamic route: src/app/projects/[id]/page.tsx
- Complexity: M

---

### US-012: Edit Project
**As a** user  
**I want to** update project details  
**So that** I can correct mistakes or update status

**Acceptance Criteria:**
- [ ] Given user clicks "Edit" on project detail, when form opens, then fields pre-populate with current values
- [ ] Given user changes status to "Complete", when saved, then end_date auto-fills if empty
- [ ] Given user saves changes, when redirected, then updated values display
- [ ] Error: Concurrent edit → "Project was modified, please refresh"

**Technical Notes:**
- Use optimistic locking with updated_at
- File: src/app/projects/[id]/edit/page.tsx
- Complexity: M

---

## Phase 3: Receivables + Payables Modules

### US-013: Receivables List Page
**As a** user  
**I want to** see all open invoices  
**So that** I can track money owed to me

**Acceptance Criteria:**
- [ ] Given user navigates to /receivables, when page loads, then table shows: Invoice #, Customer, Amount, Due Date, Status, Project
- [ ] Given invoice is overdue, when viewing, then row highlights red
- [ ] Given filter "Open" selected, when viewing, then only unpaid invoices show
- [ ] Edge case: No invoices → "No receivables" empty state

**Technical Notes:**
- File: src/app/receivables/page.tsx
- Complexity: M

---

### US-014: Create Invoice
**As a** user  
**I want to** manually add an invoice  
**So that** I can track receivables before QuickBooks sync

**Acceptance Criteria:**
- [ ] Given user clicks "New Invoice", when form opens, then fields show: Invoice #, Customer, Amount, Due Date, Project (dropdown)
- [ ] Given project selected, when saved, then invoice links to project
- [ ] Given valid data, when submitted, then invoice creates with status "Open"
- [ ] Edge case: No projects exist → Project dropdown shows "None" option

**Technical Notes:**
- File: src/app/receivables/new/page.tsx
- Complexity: M

---

### US-015: Payables List Page
**As a** user  
**I want to** see all open bills  
**So that** I can track money I owe

**Acceptance Criteria:**
- [ ] Given user navigates to /payables, when page loads, then table shows: Bill #, Vendor, Amount, Due Date, Status, Project
- [ ] Given bill is overdue, when viewing, then row highlights red
- [ ] Given filter "Unpaid" selected, when viewing, then only unpaid bills show
- [ ] Edge case: No bills → "No payables" empty state

**Technical Notes:**
- File: src/app/payables/page.tsx
- Complexity: M

---

### US-016: Create Bill
**As a** user  
**I want to** manually add a bill  
**So that** I can track payables before QuickBooks sync

**Acceptance Criteria:**
- [ ] Given user clicks "New Bill", when form opens, then fields show: Bill #, Vendor, Amount, Due Date, Project (dropdown)
- [ ] Given project selected, when saved, then bill links to project
- [ ] Given valid data, when submitted, then bill creates with status "Unpaid"

**Technical Notes:**
- File: src/app/payables/new/page.tsx
- Complexity: M

---

### US-017: Mark Invoice Paid
**As a** user  
**I want to** mark an invoice as paid  
**So that** it no longer shows as receivable

**Acceptance Criteria:**
- [ ] Given invoice row has "Mark Paid" action, when clicked, then confirmation dialog appears
- [ ] Given confirmed, when processing, then status updates to "Paid" with paid_date = today
- [ ] Given status is Paid, when viewing list, then it's excluded from "Open" filter

**Technical Notes:**
- Server Action: src/app/receivables/actions.ts
- Complexity: S

---

### US-018: Mark Bill Paid
**As a** user  
**I want to** mark a bill as paid  
**So that** it no longer shows as payable

**Acceptance Criteria:**
- [ ] Given bill row has "Mark Paid" action, when clicked, then confirmation dialog appears
- [ ] Given confirmed, when processing, then status updates to "Paid" with paid_date = today
- [ ] Given status is Paid, when viewing list, then it's excluded from "Unpaid" filter

**Technical Notes:**
- Server Action: src/app/payables/actions.ts
- Complexity: S

---

## Phase 4: QuickBooks Integration

### US-019: QuickBooks OAuth Setup
**As a** developer  
**I want to** configure QuickBooks OAuth credentials  
**So that** users can connect their QBO account

**Acceptance Criteria:**
- [ ] Given .env has QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET, when app starts, then no errors
- [ ] Given OAuth library is installed, when imported, then types are available
- [ ] Given docs/quickbooks-setup.md exists, when read, then setup steps are clear

**Technical Notes:**
- Use intuit-oauth package
- File: src/lib/quickbooks/client.ts
- Complexity: M

---

### US-020: QuickBooks Connect Button
**As a** user  
**I want to** connect my QuickBooks account  
**So that** data can sync automatically

**Acceptance Criteria:**
- [ ] Given user is on Settings page, when viewing, then "Connect QuickBooks" button appears
- [ ] Given user clicks connect, when OAuth initiates, then redirect to Intuit login
- [ ] Given OAuth completes, when callback returns, then tokens store in database
- [ ] Given already connected, when viewing, then show "Connected to [Company Name]" with "Disconnect" option
- [ ] Error: OAuth denied → "Connection cancelled" message

**Technical Notes:**
- Store tokens in `integrations` table with user_id
- File: src/app/settings/page.tsx, src/app/api/quickbooks/callback/route.ts
- Complexity: L

---

### US-021: Sync Invoices from QuickBooks
**As a** user  
**I want to** import invoices from QuickBooks  
**So that** my receivables are up to date

**Acceptance Criteria:**
- [ ] Given user clicks "Sync Invoices", when processing, then QBO invoices fetch via API
- [ ] Given invoice doesn't exist locally (by quickbooks_id), when syncing, then create new record
- [ ] Given invoice exists locally, when syncing, then update amount/status if changed
- [ ] Given sync completes, when viewing, then toast shows "Synced X invoices"
- [ ] Error: Token expired → Prompt re-auth, then retry

**Technical Notes:**
- API: GET /v3/company/{realmId}/query?query=SELECT * FROM Invoice
- File: src/app/api/quickbooks/sync-invoices/route.ts
- Complexity: L

---

### US-022: Sync Bills from QuickBooks
**As a** user  
**I want to** import bills from QuickBooks  
**So that** my payables are up to date

**Acceptance Criteria:**
- [ ] Given user clicks "Sync Bills", when processing, then QBO bills fetch via API
- [ ] Given bill doesn't exist locally (by quickbooks_id), when syncing, then create new record
- [ ] Given bill exists locally, when syncing, then update amount/status if changed
- [ ] Given sync completes, when viewing, then toast shows "Synced X bills"

**Technical Notes:**
- API: GET /v3/company/{realmId}/query?query=SELECT * FROM Bill
- File: src/app/api/quickbooks/sync-bills/route.ts
- Complexity: L

---

### US-023: QuickBooks Sync Status Indicator
**As a** user  
**I want to** see when data was last synced  
**So that** I know if my data is current

**Acceptance Criteria:**
- [ ] Given dashboard header, when viewing, then "Last synced: X minutes ago" displays
- [ ] Given sync is in progress, when viewing, then spinner with "Syncing..." shows
- [ ] Given sync > 24 hours ago, when viewing, then text turns orange as warning
- [ ] Edge case: Never synced → "Not synced" with "Sync now" link

**Technical Notes:**
- Store last_sync_at in integrations table
- Component: src/components/sync-status.tsx
- Complexity: S

---

### US-024: Automatic Sync on Login
**As a** user  
**I want to** have data sync automatically when I log in  
**So that** I always see fresh data

**Acceptance Criteria:**
- [ ] Given user logs in, when dashboard loads, then background sync triggers if last sync > 1 hour
- [ ] Given sync runs in background, when complete, then data refreshes without page reload
- [ ] Given sync fails, when viewing, then subtle error indicator shows (not blocking)

**Technical Notes:**
- Use React Query for background refetch
- Complexity: M

---

## Phase 5: Google Drive Sync

### US-025: Google OAuth Setup
**As a** developer  
**I want to** configure Google Drive API credentials  
**So that** users can connect their Drive

**Acceptance Criteria:**
- [ ] Given .env has GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, when app starts, then no errors
- [ ] Given Google APIs client installed, when imported, then types are available

**Technical Notes:**
- Use googleapis package
- Scopes: drive.readonly, drive.metadata.readonly
- File: src/lib/google/client.ts
- Complexity: M

---

### US-026: Google Drive Connect
**As a** user  
**I want to** connect my Google Drive  
**So that** projects can sync from folder structure

**Acceptance Criteria:**
- [ ] Given user is on Settings, when viewing, then "Connect Google Drive" button appears
- [ ] Given user clicks connect, when OAuth completes, then tokens store in database
- [ ] Given connected, when viewing, then show "Connected" with email

**Technical Notes:**
- File: src/app/api/google/callback/route.ts
- Complexity: L

---

### US-027: Select Projects Folder
**As a** user  
**I want to** select which Drive folder contains my projects  
**So that** the system knows where to look

**Acceptance Criteria:**
- [ ] Given Google connected, when on Settings, then "Select Projects Folder" picker appears
- [ ] Given user selects folder, when saved, then folder ID stores in settings
- [ ] Given folder selected, when viewing, then folder name displays

**Technical Notes:**
- Use Google Picker API or simple folder browser
- File: src/app/settings/drive-folder-picker.tsx
- Complexity: M

---

### US-028: Sync Projects from Drive Folders
**As a** user  
**I want to** create projects from Drive folder names  
**So that** I don't have to enter them manually

**Acceptance Criteria:**
- [ ] Given user clicks "Sync from Drive", when processing, then subfolders of selected folder are read
- [ ] Given folder name matches pattern "YY-MM-NNN - Client - Description", when parsing, then extract job number, client, name
- [ ] Given folder doesn't exist as project, when syncing, then create project with drive_folder_id
- [ ] Given folder already linked to project, when syncing, then skip (no duplicate)
- [ ] Edge case: Folder name doesn't match pattern → Skip with log

**Technical Notes:**
- Regex: /^(\d{2}-\d{2}-\d{3})\s*-\s*([^-]+)\s*-\s*(.+)$/
- File: src/app/api/google/sync-projects/route.ts
- Complexity: L

---

## Phase 6: Polish + Optimization

### US-029: Loading States
**As a** user  
**I want to** see loading indicators  
**So that** I know the app is working

**Acceptance Criteria:**
- [ ] Given any page is loading data, when viewing, then skeleton or spinner shows
- [ ] Given form is submitting, when waiting, then button shows spinner and disables
- [ ] Given table is filtering/sorting, when processing, then subtle loading indicator shows

**Technical Notes:**
- Use Suspense boundaries and shadcn Skeleton
- Complexity: M

---

### US-030: Error Handling
**As a** user  
**I want to** see helpful error messages  
**So that** I understand what went wrong

**Acceptance Criteria:**
- [ ] Given API returns error, when displayed, then user-friendly message shows (not stack trace)
- [ ] Given form validation fails, when viewing, then field-level errors highlight
- [ ] Given critical error, when viewing, then "Something went wrong" with retry button
- [ ] Given error occurs, when logged, then error details go to console (dev) or logging service (prod)

**Technical Notes:**
- Global error boundary: src/app/error.tsx
- Complexity: M

---

### US-031: Dashboard Charts
**As a** user  
**I want to** see visual charts of my financials  
**So that** I can spot trends

**Acceptance Criteria:**
- [ ] Given dashboard loads, when viewing, then "Receivables vs Payables" bar chart shows last 6 months
- [ ] Given data exists, when chart renders, then values are accurate
- [ ] Given hovering over bar, when viewing, then tooltip shows exact values
- [ ] Edge case: No historical data → Show "Not enough data" placeholder

**Technical Notes:**
- Use recharts library (already common with shadcn templates)
- File: src/components/charts/receivables-payables-chart.tsx
- Complexity: M

---

### US-032: Settings Page
**As a** user  
**I want to** manage app settings  
**So that** I can configure integrations and preferences

**Acceptance Criteria:**
- [ ] Given user navigates to /settings, when viewing, then sections show: Profile, QuickBooks, Google Drive, Notifications
- [ ] Given user updates profile, when saved, then changes persist
- [ ] Given integration is connected, when viewing, then status shows with "Disconnect" option

**Technical Notes:**
- File: src/app/settings/page.tsx
- Complexity: M

---

## Out of Scope (v1)

- Bids module (placeholder only)
- Multi-user/team support
- Invoice PDF generation
- Mobile app
- Real-time collaboration
- Audit logging

---

## How to Use This Document

1. Ralph reads this file to find the next `[ ]` checkbox
2. Ralph implements that story following acceptance criteria
3. Ralph updates progress.md to mark `[x]`
4. Ralph commits with message `US-XXX: [title]`
5. Repeat until all stories complete

---

*Generated for use with ralph-loop-agent*
