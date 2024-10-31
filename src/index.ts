import { v4 as uuidv4 } from "uuid";

export interface InoreaderData {
	rule: {
		name: string;
	};
	items: {
		canonical: {
			href: string;
		}[];
	}[];
}

export interface Env {
	INOREADER_RULE_NAME: string;
	OMNIVORE_API_KEY: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Method not allowed.", { status: 405 });
		}

		const inoreader = await request.json<InoreaderData>();

		if (inoreader.rule.name !== env.INOREADER_RULE_NAME) {
			return new Response("Forbidden :(", { status: 403 });
		}

		// Mutation query for Omnivore GraphQL API
		const query = `
			mutation SaveUrl($input: SaveUrlInput!) {
				saveUrl(input: $input) {
					... on SaveSuccess { url clientRequestId }
					... on SaveError { errorCodes message }
				}
			}
			`;

		// Omnivore GraphQL API variables
		const clientRequestId = uuidv4();
		const variables = {
			input: {
				clientRequestId,
				source: "api",
				url: inoreader.items[0].canonical[0].href,
			},
		};

		const headers = {
			"authorization": env.OMNIVORE_API_KEY,
			"content-type": "application/json",
		};

		const omnivoreApiResponse = await fetch(
			"https://api-prod.omnivore.app/api/graphql",
			{
				method: "POST",
				headers,
				body: JSON.stringify({ query, variables }),
			},
		);

		return new Response(JSON.stringify(await omnivoreApiResponse.json()), {
			status: omnivoreApiResponse.status,
			headers: {
				"content-type": "application/json",
			},
		});
	},
} satisfies ExportedHandler<Env>;
