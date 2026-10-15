import {type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { toTRPCError, AuthError, FatalError, ok, err } from "./utils/errors";
import type { User, AuthenticatedUser, UnauthenticatedUser } from "@links/contracts"

import * as zod from 'zod';

const JWT_EXPIRATION_TIME = 60 * 60 * 2; //Seconds

const Segment = zod.string().min(1);
const TokenSchema = zod.tuple([Segment, Segment, Segment]);
const HeaderSchema = zod.object({
     algorithm: zod.literal('HS256'),
     type: zod.literal('JWT'),
});
const PayloadSchema = zod.object({
    subject: zod.string().min(1),
    name: zod.string(),
    issuedAt: zod.number(),
    expiration: zod.number(),
});

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function encode(input: string | Uint8Array): string {
     const bytes = typeof input === 'string' ? encoder.encode(input) : input;
     
     let binary = '';
     for (const byte of bytes) binary += String.fromCharCode(byte);
     return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

//IMPORTANT: Use decodeText for header and payload, and decodeBytes for the signature
function decodeBytes(input: string): Uint8Array {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}
const decodeText = (input: string) => decoder.decode(decodeBytes(input));

//TODO: After this function figure out a storage function
async function hmacKey(){
     if (!Bun.env.JWT_SECRET)
          return err(new FatalError("JWT not configured or .env is missing"))
     
     return ok(await crypto.subtle.importKey(
       'raw', encoder.encode(Bun.env.JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'],
     ));
}

//user is type of AuthenticatedUser here beacause a token shouldn't be signed for someone who isn’t logged in, and an unauthenticated user has no id or name anyway.
export async function signToken(user: AuthenticatedUser, expiration: number = JWT_EXPIRATION_TIME){
     const now = Math.floor(Date.now() / 1000);
     const header : zod.infer<typeof HeaderSchema> = { algorithm: 'HS256', type: 'JWT' };
     
     const payload : zod.infer<typeof PayloadSchema> = {
          subject: user.id,
          name: user.name,
          issuedAt: now,
          expiration: now + expiration,
     };

     //Generating a base64 url with header and payload
     const signingInput = `${encode(JSON.stringify(header))}.${encode(JSON.stringify(payload))}`;

     //Says which cryptographic algorithm to use and converts the string into bytes, because the web crypto api operates on binary data.
     const key = await hmacKey();
     if (!key.ok)
          return err(key.error)
     
     const signature = await crypto.subtle.sign('HMAC', key.data, encoder.encode(signingInput));

     //JWT payload
     //Uint8Array converts bytes returned by crypto.subtle.sign into a byte array to be encoded by encode
     return ok(`${signingInput}.${encode(new Uint8Array(signature))}`);
}

export async function verifyToken(token: string){
     const parsedToken = TokenSchema.safeParse(token.split('.'));
     
     if (!parsedToken.success) 
          return err(new AuthError('JWT verification failed: invalid token structure', { cause: parsedToken.error }));
     
     const [headerPart, payloadPart, signaturePart] = parsedToken.data;
     const signingInput = `${headerPart}.${payloadPart}`;

     let payload: zod.infer<typeof PayloadSchema>;
     
     try {
          HeaderSchema.parse(JSON.parse(decodeText(headerPart)));
          payload = PayloadSchema.parse(JSON.parse(decodeText(payloadPart)));
     } catch (error) {
          return err(new AuthError('JWT verification failed: invalid Base64URL or JSON', { cause: error }));
     }
     
     if (payload.expiration <= Math.floor(Date.now() / 1000)) {
          return err(new AuthError('JWT verification failed: token expired or invalid expiration'));
     }
     
     let signatureBytes: Uint8Array;
     
     try {
         signatureBytes = decodeBytes(signaturePart);
     } catch (error) {
          return err(new AuthError('JWT verification failed: invalid signature encoding', { cause: error }));
     }

     const key = await hmacKey();
     if (!key.ok)
          return err(key.error)
     
     const valid = await crypto.subtle.verify(
          'HMAC',
          key.data,
          signatureBytes,
          encoder.encode(signingInput)
     );
     
     if (!valid) {
          return err(new AuthError('JWT verification failed: invalid signature'));
     }
     
     return ok<AuthenticatedUser>({ isLoggedIn: true, id: payload.subject, name: payload.name });
}

export async function setUserState(headers: Headers): Promise<User> {
     const header = headers.get('authorization');
     if (!header?.startsWith('Bearer '))
          return <UnauthenticatedUser>{ isLoggedIn: false };

     const result = await verifyToken(header.slice('Bearer '.length).trim());
     if (result.ok)
          return <AuthenticatedUser>result.data;

     //TODO: Handle other errors
     if (result.error instanceof AuthError)
          return <UnauthenticatedUser>{ isLoggedIn: false };
     else if(result.error instanceof FatalError)
          throw toTRPCError(result.error);

     //This would not be necessary once exhuastive errors are implemented
     //Throw statement can be removed right now, since verify token only throws AuthError and FatalError
     //throw result.error
     //FIXME: Remove this later
     return <UnauthenticatedUser>{ isLoggedIn: false };
}

//Context is created at every fetch request, always runs.
export async function createTRPCContext( {req} : FetchCreateContextFnOptions ) : Promise<User>{
     return await setUserState(req.headers);
}