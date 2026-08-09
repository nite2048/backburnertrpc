import { InternalError, NotFoundError, ModelError, tryCatch, ok, err, APIError } from "../utils/errors.ts";
import { ContentType, metadataSchema, appEntrySchema, tmdbResponseSchema, anilistResponseSchema } from '@links/contracts'; 

import * as fs from 'node:fs/promises';
import * as zod from 'zod';

import { OpenRouter } from '@openrouter/sdk';

const openRouter = new OpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

//IMPORTANT: countryOfOrigin for both API is in ISO 3166-1 alpha-2 format
const INCLUDE_ADULT = true;

type aiInferredMetadata = zod.infer<typeof metadataSchema>;
type Metadata = aiInferredMetadata & { image: string }; 
type AppEntry = zod.infer<typeof appEntrySchema>;

/* const output: Metadata = {
  ...parsed.data,
  image: imageInBase64,
}; */

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
          console.log(content)
          return err(new ModelError("Model returned invalid JSON"));
     }

     //TODO: Add safe Parse everywhere 
     //FEAT: Check the package jsonrepair
     const parsed = metadataSchema.safeParse(json);

     if (!parsed.success) return err(new ModelError("Validation failed, Model returned invalid schema"));
     return ok(parsed.data);
}

export async function themoviedb(metadata: aiInferredMetadata) {
	//https://developer.themoviedb.org/reference/search-multi

	//TODO: Look into these below later (doesn't work with multi)
	//https://developer.themoviedb.org/docs/append-to-response
	//https://developer.themoviedb.org/reference/movie-alternative-titles
     const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(metadata.name)}&include_adult=${INCLUDE_ADULT}&language=en-US&page=1`;

	const options = {
		method: "GET",
		headers: {
			accept: "application/json",
			Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
		},
     };

	const result = await tryCatch(fetch(url, options));
     if (!result.ok) return err(result.error);

     const json = await result.data.json();

     const parsed = tmdbResponseSchema.safeParse(json);
     if (!parsed.success) return err(new APIError(parsed.error.message)); 

	const filtered = parsed.data.results.filter(
		(r) => r.media_type === "movie" || r.media_type === "tv"
     );

	if (filtered.length === 0) {
		return err(new NotFoundError(`No movie/tv results found for "${metadata.name}"`));
     }

	// Maps the validated TMDB response into a single media model with consistent field names regardless of whether the result is a movie or TV show.
	const tmdbEntrySchemaNormalized = filtered.map((media) =>
		appEntrySchema.parse({
			id: media.id,
			mediaType: media.media_type,
			title: media.title ?? media.name ?? "",
			originalTitle: media.original_title ?? media.original_name ?? "",
			date: media.release_date ?? media.first_air_date ?? "",
			imagePath: media.poster_path ?? media.backdrop_path ?? null,
			overview: media.overview ?? "",
			popularity: media.popularity ?? null,
			voteAverage: media.vote_average ?? null,
			voteCount: media.vote_count ?? null,
			genreIds: media.genre_ids ?? [],
			originalLanguage: media.original_language ?? null,
		})
	);

	return ok(tmdbEntrySchemaNormalized);
}

//FIXME: Anilist language should default to japanese | Korean | Chinese / Infer language by country of origin
export async function anilist(name : string) {
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

     const variables = { search: name };
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
          return err(new NotFoundError(`No results found for ${name}`));
     }

     return ok(parsed.data.data.Page.media);
}

//TODO: Recheck return types
export async function queryData(metadata: aiInferredMetadata) {
     switch (metadata.contentType) {
          case ContentType.Video:
               const result = await themoviedb(metadata)
               if (!result.ok) return err(result.error);

               return ok(result.data);
          case ContentType.Image:
               const imageResult = await anilist(metadata.name)
               if (!imageResult.ok) return err(imageResult.error);

               return ok(imageResult.data);
          default:
               return err(new InternalError(`Unsupported content type: ${metadata.contentType}`));
     }
}