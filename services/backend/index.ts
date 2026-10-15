import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from './auth.ts'
import {appRouter}  from './router.ts';
import { logTRPCError } from './utils/logger.ts';
 
const CORS_HEADERS = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Bun.serve({
     port: Bun.env.PORT,
     idleTimeout: 255,
     async fetch(request) {
          if (request.method === 'OPTIONS') {
               return new Response(null, { status: 204, headers: CORS_HEADERS });
          }

          const response = await fetchRequestHandler({
               endpoint: '/',
               req: request,
               router: appRouter,
               onError: logTRPCError,
               createContext: createTRPCContext,
          });

          const headers = new Headers(response.headers);
          for (const [key, value] of Object.entries(CORS_HEADERS)) {
               headers.set(key, value);
          }

          return new Response(response.body, {
               status: response.status,
               statusText: response.statusText,
               headers,
          });
     },
});
