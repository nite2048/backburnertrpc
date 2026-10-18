import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from './auth.ts'
import { appRouter, serveImage }  from './router.ts';
import { logTRPCError } from './utils/logger.ts';
import type { BunRequest } from 'bun';

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Bun.serve({
     port: Bun.env.PORT,
     idleTimeout: 255,

     routes: {
       "/static/images/:id": {
         GET: async (req : BunRequest<"/static/images/:id">) => {
           const response = await serveImage(req);
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
       },
     },
     
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