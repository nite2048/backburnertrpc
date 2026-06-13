import { ok, err, tryCatch, type Result } from "../utils/errors";
import * as fs from 'fs';
import { OpenRouter } from '@openrouter/sdk';

const openRouter = new OpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

enum ContentType {
	Video = "Video",
	Audio = "Audio",
	Text = "Text",
	Fact = "Fact",
	Product = "Product"
}

type Metadata = {
	name: string;
	image: string;
	contentType: ContentType;
	metaData: Record<string, unknown>;
}

const metadataSchema = {
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

const imagePath = '../../../utils/examples/3dfoids.jpeg';
const base64Image = await encodeImageToBase64(imagePath);

export async function acquireMetadata(imageInBase64: string): Promise<Result<Metadata>> {
     const result = await tryCatch(
          openRouter.chat.send({
     		chatRequest: {
     			model: "openrouter/free",
     			messages: [
     				{
     					role: "user",
     					content: [
     						{
     							type: 'text',
     							text: "Given image is an image of a type of content, Extract and infer any context about it that you can solely from the image such as name, content-type (strictly one of Video, Audio, Text, Fact, Product), and any metadata fields that are relevant to the content type.",
     						},
     						{
     							type: 'image_url',
     							imageUrl: {
     								//url: `data:image/png;base64,${imageInBase64}`,
                                             //FIXME: This overload of the function cant be used for base64 image urls
                                             //url : "https://compote.slate.com/images/bacec59b-31c9-4514-bc8c-6ae362648417.png?crop=993%2C662%2Cx0%2Cy0&width=960"
                                             url: base64Image,
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
     					schema: metadataSchema,
     				}
     			},
     			stream: false,
     		}
          })
     )

	if (!result.ok) {
		return err(result.error);
	}

     const metadata: Metadata = {... result.data.choices[0]?.message.content};

     console.log("this code works")
     console.log(result.data.choices[0]?.message.content)

     return ok(metadata);
}

async function encodeImageToBase64(imagePath: string): Promise<string> {
     const imageBuffer = await fs.promises.readFile(imagePath);
     const base64Image = imageBuffer.toString('base64');
     return `data:image/jpeg;base64,${base64Image}`;
}
