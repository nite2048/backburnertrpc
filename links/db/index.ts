//TODO: Check if exports in db package.json is requrired or even correct

/* Implementation details
If @links/db owns the Prisma client and exports a singleton like export const prisma = new PrismaClient();
or repository functions export async function getUser(...)

     Then keep it as a dependency only.
          {
               "dependencies": {
                    "@prisma/client": "^6"
               },

               "devDependencies": {
                    "prisma": "^6"
               }
          }

The backend never needs to install @prisma/client directly.
     import { prisma } from "@links/db"
*/