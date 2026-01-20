import { NextRequest, NextResponse } from "next/server";
import { driveClient } from "@/lib/google-drive/client";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=oauth_failed", request.url)
    );
  }

  // Validate required parameters
  if (!code) {
    console.error("Missing authorization code");
    return NextResponse.redirect(
      new URL("/settings?error=missing_code", request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await driveClient.exchangeCodeForTokens(code);

    // Get user info before storing
    driveClient.setTokens(tokens);
    const userInfo = await driveClient.getUserInfo();

    // Store tokens in Supabase
    const supabase = await createClient();
    const { error: upsertError } = await supabase.from("oauth_tokens").upsert(
      {
        provider: "google",
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt.toISOString(),
        metadata: { email: userInfo.email, name: userInfo.name },
      },
      { onConflict: "provider" }
    );

    if (upsertError) {
      console.error("Failed to store Google tokens:", upsertError);
      return NextResponse.redirect(
        new URL("/settings?error=token_storage_failed", request.url)
      );
    }

    console.log("Google Drive connected successfully as:", userInfo.email);

    return NextResponse.redirect(
      new URL("/settings?success=google_connected", request.url)
    );
  } catch (err) {
    console.error("Failed to exchange Google tokens:", err);
    return NextResponse.redirect(
      new URL("/settings?error=token_exchange_failed", request.url)
    );
  }
}
