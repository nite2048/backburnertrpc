import * as zod from 'zod';

export enum ContentType {
     Video = "Video",
     Web = "Web",
     Audio = "Audio",
	Text = "Text",
	Fact = "Fact",
	Product = "Product"
}

//IMPORTANT: Metadata Enforcer present in acquireMetadata in @genai.ts
export const imagelessMetadataSchema = zod.object({
  name: zod.string(),
  contentType: zod.nativeEnum(ContentType),
  metaData: zod.record(zod.string(), zod.unknown()),
});

export const appEntrySchema = zod.object({
	name: zod.string(),
     contentType: zod.nativeEnum(ContentType),
     originalImage: zod.string().nullish(),
     metaData: zod.record(zod.string(), zod.unknown()),
	aiMetadata: zod.record(zod.string(), zod.unknown()),
});

//final metadata hsoukld contain original image and oimage url

export const tmdbEntrySchema = zod.object({
	adult: zod.boolean().nullish(),
	id: zod.number().int(),
	media_type: zod.string(),
	overview: zod.string().nullish(),
	backdrop_path: zod.string().nullish(),
	poster_path: zod.string().nullish(),
	genre_ids: zod.array(zod.number().int()).nullish(),
	original_language: zod.string().nullish(),
	popularity: zod.number().nullish(),
	vote_average: zod.number().nullish(),
	vote_count: zod.number().int().nullish(),

	// Movie
	title: zod.string().nullish(),
	original_title: zod.string().nullish(),
	release_date: zod.string().nullish(),
	video: zod.boolean().nullish(),

	// TV
	name: zod.string().nullish(),
	original_name: zod.string().nullish(),
	first_air_date: zod.string().nullish(),
	origin_country: zod.array(zod.string()).nullish(),
});

export const tmdbEntrySchemaNormalized = zod.object({
     //Normalized
     name: zod.string(),
     original_name: zod.string().nullish(),
     release_date: zod.string().nullish(),

     //TV specific extra
     original_country: zod.string().nullish(),

     //Fields from before
     adult: zod.boolean().nullish(),
	id: zod.number().int(),
	media_type: zod.string(),
	overview: zod.string().nullish(),
	backdrop_path: zod.string().nullish(),
	poster_path: zod.string().nullish(),
	genre_ids: zod.array(zod.number().int()).nullish(),
	original_language: zod.string().nullish(),
	popularity: zod.number().nullish(),
	vote_average: zod.number().nullish(),
	vote_count: zod.number().int().nullish(),
});

export const tmdbResponseSchema = zod.object({
	page: zod.number().int(),
	results: zod.array(tmdbEntrySchema),
	total_pages: zod.number().int(),
	total_results: zod.number().int(),
});

export const anilistEntrySchema = zod.object({
	id: zod.number().int(),
	description: zod.string().nullable(),
     genres: zod.array(zod.string()),
     
     title: zod.object({
		romaji: zod.string().nullable(),
		english: zod.string().nullable(),
		native: zod.string().nullable(),
	}),

	coverImage: zod.object({
		extraLarge: zod.string(),
	}),

	startDate: zod.object({
		year: zod.number().int().nullable(),
	}),
	status: zod.string(),

	averageScore: zod.number().int().nullable(),
	meanScore: zod.number().int().nullable(),

	chapters: zod.number().int().nullable(),
	volumes: zod.number().int().nullable(),
	siteUrl: zod.string(),
});

export const anilistResponseSchema = zod.object({
	data: zod.object({
		Page: zod.object({
			media: zod.array(anilistEntrySchema),
		}),
	}),
});

export function normalizeTmdbEntry(entry: zod.infer<typeof tmdbEntrySchema>): zod.infer<typeof tmdbEntrySchemaNormalized>{
	const { title, original_title, release_date, video, name, original_name, first_air_date, origin_country, ...rest } = entry;

	const resolvedName = name ?? title;
	if (resolvedName == null) {
		throw new Error("Invalid entry: name is required (missing both name and title)");
     }
	
	return {
		...rest,
		name: resolvedName,
		original_name: original_name ?? original_title,
		release_date: release_date ?? first_air_date,
		original_country: origin_country?.[0],
	};
}