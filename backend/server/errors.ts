import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export type AppErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "DATABASE_UNAVAILABLE"
  | "INVALID_EVENT_TRANSITION"
  | "IDEMPOTENCY_REQUIRED"
  | "IDEMPOTENCY_CONFLICT"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details: unknown;

  constructor(code: AppErrorCode, message: string, status = statusForCode(code), details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError("BAD_REQUEST", message, 400, details);
  }

  static unauthorized(message = "Authentication is required"): AppError {
    return new AppError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message = "You are not authorized for this action"): AppError {
    return new AppError("FORBIDDEN", message, 403);
  }

  static notFound(message = "Resource not found"): AppError {
    return new AppError("NOT_FOUND", message, 404);
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError("CONFLICT", message, 409, details);
  }

  static databaseUnavailable(message = "Database is unavailable", details?: unknown): AppError {
    return new AppError("DATABASE_UNAVAILABLE", message, 503, details);
  }

  static idempotencyRequired(): AppError {
    return new AppError("IDEMPOTENCY_REQUIRED", "Idempotency-Key header is required for this write", 400);
  }

  static idempotencyConflict(message: string, details?: unknown): AppError {
    return new AppError("IDEMPOTENCY_CONFLICT", message, 409, details);
  }
}

function statusForCode(code: AppErrorCode): number {
  if (code === "BAD_REQUEST" || code === "IDEMPOTENCY_REQUIRED") return 400;
  if (code === "UNAUTHORIZED") return 401;
  if (code === "FORBIDDEN") return 403;
  if (code === "NOT_FOUND") return 404;
  if (code === "CONFLICT" || code === "IDEMPOTENCY_CONFLICT" || code === "INVALID_EVENT_TRANSITION") return 409;
  if (code === "RATE_LIMITED") return 429;
  if (code === "DATABASE_UNAVAILABLE") return 503;
  return 500;
}

export interface ErrorPayload {
  error: {
    code: AppErrorCode;
    message: string;
    details?: unknown;
    requestId: string;
  };
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) {
    return AppError.badRequest("Request validation failed", error.issues);
  }
  if (error instanceof SyntaxError) {
    return AppError.badRequest("Request body must be valid JSON");
  }
  if (error instanceof Prisma.PrismaClientInitializationError || error instanceof Prisma.PrismaClientRustPanicError) {
    return AppError.databaseUnavailable("Database connection could not be initialized");
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") return AppError.notFound("Database record was not found");
    if (error.code === "P2002") return AppError.conflict("A record with the same unique value already exists");
    return AppError.databaseUnavailable("Database request failed", { prismaCode: error.code });
  }
  if (error instanceof Error && error.name === "InvalidEventTransitionError") {
    return new AppError("INVALID_EVENT_TRANSITION", error.message, 409);
  }
  if (error instanceof Error && error.name === "AuthorizationError") {
    return AppError.forbidden(error.message);
  }
  return new AppError("INTERNAL_ERROR", "An unexpected error occurred", 500);
}

export function errorPayload(error: unknown, requestId: string): ErrorPayload {
  const normalized = toAppError(error);
  return {
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details === undefined ? {} : { details: normalized.details }),
      requestId,
    },
  };
}
