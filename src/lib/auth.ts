import { SignJWT, jwtVerify } from "jose";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET!);

const EXPIRY = "30d";

// Signs a group session token after successful group password verification.
export async function signGroupToken(slug: string): Promise<string> {
  return new SignJWT({ slug })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(await secret());
}

// Verifies a group token and returns the slug, or null if invalid/expired.
export async function verifyGroupToken(
  token: string,
  expectedSlug: string
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, await secret());
    return payload.slug === expectedSlug;
  } catch {
    return false;
  }
}

// Extracts and verifies the Bearer token from an Authorization header.
export async function verifyAuthHeader(
  authHeader: string | null,
  expectedSlug: string
): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  return verifyGroupToken(token, expectedSlug);
}
