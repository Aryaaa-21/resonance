import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import type { PrismaClient, UserRole } from "@prisma/client";
import { getRuntimeConfig } from "../config";
import { getPrisma, databaseIsConfigured } from "../db";
import { AppError } from "../errors";
import type { Actor } from "../domain/types";

export interface SessionUser extends Actor {
  readonly email?: string;
  readonly walletAddress?: string;
  readonly displayName: string;
}

interface DemoSession {
  readonly user: SessionUser;
  readonly expiresAt: number;
}

const demoUser: SessionUser = {
  id: "demo-user",
  email: "demo@resonance.local",
  displayName: "Demo Operator",
  role: "ADMIN",
};
const demoSessions = new Map<string, DemoSession>();

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function toSessionUser(user: { id: string; email: string | null; walletAddress: string | null; displayName: string; role: UserRole }): SessionUser {
  return { id: user.id, email: user.email ?? undefined, walletAddress: user.walletAddress ?? undefined, displayName: user.displayName, role: user.role as SessionUser["role"] };
}

export function sessionCookieName(): string {
  return getRuntimeConfig().sessionCookie;
}

export async function createSession(input: { email?: string; walletAddress?: string; displayName?: string }): Promise<{ token: string; user: SessionUser }> {
  const config = getRuntimeConfig();
  const walletAddress = input.walletAddress?.trim() || undefined;
  const email = input.email?.trim().toLowerCase() || (databaseIsConfigured() ? undefined : demoUser.email || "demo@resonance.local");
  const displayName = input.displayName?.trim() || demoUser.displayName;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + config.sessionTtlSeconds * 1000);

  if (!databaseIsConfigured()) {
    if (!config.demoMode) throw AppError.databaseUnavailable("DATABASE_URL is not configured and demo auth is disabled");
    const user = email === demoUser.email && !walletAddress ? demoUser : { ...demoUser, email, walletAddress, displayName, id: `demo-${hashToken(walletAddress ?? email ?? displayName).slice(0, 16)}` };
    demoSessions.set(token, { user, expiresAt: expiresAt.getTime() });
    return { token, user };
  }

  const db = getPrisma();
  if (!email && !walletAddress) throw AppError.badRequest("An email or wallet address is required to create a session");
  const user = email
    ? await db.user.upsert({
        where: { email },
        update: { displayName, ...(walletAddress ? { walletAddress } : {}) },
        create: { email, walletAddress, displayName, role: "REQUESTER" },
      })
    : await db.user.upsert({
        where: { walletAddress: walletAddress! },
        update: { displayName },
        create: { walletAddress: walletAddress!, displayName, role: "REQUESTER" },
      });
  await db.session.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt } });
  return { token, user: toSessionUser(user) };
}

export async function getCurrentUser(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(sessionCookieName())?.value;
  if (!token) return null;
  const config = getRuntimeConfig();
  if (!databaseIsConfigured()) {
    if (!config.demoMode) throw AppError.databaseUnavailable("DATABASE_URL is not configured and demo auth is disabled");
    const session = demoSessions.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      demoSessions.delete(token);
      return null;
    }
    return session.user;
  }
  const session = await getPrisma().session.findFirst({
    where: { tokenHash: hashToken(token), revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
  return session ? toSessionUser(session.user) : null;
}

export async function requireUser(request: NextRequest): Promise<SessionUser> {
  const user = await getCurrentUser(request);
  if (!user) throw AppError.unauthorized();
  return user;
}

export async function revokeSession(request: NextRequest): Promise<void> {
  const token = request.cookies.get(sessionCookieName())?.value;
  if (!token) return;
  if (!databaseIsConfigured()) {
    demoSessions.delete(token);
    return;
  }
  await getPrisma().session.updateMany({ where: { tokenHash: hashToken(token), revokedAt: null }, data: { revokedAt: new Date() } });
}

export function setSessionCookie(response: NextResponse, token: string): void {
  const config = getRuntimeConfig();
  response.cookies.set(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.nodeEnv === "production" && !config.demoMode,
    path: "/",
    maxAge: config.sessionTtlSeconds,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(sessionCookieName(), "", { httpOnly: true, sameSite: "lax", secure: getRuntimeConfig().nodeEnv === "production" && !getRuntimeConfig().demoMode, path: "/", maxAge: 0 });
}

export function demoSessionCount(): number {
  return demoSessions.size;
}
