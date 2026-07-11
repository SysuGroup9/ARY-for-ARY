import { NextResponse } from "next/server";
import {
  finishGitHubOAuth,
  resolveGitHubOAuthErrorCode,
} from "@/lib/github-oauth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") ?? "";
  const state = searchParams.get("state") ?? "";
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/login?oauthError=github_denied", request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?oauthError=github_missing_code", request.url));
  }

  try {
    const returnTo = await finishGitHubOAuth({ code, state });
    return NextResponse.redirect(new URL(returnTo, request.url));
  } catch (err) {
    console.error("GitHub OAuth callback failed:", err);
    return NextResponse.redirect(
      new URL(
        `/login?oauthError=${resolveGitHubOAuthErrorCode(err, "callback")}`,
        request.url,
      ),
    );
  }
}
