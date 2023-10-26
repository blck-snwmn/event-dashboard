import { Product, Limit, Itemliimit } from "dash-message/message"

type CrawleMessage = ListCrawleMessage | ItemCrawleMessage;

interface ListCrawleMessage {
	type: "list";
	url: string;
}

interface ItemCrawleMessage {
	id: number;
	type: "item";
	url: string;
}



export interface Env {
	BASE_URL: string;
	COLLECTER: Fetcher;
	SAVER: Fetcher;
	QUEUE: Queue<CrawleMessage>;
}

export default {
	// async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	// 	const { url } = await request.json() as { url: string };
	// 	if (!url) {
	// 		return new Response("Missing url", { status: 400 });
	// 	}
	// 	const reqURL = new URL(request.url);
	// 	console.log(reqURL.origin + "/item")
	// 	const resp = await env.COLLECTER.fetch("http://localhost:8787/item", {
	// 		method: "POST",
	// 		body: JSON.stringify({ url }),
	// 	})
	// 	if (resp.status !== 200) {
	// 		return resp
	// 	}
	// 	const l = await resp.json() as Limit
	// 	const resp2 = await env.SAVER.fetch("http://localhost:8787/products", {
	// 		method: "PUT",
	// 		body: JSON.stringify({ url, ...l }),
	// 	})
	// 	return new Response(resp.body, resp)
	// },

	async scheduled(controller: ScheduledController, env: Env,): Promise<void> {

	},

	async queue(batch: MessageBatch<CrawleMessage>, env: Env, ctx: ExecutionContext): Promise<void> {
		for (const msg of batch.messages) {
			console.log("process", msg.body)

			if (msg.body.type === "list") {
				const psResp = await env.COLLECTER.fetch("http://localhost:8787/list", {
					method: "POST",
					body: JSON.stringify({ url: msg.body.url }),
				})
				if (psResp.status !== 200) {
					console.error(`(type=list)invalid status ${psResp.status}: POST http://localhost:8787/list`, msg.body.url)
					msg.retry()
					continue
				}

				const ps = await psResp.json() as Product[]
				const insertResp = await env.SAVER.fetch("http://localhost:8787/products", {
					method: "PUT",
					body: JSON.stringify(ps),
				})
				if (insertResp.status !== 200) {
					console.error(`(type=list)invalid status ${insertResp.status}: PUT http://localhost:8787/products`)
					msg.retry()
					continue
				}
				console.log(`(type=list)success save: url=${msg.body.url}`)

				const items: MessageSendRequest<CrawleMessage>[] = []
				for (const p of ps) {
					const itemURL = env.BASE_URL + p.handle
					items.push({
						body: {
							id: p.id,
							type: "item",
							url: itemURL,
						}
					} as MessageSendRequest<CrawleMessage>)
				}
				if (items.length !== 0) {
					console.log(`send batch: ${items.length} items`)
					await env.QUEUE.sendBatch(items)
				}
				console.log(`(type=list)success enqueue: url=${msg.body.url}`)
				msg.ack()
			} else if (msg.body.type === "item") {
				const itemResp = await env.COLLECTER.fetch("http://localhost:8787/item", {
					method: "POST",
					body: JSON.stringify({ url: msg.body.url }),
				})
				if (itemResp.status !== 200) {
					console.error(`(type=item)invalid status ${itemResp.status}: POST http://localhost:8787/item`, msg.body.url)
					msg.retry()
					continue
				}

				const l = await itemResp.json() as Limit
				const updateResp = await env.SAVER.fetch("http://localhost:8787/products", {
					method: "POST",
					body: JSON.stringify({
						id: msg.body.id,
						...l
					} as Itemliimit),
				})
				if (updateResp.status !== 200) {
					console.error(`(type=item)invalid status ${updateResp.status}: POST http://localhost:8787/products, id=${msg.body.id}`)
					msg.retry()
					continue
				}
				console.log(`(type=item)success id=${msg.body.url}`)
				msg.ack()
			}
		}
	}
};

async function process(env: Env, msg: Message<CrawleMessage>) {
	if (msg.body.type === "list") {
		const psResp = await env.COLLECTER.fetch("http://localhost:8787/list", {
			method: "POST",
			body: JSON.stringify({ url: msg.body.url }),
		})
		if (psResp.status !== 200) {
			console.error(psResp)
			return
		}

		const insertResp = await env.SAVER.fetch("http://localhost:8787/products", {
			method: "PUT",
			body: psResp.body,
		})
		if (insertResp.status !== 200) {
			console.error(insertResp)
		}
		msg.ack()
		return
	} else if (msg.body.type === "item") {
		const itemResp = await env.COLLECTER.fetch("http://localhost:8787/item", {
			method: "POST",
			body: JSON.stringify({ url: msg.body.url }),
		})
		if (itemResp.status !== 200) {
			console.error(itemResp)
			return
		}

		const l = await itemResp.json() as Limit
		const updateResp = await env.SAVER.fetch("http://localhost:8787/products", {
			method: "POST",
			body: JSON.stringify({
				id: msg.body.id,
				...l
			} as Itemliimit),
		})
		if (updateResp.status !== 200) {
			console.error(updateResp)
		}
		msg.ack()
		return
	} else {

	}
}
