// test/index.spec.ts
import { env, SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import body from "./inoreader-webhook-body.json";

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("Hello World worker", () => {
	it("Raindropに記事が保存されることのテスト", async () => {
		const request = new IncomingRequest("http://example.com", {
			method: "POST",
			headers: {
				"x-inoreader-user-id": env.INOREADER_USER_ID,
				"x-inoreader-rule-name": env.INOREADER_RULE_NAME,
			},
			body: JSON.stringify(body)
		});
		const response = await SELF.fetch(request, env);
		expect((await response.json()).result).toBe(true);
	});
});
