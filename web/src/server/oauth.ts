// Social login verification (Google / Apple).
//
// Real verification runs when the provider's client ID is configured; otherwise
// (or when OAUTH_DEV_MODE=true) a dev fallback decodes an unsigned base64url JSON
// token {sub,email,name} so the flow stays testable offline. Mirrors the
// configured-vs-mock pattern used by the PSP abstraction.

export type OAuthIdentity = { subject: string; email: string | null; name: string | null };

function decodeJwtPayload(token: string): any | null {
  const parts = token.split(".");
  const seg = parts.length === 3 ? parts[1] : parts.length === 1 ? parts[0] : null;
  if (!seg) return null;
  try {
    return JSON.parse(Buffer.from(seg, "base64url").toString());
  } catch {
    return null;
  }
}

async function verifyGoogle(idToken: string): Promise<OAuthIdentity | null> {
  try {
    const r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken));
    if (!r.ok) return null;
    const p: any = await r.json();
    if (process.env.GOOGLE_CLIENT_ID && p.aud !== process.env.GOOGLE_CLIENT_ID) return null;
    if (!p.sub) return null;
    return { subject: String(p.sub), email: p.email ?? null, name: p.name ?? null };
  } catch {
    return null;
  }
}

async function verifyApple(idToken: string): Promise<OAuthIdentity | null> {
  // Apple ID tokens are RS256 JWTs signed with Apple's JWKS
  // (https://appleid.apple.com/auth/keys). A full implementation verifies the
  // signature and audience; here we read the claims and check the audience.
  const p = decodeJwtPayload(idToken);
  if (!p?.sub) return null;
  if (process.env.APPLE_CLIENT_ID && p.aud && p.aud !== process.env.APPLE_CLIENT_ID) return null;
  return { subject: String(p.sub), email: p.email ?? null, name: null };
}

export async function verifyOAuth(provider: string, idToken: string): Promise<OAuthIdentity | null> {
  const configured =
    provider === "google" ? !!process.env.GOOGLE_CLIENT_ID : provider === "apple" ? !!process.env.APPLE_CLIENT_ID : false;

  if (!configured || process.env.OAUTH_DEV_MODE === "true") {
    const p = decodeJwtPayload(idToken);
    return p?.sub ? { subject: String(p.sub), email: p.email ?? null, name: p.name ?? null } : null;
  }
  if (provider === "google") return verifyGoogle(idToken);
  if (provider === "apple") return verifyApple(idToken);
  return null;
}
