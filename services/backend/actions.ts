import { type AppEntry, type AuthenticatedUser, ContentType, type User } from "@links/contracts";
import { acquireMetadata, themoviedb, anilist } from "./ai/genai";
import { findClosestMatch } from "./ai/match";
import { toTRPCError, tryCatch } from "./utils/errors";
import { createEntry, storeImage } from "@links/db";

export async function createHttpEntry(base64Image: string, model: string, user : AuthenticatedUser): Promise<AppEntry> {
     const ai = await acquireMetadata(model, base64Image);
     if (!ai.ok) throw toTRPCError(ai.error);
     
     const {name, contentType, metaData} = ai.data;
     
     const api = await (
          async () => {
               switch (contentType) {
                    case ContentType.Video:
                         return themoviedb(name);
                    case ContentType.Text:
                         return anilist(name);
                    default:
                         throw toTRPCError(`Unsupported content type: ${contentType}`);
               }
          }
     )();
     
     if (!api.ok) throw toTRPCError(api.error);

     const match = findClosestMatch(name, api.data.map(({ name }) => name));
     const result = {...api.data[match.originalIndex]!, originalImage: base64Image, aiMetadata: metaData}

     const db = await tryCatch(createEntry({ userId: user.id, ...result }))
     if (!db.ok) throw toTRPCError(db.error)

     await storeImage(user.id, db.data.id, new Blob([base64ToBytes(base64Image)]))
     return db.data
}

function base64ToBytes(input: string): Buffer {
     const comma = input.indexOf(",");
     const b64 = input.startsWith("data:") && comma !== -1 ? input.slice(comma + 1) : input;
     return Buffer.from(b64, "base64");
}