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

		// TODO: 現状「まとめる」タグの付いたコンテンツしか取り込めない
		// 「あとで読む」も同期するなど、将来的には汎用性を上げたい

		// Raindrop collection ID for "まとめる"
		const collectionId = 50015228;
		const createRaindropResponse = await fetch(
			"https://api.raindrop.io/rest/v1/raindrop",
			{
				method: "POST",
				headers,
				body: JSON.stringify({
					title,
					link: url,
					collectionId,
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
