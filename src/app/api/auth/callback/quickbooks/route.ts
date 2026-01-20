import { NextRequest, NextResponse } from "next/server";
import { qbClient } from "@/lib/quickbooks/client";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const realmId = searchParams.get("realmId");
  const error = searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    console.error("QuickBooks OAuth error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=oauth_failed", request.url)
    );
  }

  // Validate required parameters
  if (!code || !realmId) {
    console.error("Missing code or realmId");
    return NextResponse.redirect(
      new URL("/settings?error=missing_params", request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await qbClient.exchangeCodeForTokens(code, realmId);

    // Get company info before storing
    qbClient.setTokens(tokens);
    const companyInfo = await qbClient.getCompanyInfo();
    const companyName = (companyInfo as { CompanyName?: string }).CompanyName || "Unknown Company";

    // Store tokens in Supabase
    const supabase = await createClient();
    const { error: upsertError } = await supabase.from("oauth_tokens").upsert(
      {
        provider: "quickbooks",
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt.toISOString(),
        realm_id: tokens.realmId,
        metadata: { companyName },
      },
      { onConflict: "provider" }
    );

    if (upsertError) {
      console.error("Failed to store QuickBooks tokens:", upsertError);
      return NextResponse.redirect(
        new URL("/settings?error=token_storage_failed", request.url)
      );
    }

    console.log("QuickBooks connected successfully to:", companyName);

    return NextResponse.redirect(
      new URL("/settings?success=quickbooks_connected", request.url)
    );
  } catch (err) {
    console.error("Failed to exchange QuickBooks tokens:", err);
    return NextResponse.redirect(
      new URL("/settings?error=token_exchange_failed", request.url)
    );
  }
}
