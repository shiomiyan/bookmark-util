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
	async fetch(request, env): Promise<Response> {
		// Allow only POST requests
		if (request.method !== "POST") {
			return new Response(null, { status: 405 });
		}

		const inoreader = await request.json<InoreaderData>();

		if (inoreader.rule.name !== env.INOREADER_RULE_NAME) {
			return new Response("Forbidden :(", { status: 403 });
		}

		const query = `
			mutation SaveUrl($input: SaveUrlInput!) {
				saveUrl(input: $input) {
					... on SaveSuccess { url clientRequestId }
					... on SaveError { errorCodes message }
				}
			}
			`;

		const clientRequestId = uuidv4();
		const variables = {
			input: {
				clientRequestId,
				source: "api",
				url: inoreader.items[0].canonical[0].href,
			},
		};

		const data = JSON.stringify({ query, variables });

		const headers = {
			"authorization": env.OMNIVORE_API_KEY,
			"content-type": "application/json",
		};

		const response = await fetch(
			"https://api-prod.omnivore.app/api/graphql",
			{
				method: "POST",
				headers,
				body: data,
			},
		);

		return new Response(JSON.stringify(await response.json()), {
			status: response.status,
		});
	},
} satisfies ExportedHandler<Env>;
