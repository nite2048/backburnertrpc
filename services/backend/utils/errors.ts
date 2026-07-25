import { TRPCError } from "@trpc/server";

export type Result<Success, Failure extends Error = Error> =
  | { ok: true; data: Success }
  | { ok: false; error: Failure };

export function ok<Success>(data: Success): Result<Success, never> {
  return { ok: true, data };
}

export function err<Failure extends Error>(error: Failure): Result<never, Failure> {
  return { ok: false, error };
}

export class ExpectedError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class AuthError extends ExpectedError {
  constructor(message = "Unauthorized", options?: ErrorOptions) {
    super(message, "UNAUTHORIZED", 401, options);
  }
}

export class InternalError extends ExpectedError {
  constructor(message = "Internal server error", options?: ErrorOptions) {
    super(message, "INTERNAL_SERVER_ERROR", 500, options);
  }
}

export function isExpectedError(error: unknown): error is ExpectedError {
  return error instanceof ExpectedError;
}

export function normalizeError(error: unknown): ExpectedError {
  if (error instanceof ExpectedError) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalError(error.message, { cause: error });
  }

  if (typeof error === "string") {
    return new InternalError(error);
  }

  return new InternalError("Unknown error");
}

export async function tryCatch<Success>(
  operation: Promise<Success>,
): Promise<Result<Success, ExpectedError>> {
  try {
    const data = await operation;
    return ok(data);
  } catch (error) {
    return err(normalizeError(error));
  }
}

// TRPC auto serializes errors
export function toTRPCError(error: unknown): TRPCError {
  const normalized = normalizeError(error);

  return new TRPCError({
    code: normalized.code === "UNAUTHORIZED" ? "UNAUTHORIZED" : "INTERNAL_SERVER_ERROR",
    message: normalized.message,
    cause: normalized,
  });
}
