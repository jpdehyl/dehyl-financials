import type {
  Invoice,
  InvoiceWithSuggestions,
  Project,
  ProjectWithTotals,
  MatchSuggestion,
  ClientMapping,
} from "@/types";

interface MatchingContext {
  projects: ProjectWithTotals[];
  clientMappings: ClientMapping[];
}

/**
 * Generates match suggestions for an invoice based on various heuristics
 */
export function generateMatchSuggestions(
  invoice: Invoice,
  context: MatchingContext
): MatchSuggestion[] {
  const suggestions: MatchSuggestion[] = [];
  const { projects, clientMappings } = context;

  // Only match to active projects
  const activeProjects = projects.filter((p) => p.status === "active");

  for (const project of activeProjects) {
    const matchResult = calculateMatchScore(invoice, project, clientMappings);

    if (matchResult.score > 0) {
      suggestions.push({
        projectId: project.id,
        projectCode: project.code,
        confidence: matchResult.confidence,
        reason: matchResult.reason,
      });
    }
  }

  // Sort by confidence (high > medium > low) then by reason specificity
  const confidenceOrder = { high: 3, medium: 2, low: 1 };
  suggestions.sort((a, b) => {
    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
  });

  // Return top 3 suggestions
  return suggestions.slice(0, 3);
}

interface MatchResult {
  score: number;
  confidence: "high" | "medium" | "low";
  reason: string;
}

/**
 * Calculates a match score between an invoice and a project
 */
function calculateMatchScore(
  invoice: Invoice,
  project: Project,
  clientMappings: ClientMapping[]
): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  const invoiceMemo = (invoice.memo || "").toLowerCase();
  const invoiceClient = invoice.clientName.toLowerCase();

  // 1. Check for project code in memo (highest confidence)
  if (invoiceMemo.includes(project.code.toLowerCase())) {
    score += 100;
    reasons.push("Project code found in memo");
  }

  // 2. Check for project description keywords in memo
  const descWords = project.description
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const matchedDescWords = descWords.filter((word) =>
    invoiceMemo.includes(word)
  );
  if (matchedDescWords.length >= 2) {
    score += 80;
    reasons.push(`Description match: "${matchedDescWords.join(", ")}"`);
  } else if (matchedDescWords.length === 1) {
    score += 40;
    reasons.push(`Partial description match: "${matchedDescWords[0]}"`);
  }

  // 3. Client name matching
  const clientMatch = matchClientName(
    invoiceClient,
    project.clientName,
    project.clientCode,
    clientMappings
  );
  if (clientMatch.exact) {
    score += 60;
    reasons.push("Client name match");
  } else if (clientMatch.partial) {
    score += 30;
    reasons.push("Partial client name match");
  }

  // 4. Check for client code in memo
  if (invoiceMemo.includes(project.clientCode.toLowerCase())) {
    score += 20;
    reasons.push("Client code in memo");
  }

  // Determine confidence based on score
  let confidence: "high" | "medium" | "low";
  if (score >= 100) {
    confidence = "high";
  } else if (score >= 50) {
    confidence = "medium";
  } else if (score >= 20) {
    confidence = "low";
  } else {
    // No meaningful match
    return { score: 0, confidence: "low", reason: "" };
  }

  // Combine reasons
  const reason = reasons.length > 0 ? reasons[0] : "Potential match";

  return { score, confidence, reason };
}

interface ClientMatchResult {
  exact: boolean;
  partial: boolean;
}

/**
 * Matches invoice client name against project client info using mappings
 */
function matchClientName(
  invoiceClient: string,
  projectClientName: string,
  projectClientCode: string,
  clientMappings: ClientMapping[]
): ClientMatchResult {
  const invoiceClientLower = invoiceClient.toLowerCase();
  const projectClientLower = projectClientName.toLowerCase();

  // Direct match
  if (invoiceClientLower === projectClientLower) {
    return { exact: true, partial: false };
  }

  // Check if one contains the other
  if (
    invoiceClientLower.includes(projectClientLower) ||
    projectClientLower.includes(invoiceClientLower)
  ) {
    return { exact: true, partial: false };
  }

  // Check against client mapping
  const mapping = clientMappings.find(
    (m) => m.code.toLowerCase() === projectClientCode.toLowerCase()
  );

  if (mapping) {
    // Check QB customer name
    if (
      mapping.qbCustomerName.toLowerCase() === invoiceClientLower ||
      invoiceClientLower.includes(mapping.qbCustomerName.toLowerCase()) ||
      mapping.qbCustomerName.toLowerCase().includes(invoiceClientLower)
    ) {
      return { exact: true, partial: false };
    }

    // Check aliases
    for (const alias of mapping.aliases) {
      if (
        alias.toLowerCase() === invoiceClientLower ||
        invoiceClientLower.includes(alias.toLowerCase()) ||
        alias.toLowerCase().includes(invoiceClientLower)
      ) {
        return { exact: true, partial: false };
      }
    }

    // Partial match on display name
    if (
      mapping.displayName.toLowerCase().includes(invoiceClientLower.split(" ")[0])
    ) {
      return { exact: false, partial: true };
    }
  }

  // Check for partial word matches
  const invoiceWords = invoiceClientLower.split(/\s+/);
  const projectWords = projectClientLower.split(/\s+/);
  const commonWords = invoiceWords.filter((w) =>
    projectWords.some((pw) => pw.includes(w) || w.includes(pw))
  );

  if (commonWords.length > 0) {
    return { exact: false, partial: true };
  }

  return { exact: false, partial: false };
}

/**
 * Enriches invoices with match suggestions
 */
export function enrichInvoicesWithSuggestions(
  invoices: Invoice[],
  context: MatchingContext
): InvoiceWithSuggestions[] {
  return invoices.map((invoice) => {
    // Skip if already assigned
    if (invoice.projectId) {
      return {
        ...invoice,
        matchSuggestions: [],
      };
    }

    const matchSuggestions = generateMatchSuggestions(invoice, context);

    return {
      ...invoice,
      matchSuggestions,
    };
  });
}

/**
 * Auto-assigns invoices with high confidence matches
 * Returns the list of invoices that were auto-assigned
 */
export function getAutoAssignableInvoices(
  invoices: InvoiceWithSuggestions[]
): { invoiceId: string; projectId: string; reason: string }[] {
  const autoAssignable: { invoiceId: string; projectId: string; reason: string }[] = [];

  for (const invoice of invoices) {
    if (invoice.projectId) continue; // Already assigned

    const highConfidenceSuggestion = invoice.matchSuggestions.find(
      (s) => s.confidence === "high"
    );

    if (highConfidenceSuggestion) {
      autoAssignable.push({
        invoiceId: invoice.id,
        projectId: highConfidenceSuggestion.projectId,
        reason: highConfidenceSuggestion.reason,
      });
    }
  }

  return autoAssignable;
}
