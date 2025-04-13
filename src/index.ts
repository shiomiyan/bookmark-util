/**
 * InoreaderのWebhookアクションで送信されるリクエスト
 */
interface InoreaderWebhookData {
	items: {
		title: string;
		categories: string[];
		canonical: {
			href: string;
		}[];
	}[];
}

/**
 * Raindropの検索APIのレスポンス
 * @see https://developer.raindrop.io/v1/raindrops/multiple#get-raindrops
 */
interface Ranidrops {
	items: {
		_id: number;
	}[];
}

/**
 * Raindropの保存先コレクションのID
 */
const raindropCollectionId: number = 50015228;

export default {
	/**
	 * InoreaderからのWebhookリクエストを受け取り、Raindropに保存する
	 * @param request - InoreaderからのWebhookリクエスト
	 * @param env - 環境変数
	 * @returns - レスポンス
	 */
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Method not allowed.", { status: 405 });
		}

		// InoreaderのWebhookから送信されるカスタムヘッダで、ユーザーIDとルール名を検証する
		if (
			request.headers.get("x-inoreader-user-id") !== env.INOREADER_USER_ID ||
			request.headers.get("x-inoreader-rule-name") !== env.INOREADER_RULE_NAME
		) {
			return new Response("Forbidden :(", { status: 403 });
		}

		const inoreader = await request.json<InoreaderWebhookData>();
		const title = inoreader.items[0].title;
		const url = inoreader.items[0].canonical[0].href;

		const headers = {
			authorization: `Bearer ${env.RAINDROP_TEST_TOKEN}`,
			"content-type": "application/json",
		};

		// Raindropに同じURLが保存されていたら、コレクションを"まとめる"に移動する
		const params = new URLSearchParams({
			search: url,
			sort: "-created",
		});
		const searchRaindropsResponse = await fetch(
			`https://api.raindrop.io/rest/v1/raindrops/-1?${params}`,
			{
				method: "GET",
				headers,
			},
		);
		const raindrops = await searchRaindropsResponse.json<Ranidrops>();
		const isAlreadySaved = raindrops.items.length > 0;

		// 同じURLが保存されていたら、コレクションを更新すればいい
		if (isAlreadySaved) {
			const raindropId = raindrops.items[0]._id;
			const updateRaindropResponse = await fetch(
				`https://api.raindrop.io/rest/v1/raindrop/${raindropId}`,
				{
					method: "PUT",
					headers,
					body: JSON.stringify({ collection: { $id: raindropCollectionId } }),
				},
			);

			// Logging for Workers Logs
			console.log(await updateRaindropResponse.json());

			// 更新したRaindropのレスポンスを返す
			return new Response(undefined, { status: 204 });
		}

		// まだRaindropに保存されていなかったら、新しく保存する
		const createRaindropResponse = await fetch(
			"https://api.raindrop.io/rest/v1/raindrop",
			{
				method: "POST",
				headers,
				body: JSON.stringify({
					title,
					link: url,
					collectionId: raindropCollectionId,
					pleaseParse: {},
				}),
			},
		);

		// Logging for Workers Logs
		console.log(await createRaindropResponse.json());

		return new Response(undefined, { status: 204 });
	},
} satisfies ExportedHandler<Env>;
