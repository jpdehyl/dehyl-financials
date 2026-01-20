import { NextResponse } from "next/server";
import { qbClient } from "@/lib/quickbooks/client";
import { randomBytes } from "crypto";

export async function GET() {
  // Generate state for CSRF protection
  const state = randomBytes(16).toString("hex");

  // In production, store state in session/cookie for verification

  const authUrl = qbClient.getAuthorizationUrl(state);

  return NextResponse.redirect(authUrl);
}
