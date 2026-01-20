# Ralph Loop Configuration for DeHyl Financials

> **Ralph = Keep trying until it's actually done.**  
> Think of it like a persistent toddler that won't stop until the task is truly complete.

## Overview

This configures the [ralph-loop-agent](https://github.com/vercel-labs/ralph-loop-agent) for autonomous development of DeHyl Financials.

## Quick Start

```bash
# Install ralph-loop-agent
npm install ralph-loop-agent ai zod

# Or use Claude Code's built-in Ralph support
claude --ralph
```

## Loop Configuration

```typescript
import { RalphLoopAgent, iterationCountIs, costIs } from 'ralph-loop-agent';
import { createCodingTools } from './tools';

const dehylFinancialsAgent = new RalphLoopAgent({
  model: 'anthropic/claude-sonnet-4-20250514',
  
  instructions: `You are building DeHyl Financials, a financial dashboard for DeHyl Constructors Corp.
  
  CONTEXT FILES TO READ FIRST:
  - CLAUDE.md (project conventions)
  - docs/PRD.md (full requirements)
  - RALPH_PRD.md (phased user stories)
  - progress.md (completed work)
  
  WORKFLOW:
  1. Read progress.md to find the next incomplete user story
  2. Implement the story following acceptance criteria
  3. Run tests/linting to verify
  4. Update progress.md with completion status
  5. Commit with message: "US-XXX: [title]"
  
  TECH STACK:
  - Next.js 16 (App Router)
  - Tailwind CSS 4 + shadcn/ui
  - Supabase (PostgreSQL + Auth)
  - QuickBooks Online API
  - Google Drive API
  
  CONVENTIONS:
  - Use Server Components by default, Client Components only when needed
  - All API routes in src/app/api/
  - Reusable components in src/components/
  - Types in src/types/
  - Database operations via Supabase client in src/lib/supabase/`,
  
  tools: createCodingTools(),
  
  // Safety limits
  stopWhen: [
    iterationCountIs(50),      // Max 50 iterations per session
    costIs(10.00),             // Max $10 per session
  ],
  
  // Completion verification
  verifyCompletion: async ({ result, iteration }) => {
    const checks = {
      hasCommit: result.text.includes('US-') && result.text.includes('committed'),
      progressUpdated: result.text.includes('progress.md updated'),
      testsPass: !result.text.includes('test failed') && !result.text.includes('error'),
      lintPass: !result.text.includes('eslint error'),
    };
    
    const allPass = Object.values(checks).every(Boolean);
    
    return {
      complete: allPass,
      reason: allPass 
        ? `User story completed and committed (iteration ${iteration})`
        : `Incomplete: ${Object.entries(checks).filter(([,v]) => !v).map(([k]) => k).join(', ')}`
    };
  },
  
  // Progress callbacks
  onIterationStart: ({ iteration }) => {
    console.log(`\n🔄 Starting iteration ${iteration}...`);
  },
  
  onIterationEnd: ({ iteration, duration }) => {
    console.log(`✅ Iteration ${iteration} completed in ${Math.round(duration/1000)}s`);
  },
});

// Run the loop
export async function runRalph(prompt?: string) {
  const result = await dehylFinancialsAgent.loop({
    prompt: prompt || `
      Read progress.md and RALPH_PRD.md.
      Find the next incomplete user story (marked with [ ]).
      Implement it following all acceptance criteria.
      Run 'npm run lint' and 'npm run build' to verify.
      Update progress.md to mark the story complete [x].
      Commit with message format: "US-XXX: [story title]"
    `,
  });
  
  console.log(`\n🎉 Ralph completed in ${result.iterations} iterations`);
  console.log(`📝 Reason: ${result.completionReason}`);
  
  return result;
}
```

## Bash Loop Alternative (Simple)

If you prefer the classic bash approach:

```bash
#!/bin/bash
# ralph.sh - Simple Ralph loop for Claude Code

MAX_ITERATIONS=${1:-30}
ITERATION=0

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  ITERATION=$((ITERATION + 1))
  echo "🔄 Ralph iteration $ITERATION of $MAX_ITERATIONS"
  
  claude -p "
    Read progress.md and RALPH_PRD.md.
    Find the next incomplete user story ([ ] not [x]).
    Implement it completely following acceptance criteria.
    Update progress.md when done.
    Commit: 'US-XXX: [title]'
    
    If all stories are complete, say RALPH_COMPLETE.
  " --allowedTools "Bash(git commit:*),Bash(npm:*),Edit,Write,Read"
  
  # Check for completion
  if grep -q "RALPH_COMPLETE" /tmp/ralph_output.txt 2>/dev/null; then
    echo "✅ All user stories complete!"
    break
  fi
  
  sleep 2
done

echo "🏁 Ralph finished after $ITERATION iterations"
```

## Phase Overview

| Phase | Focus | Stories | Est. Time |
|-------|-------|---------|-----------|
| 1 | Core Data Models + Auth | US-001 to US-006 | 4-6 hours |
| 2 | Dashboard + Projects | US-007 to US-012 | 4-6 hours |
| 3 | Receivables + Payables | US-013 to US-018 | 4-6 hours |
| 4 | QuickBooks Integration | US-019 to US-024 | 6-8 hours |
| 5 | Google Drive Sync | US-025 to US-028 | 4-6 hours |
| 6 | Polish + Optimization | US-029 to US-032 | 3-4 hours |

## Subagent Configuration (Optional)

For complex phases, you can spawn specialized subagents:

```typescript
// subagents/quickbooks-agent.ts
const quickbooksAgent = new RalphLoopAgent({
  model: 'anthropic/claude-sonnet-4-20250514',
  instructions: `You specialize in QuickBooks Online API integration.
    
    EXPERTISE:
    - OAuth 2.0 flow for QuickBooks
    - Invoice/Bill CRUD operations
    - Customer/Vendor management
    - Webhook handling
    
    REFERENCE:
    - https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/invoice
    - https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/bill
  `,
  stopWhen: iterationCountIs(20),
});

// subagents/google-drive-agent.ts
const googleDriveAgent = new RalphLoopAgent({
  model: 'anthropic/claude-sonnet-4-20250514',
  instructions: `You specialize in Google Drive API integration.
    
    EXPERTISE:
    - Google OAuth 2.0
    - Folder structure traversal
    - File metadata extraction
    - Watch/webhook setup for changes
    
    REFERENCE:
    - https://developers.google.com/drive/api/reference/rest/v3
  `,
  stopWhen: iterationCountIs(20),
});
```

## Verification Checks

Ralph verifies each iteration against these criteria:

1. **Build passes**: `npm run build` exits 0
2. **Lint passes**: `npm run lint` exits 0  
3. **Types valid**: No TypeScript errors
4. **Progress updated**: progress.md reflects completed work
5. **Committed**: Git commit created with proper message

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Ralph stuck in loop | Check if acceptance criteria are achievable |
| Tests keep failing | Ensure test DB is seeded properly |
| Build errors | Run `npm install` and check dependencies |
| Auth issues | Verify Supabase env vars are set |
| API rate limits | Add delays between iterations |

## Files to Create in Your Repo

1. **ralph.md** (this file) → Project root
2. **RALPH_PRD.md** → Phased user stories (see next file)
3. **progress.md** → Tracks completion status

---

*Ralph Loop methodology: "Keep feeding an AI agent a task until the job is done."*
