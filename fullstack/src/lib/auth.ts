import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  name: string;
}

export const SESSION_COOKIE_NAME = "sidetek_session";
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "sidetek_apd_super_secret_jwt_key_2026_!#*"
);

/**
 * Creates a signed JWT session token for the given user.
 */
export async function createSessionToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

/**
 * Verifies a JWT session token and returns the payload if valid.
 */
export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    if (!payload || !payload.id || !payload.username) {
      return null;
    }
    return {
      id: payload.id as string,
      username: payload.username as string,
      email: (payload.email as string) || null,
      name: (payload.name as string) || (payload.username as string),
    };
  } catch {
    return null;
  }
}

/**
 * Compares plain password with hashed password.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Hashes a plain password using bcrypt.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/**
 * Retrieves the currently authenticated user from Next.js cookies in Server Components or API Routes.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
