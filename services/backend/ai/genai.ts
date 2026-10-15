import * as zod from 'zod';
import * as fs from 'node:fs/promises';

import {APIError, NotFoundError, ModelError, tryCatchSync, tryCatch, ok, err } from "../utils/errors.ts";
import {ContentType, type AppEntry, type ImagelessMetadata, imagelessMetadataSchema, tmdbResponseSchema, tmdbEntrySchemaNormalized,  normalizeTmdbEntry, anilistResponseSchema} from '@links/contracts';

import { OpenRouter } from '@openrouter/sdk';

const openRouter = new OpenRouter({apiKey: Bun.env.OPENROUTER_API_KEY});

//IMPORTANT: countryOfOrigin for both API is in ISO 3166-1 alpha-2 format
const INCLUDE_ADULT = true;

export async function acquireMetadata(model: string, imageInBase64: string) {
     const instructions = await tryCatch(fs.readFile("./services/backend/ai/instructions/metadata.txt", "utf8"));
     if (!instructions.ok) return instructions;

     const metadataSchemaEnforcer = {
     	type: "object",
     	properties: {
     		name: { type: "string" },
     		image: { type: "string" },
     		contentType: {
     			type: "string",
     			enum: Object.values(ContentType)
     		},
     		metaData: { type: "object" }
     	},
     	required: ["name", "image", "contentType", "metaData"],
     	additionalProperties: true
     } as const;

     //FEAT: Explore using openrouter fusion to improve data responses
     const result = await tryCatch(
          openRouter.chat.send({
     		chatRequest: {
     			model: model,
     			messages: [
     				{
     					role: "user",
     					content: [
     						{
     							type: 'text',
     							text: instructions.data
     						},
     						{
     							type: 'image_url',
     							imageUrl: {
                                             url: imageInBase64,
                                        },
                                   },
                              ],
     				},
     			],
     			responseFormat: {
     				type: "json_schema",
     				jsonSchema: {
     					name: "metadata",
     					strict: true,
     					schema: metadataSchemaEnforcer,
     				}
     			},
     			stream: false,
     		}
          })
     )
	if (!result.ok) return err(result.error);

     const content : string = result.data.choices[0]?.message.content;
     if (!content) return err(new ModelError("Model returned an empty response"));

     let json
     try {
          json = JSON.parse(content);
     } catch {
          return err(new ModelError("Model returned invalid JSON"));
     }

     //TODO: Add safe Parse everywhere
     //FEAT: Check the package jsonrepair
     const parsed = imagelessMetadataSchema.safeParse(json);

     if (!parsed.success) return err(new ModelError("Validation failed, Model returned invalid schema"));
     return ok(parsed.data);
}

export async function themoviedb(queryName: string) {
	//https://developer.themoviedb.org/reference/search-multi

	//TODO: Look into these below later (doesn't work with multi)
	//https://developer.themoviedb.org/docs/append-to-response
	//https://developer.themoviedb.org/reference/movie-alternative-titles
     const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(queryName)}&include_adult=${INCLUDE_ADULT}&language=en-US&page=1`;
     const auth : string = 'Bearer ' + Bun.env.TMDB_API_KEY;


	const options = {
          method: "GET",
          verbose: true,
		headers: {
			accept: "application/json",
			Authorization: auth,
          },
		keepalive: true, //BUG: Acutally check what it does
     };

	const result = await tryCatch(fetch(url, options));
     if (!result.ok) return err(result.error);

     const json = await result.data.json();

     const parsed = tmdbResponseSchema.safeParse(json);
     if (!parsed.success)

          return err(new APIError(parsed.error.message));

	const filtered = parsed.data.results.filter(
		(r) => r.media_type === "movie" || r.media_type === "tv"
     );

	if (filtered.length === 0) {
		return err(new NotFoundError(`No movie/tv results found for "${queryName}"`));
     }

     const normalized: zod.infer<typeof tmdbEntrySchemaNormalized>[] = [];

     for (const entry of filtered) {
          const result = tryCatchSync(() => normalizeTmdbEntry(entry));
          if (!result.ok)
               return err(result.error);

          normalized.push(result.data);
     }

     const output: ImagelessMetadata[] = normalized.map(({ name, ...rest }) => ({
     	name,
     	contentType: ContentType.Video,
     	metaData: rest,
     }));

     return ok(output);
}

//FIXME: Anilist language should default to japanese | Korean | Chinese / Infer language by country of origin
export async function anilist(queryName : string) {
     //https://studio.apollographql.com/sandbox/explorer @https://graphql.anilist.co > Query > Page > Media
     //TODO Add [countryOfOrigin] and update relevent schemas
     const query = `query ($search: String) {
          Page(page: 1, perPage: 10) {
               media(search: $search, type: MANGA) {
                    id
                    title {
                         romaji
                         english
                         native
                    }
                    description(asHtml: false)
                    genres
                    coverImage {
                         extraLarge
                    }
                    startDate {
                         year
                    }
                    status
                    averageScore
                    meanScore
                    chapters
                    volumes
                    siteUrl
               }
          }
     }`;

     const variables = { search: queryName };
     const url = 'https://graphql.anilist.co';
     const options = {
          method: 'POST',
          headers: {
               'Content-Type': 'application/json',
               'Accept': 'application/json',
          },
          body: JSON.stringify({
               query: query,
               variables: variables
          })
     };

     const result = await tryCatch(fetch(url, options))
     if (!result.ok) return err(result.error);

     const json = await result.data.json();
     const parsed = anilistResponseSchema.safeParse(json);

     if (!parsed.success) return err(new APIError(parsed.error.message));

     if(parsed.data.data.Page.media.length === 0){
          return err(new NotFoundError(`No results found for ${queryName}`));
     }

     let output: ImagelessMetadata[] = []

     for (const { title, ...rest } of parsed.data.data.Page.media) {
          const english = title.english;
          const romaji = title.romaji;
          const native = title.native;

          if (!english && !romaji && !native) {
               //TODO: Check if this error works as expected
               return err(
                    new NotFoundError(`Anilist found no name for ${title}`)
               );
          }

          const name: string = english! ?? romaji! ?? native!;
          const data = {
               ...(romaji && { romaji }),
               ...(native && { native }),
               ...rest,
          }

          output.push({
               name: name,
               contentType: ContentType.Text,
               metaData: data,
          })
     }

     return ok(output);
}