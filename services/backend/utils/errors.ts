import { TRPCError } from "@trpc/server";

type TRPCCode = ConstructorParameters<typeof TRPCError>[0]['code'];
export type Result<Success, Failure extends Error = Error> = { ok: true; data: Success } | { ok: false; error: Failure };

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
          public readonly trpcCode: TRPCCode, 
          options?: ErrorOptions,
     ){
          super(message, options);
          this.name = new.target.name;
     }
}

export class AuthError extends ExpectedError {
     constructor(message = "Unauthorized", options?: ErrorOptions) {
          super(message, "UNAUTHORIZED", 401, "UNAUTHORIZED", options);
     }
}

export class APIError extends ExpectedError {
     constructor(message = "Failed to resolve external APIs. Try again later", options?: ErrorOptions) {
          super(message, "API_ERROR", 503, "BAD_GATEWAY", options);
     }
}

export class ModelError extends ExpectedError {
     constructor(message = "Model is unsupported or did not connect or behaved strangely", options?: ErrorOptions) {
          super(message, "OPENROUTER_ERROR", 503, "BAD_GATEWAY", options);
     }
}

export class NotFoundError extends ExpectedError {
     constructor(message = "Requested content was not found", options?: ErrorOptions) {
          super(message, "NOTFOUND_ERROR", 404, "NOT_FOUND", options);
     }
}

export class InternalError extends ExpectedError {
     constructor(message = "Internal server error", options?: ErrorOptions) {
          super(message, "INTERNAL_SERVER_ERROR", 500, "INTERNAL_SERVER_ERROR", options);
     }
}

export class FatalError extends ExpectedError {
     constructor(message = "Fatal Error, something went wrong in setup", options?: ErrorOptions) {
          super(message, "SERVICE_UNAVAILABLE_ERROR", 503, "SERVICE_UNAVAILABLE", options);
     }
}

export class ForbiddenError extends ExpectedError {
     constructor(message = "You are not allowed to do this", options?: ErrorOptions) {
          super(message, "FORBIDDEN_ERROR", 403, "FORBIDDEN", options);
     }
}

export function isExpectedError(error: unknown): error is ExpectedError {
     return error instanceof ExpectedError;
}

//FEAT: Exhaustive errors
export function toClientError(error: unknown): ExpectedError {
     if (error instanceof ExpectedError)
          return error;

     // Wrapped by another layer (e.g. tRPC): recover the original
     if (error instanceof Error && error.cause instanceof ExpectedError)
          return error.cause;

     // Default message on purpose: raw driver/runtime messages must not reach clients. The original is kept on `cause`.
     return new InternalError(undefined, { cause: error });
}

// TRPC auto serializes errors
export function toTRPCError(error: unknown): TRPCError {
     // Keep TRPCErrors that aren't wrapping one of ours (zod failures, your auth checks)
     if (error instanceof TRPCError && !isExpectedError(error.cause)) return error;

     const normalized = toClientError(error);
     return new TRPCError({
          code: normalized.trpcCode,
          message: normalized.message,
          cause: normalized,
     });
}

export async function tryCatch<Success>(operation: Promise<Success>): Promise<Result<Success, ExpectedError>> {
     try {
          const data = await operation;
          return ok(data);
     } catch (error) {
          return err(toClientError(error));
     }
}

export function tryCatchSync<Success>(operation: () => Success): Result<Success, ExpectedError> {
	try {
		const data = operation();
		return ok(data);
	} catch (error) {
		return err(toClientError(error));
	}
}