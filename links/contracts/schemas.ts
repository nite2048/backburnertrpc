import * as zod from 'zod';

export enum ContentType {
     Video = "Video",
     Web = "Web",
     Image = "Image",
     Audio = "Audio",
	Text = "Text",
	Fact = "Fact",
	Product = "Product"
}

//IMPORTANT: Metadata Enforcer present in acquireMetadata in @genai.ts
export const metadataSchema = zod.object({
  name: zod.string(),
  contentType: zod.nativeEnum(ContentType),
  metaData: zod.record(zod.string(), zod.unknown()),
});

export const appEntrySchema = zod.object({
	id: zod.number().int(),
	mediaType: zod.string(), //WHY this will change to the enum specified aboce
	title: zod.string(),
	originalTitle: zod.string(),
	date: zod.string(),
	imagePath: zod.string().nullable(),
	overview: zod.string(),
	popularity: zod.number().nullable(),
	voteAverage: zod.number().nullable(),
	voteCount: zod.number().int().nullable(),
	genreIds: zod.array(zod.number().int()),
	originalLanguage: zod.string().nullable(),
});

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

export const tmdbResponseSchema = zod.object({
	page: zod.number().int(),
	results: zod.array(tmdbEntrySchema),
	total_pages: zod.number().int(),
	total_results: zod.number().int(),
});

export const anilistEntrySchema = zod.object({
	id: zod.number().int(),

	title: zod.object({
		romaji: zod.string().nullable(),
		english: zod.string().nullable(),
		native: zod.string().nullable(),
	}),

	description: zod.string().nullable(),

	genres: zod.array(zod.string()),

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
