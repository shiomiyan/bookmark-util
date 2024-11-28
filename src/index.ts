interface InoreaderData {
	items: {
		title: string;
		categories: string[];
		canonical: {
			href: string;
		}[];
	}[];
}

interface Env {
	INOREADER_RULE_NAME: string;
	INOREADER_USER_ID: string;
	RAINDROP_TEST_TOKEN: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Method not allowed.", { status: 405 });
		}

		// Validate Inoreader user id and rule name
		if (
			request.headers.get("x-inoreader-user-id") !== env.INOREADER_USER_ID ||
			request.headers.get("x-inoreader-rule-name") !== env.INOREADER_RULE_NAME
		) {
			return new Response("Forbidden :(", { status: 403 });
		}

		const inoreader = await request.json<InoreaderData>();
		const title = inoreader.items[0].title;
		const url = inoreader.items[0].canonical[0].href;

		const headers = {
			authorization: `Bearer ${env.RAINDROP_TEST_TOKEN}`,
			"content-type": "application/json",
		};

		const isMatomeru = inoreader.items[0].categories.some((category) =>
			category.endsWith("まとめる"),
		);

		// Raindrop collection ID for "まとめる"
		const collectionId = isMatomeru ? 50015228 : -1;
		const createRaindropResponse = await fetch(
			"https://api.raindrop.io/rest/v1/raindrop",
			{
				method: "POST",
				headers,
				body: JSON.stringify({
					title,
					link: url,
					collectionId,
					pleaseParse: {},
				}),
			},
		);

		return new Response(JSON.stringify(await createRaindropResponse.json()), {
			status: createRaindropResponse.status,
			headers: {
				"content-type": "application/json",
			},
		});
	},
} satisfies ExportedHandler<Env>;
