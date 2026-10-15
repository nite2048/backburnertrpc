// utils/logger.ts
import { TRPCError } from '@trpc/server';
import type { User } from '@links/contracts';
import { isExpectedError } from './errors';

const IS_PROD = false;

// Your login/register inputs carry credentials and your find input carries a base64 image.
const REDACT = /^(key|value|password|token|authorization|cookie|secret)$/i;
const MAX_STRING = 200;
const MAX_DEPTH = 4;
const MAX_CHAIN = 8;
const SERVER_CODES = new Set(['INTERNAL_SERVER_ERROR', 'BAD_GATEWAY', 'SERVICE_UNAVAILABLE', 'GATEWAY_TIMEOUT', 'NOT_IMPLEMENTED']);

// Redacts secrets and truncates long strings (base64 images) so logs stay readable and safe.
function sanitize(input: unknown, depth = 0): unknown {
     if (typeof input === 'string')
          return input.length > MAX_STRING ? `${input.slice(0, MAX_STRING)}…[${input.length} chars]` : input;
     if (input === null || typeof input !== 'object') return input;
     if (depth >= MAX_DEPTH) return '[depth limit]';
     if (Array.isArray(input)) return input.slice(0, 10).map(v => sanitize(v, depth + 1));

     return Object.fromEntries(
          Object.entries(input).map(([k, v]) => [k, REDACT.test(k) ? '[redacted]' : sanitize(v, depth + 1)]),
     );
}

type Link = { name: string; message: string; code?: string; issues?: string[]; stack?: string };

// Walks `cause` links (cycle-safe). Skips tRPC's intermediate wrapper errors, which are noise.
function causeChain(error: unknown): Link[] {
     const chain: Link[] = [];
     const seen = new Set<unknown>();
     let current: unknown = error;

     while (current != null && chain.length < MAX_CHAIN && !seen.has(current)) {
          seen.add(current);

          if (!(current instanceof Error)) {
               chain.push({ name: typeof current, message: String(current) });
               break;
          }

          if (chain.length === 0 || !(current instanceof TRPCError)) {
               const issues = (current as { issues?: { path: PropertyKey[]; message: string }[] }).issues;
               chain.push({
                    name: current.name,
                    message: current.message,
                    code: isExpectedError(current) ? current.code : (current as { code?: string }).code,
                    issues: Array.isArray(issues)
                         ? issues.map(i => `${i.path.join('.') || '(root)'}: ${i.message}`)
                         : undefined,
                    stack: current.stack,
               });
          }
          current = current.cause;
     }
     return chain;
}

type LogArgs = {
     error: TRPCError;
     type: 'query' | 'mutation' | 'subscription' | 'unknown';
     path: string | undefined;
     input: unknown;
     ctx: User | undefined;       // undefined when createContext itself threw
     req: Request;
};

export function logTRPCError({ error, type, path, input, ctx, req }: LogArgs) {
     const isServerFault = SERVER_CODES.has(error.code);
     const chain = causeChain(error);
     const root = chain[chain.length - 1];

     const entry = {
          level: isServerFault ? 'error' : 'warn',
          time: new Date().toISOString(),
          requestId: req.headers.get('x-request-id') ?? crypto.randomUUID(),
          procedure: path ?? '(no procedure: context or routing failure)',
          type,
          code: error.code,
          message: error.message,
          userId: ctx?.isLoggedIn ? ctx.id : 'anonymous',
          input: sanitize(input),
          // The deepest error's stack is the useful one; wrapper stacks only point at middleware.
          // 4xx are expected, so they skip the stack.
          chain: chain.map(({ stack: _stack, ...link }) => link),
          stack: isServerFault ? root?.stack : undefined,
     };

     const log = isServerFault ? console.error : console.warn;

     if (IS_PROD) {
          log(JSON.stringify(entry));   // one line per error: easy to grep and ship
          return;
     }

     const lines = [
          `[${entry.level.toUpperCase()}] ${entry.time} ${type} ${entry.procedure}  ${entry.code}  user=${entry.userId}  req=${entry.requestId.slice(0, 8)}`,
          `  input: ${JSON.stringify(entry.input)}`,
          '  cause chain:',
          ...chain.map((l, i) => {
               const head = `${'  '.repeat(i + 2)}${i ? '└ ' : ''}${l.name}${l.code ? ` [${l.code}]` : ''}: ${l.message}`;
               return l.issues ? [head, ...l.issues.map(x => `${'  '.repeat(i + 3)}- ${x}`)].join('\n') : head;
          }),
     ];
     if (entry.stack) lines.push('  root stack:', ...entry.stack.split('\n').slice(0, 12).map(s => `    ${s.trim()}`));

     log(lines.join('\n'));
}