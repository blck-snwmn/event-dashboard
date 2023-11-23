import { ProductWithLimit } from "dash-message/message";
import { afterAll, beforeAll, describe, expect, it, test } from "vitest";
import { unstable_dev } from "wrangler";
import type { UnstableDevWorker } from "wrangler";
import { products } from "./db/product";
import app from "./worker";

function getRandomInt(max: number) {
	return Math.floor(Math.random() * max);
}

describe("Wrangler", () => {
	let worker: UnstableDevWorker;

	beforeAll(async () => {
		worker = await unstable_dev("./src/worker.ts", {
			vars: {
				NAME: "Cloudflare",
			},
			experimental: {
				disableExperimentalWarning: true,
				d1Databases: [
					{
						binding: "DB",
						database_id: "befe6c27-61d8-4d3a-a353-99f6ea9cdb9f",
						database_name: "event-products",
					},
				],
			},
		});

		const res = await worker.fetch("/products", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify([
				{
					id: 1,
					title: "Product 1",
					handle: "product-1",
					vendor: "Vendor 1",
					tags: ["tag1", "tag2"],
				},
				{
					id: 2,
					title: "Product 2",
					handle: "product-2",
					vendor: "Vendor 2",
					tags: ["tag2", "tag4"],
				},
				{
					id: 3,
					title: "Product 3",
					handle: "product-3",
					vendor: "Vendor 3",
					tags: ["tag5", "tag6", "Talent_t1", "Talent_t2"],
				},
				{
					id: 4,
					title: "Product 4",
					handle: "product-4",
					vendor: "Vendor 4",
					tags: [
						"tag7",
						"tag8",
						"Talent_t1",
						"Talent_t3",
						"Generation_g1",
						"Group_gg1",
					],
				},
				{
					id: 5,
					title: "Product 5",
					handle: "product-5",
					vendor: "Vendor 5",
					tags: ["tag9", "tag10"],
				},
			]),
		});
		expect(res.status).toBe(200);

		{
			const putResp = await worker.fetch("/products", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: 1,
					startDate: "2023-12-01T09:00:00.000Z",
					endDate: "2023-12-10T09:00:00.000Z",
				}),
			});
			expect(putResp.status).toBe(200);
		}
		{
			const putResp = await worker.fetch("/products", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: 2,
					startDate: "2023-12-03T09:00:00.000Z",
					endDate: "2023-12-04T09:00:00.000Z",
				}),
			});
			expect(putResp.status).toBe(200);
		}
	});

	afterAll(async () => {
		await worker.stop();
	});

	it("POST inserted producs, return 0 lenght", async () => {
		const res = await worker.fetch("/products", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify([
				{
					id: 1,
					title: "Product 1",
					handle: "product-1",
					vendor: "Vendor 1",
					tags: ["tag1", "tag2"],
				},
				{
					id: 2,
					title: "Product 2",
					handle: "product-2",
					vendor: "Vendor 2",
					tags: ["tag2", "tag4"],
				},
			]),
		});
		expect(res.status).toBe(200);

		type productType = typeof products.$inferInsert;
		const respJson = (await res.json()) as productType[];

		expect(respJson.length).toBe(0);
	});

	it("POST producs(no exists), return inserted products", async () => {
		const id1 = getRandomInt(10000000000);
		const id2 = getRandomInt(10000000000);

		const res = await worker.fetch("/products", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify([
				{
					id: id1,
					title: "Product random 1",
					handle: "product-random-1",
					vendor: "Vendor random 1",
					tags: ["tag1", "tag2"],
				},
				{
					id: id2,
					title: "Product random 2",
					handle: "product-random-2",
					vendor: "Vendor random 2",
					tags: ["tag2", "tag4"],
				},
			]),
		});
		expect(res.status).toBe(200);

		type productType = typeof products.$inferInsert;
		const respJson = (await res.json()) as productType[];

		expect(respJson.length).toBe(2);

		const resp1 = respJson[0];
		expect(resp1.id).toBe(id1);
		expect(resp1.title).toBe("Product random 1");
		expect(resp1.handle).toBe("product-random-1");
		expect(resp1.vendor).toBe("Vendor random 1");

		const resp2 = respJson[1];
		expect(resp2.id).toBe(id2);
		expect(resp2.title).toBe("Product random 2");
		expect(resp2.handle).toBe("product-random-2");
		expect(resp2.vendor).toBe("Vendor random 2");
	});

	it("PUT producs, return updated products", async () => {
		const res = await worker.fetch("/products", {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				id: 5,
				start: "2023-12-01T09:00:00.000Z",
				end: "2023-12-10T09:00:00.000Z",
			}),
		});
		expect(res.status).toBe(200);
	});

	it("GET producs, return all products", async () => {
		const res = await worker.fetch("/products");
		expect(res.status).toBe(200);

		const respJson = (await res.json()) as ProductWithLimit[];

		expect(respJson.length).toBeGreaterThanOrEqual(5);

		const product1 = respJson.find((p) => p.id === 1);
		expect(product1).not.undefined;

		expect(product1).toStrictEqual({
			id: 1,
			title: "Product 1",
			handle: "product-1",
			vendor: "Vendor 1",
			startDate: "2023-12-01T09:00:00.000Z",
			endDate: "2023-12-10T09:00:00.000Z",
			tags: ["tag1", "tag2"],
		});

		const product2 = respJson.find((p) => p.id === 2);
		expect(product2).not.undefined;
		expect(product2).toStrictEqual({
			id: 2,
			title: "Product 2",
			handle: "product-2",
			vendor: "Vendor 2",
			startDate: "2023-12-03T09:00:00.000Z",
			endDate: "2023-12-04T09:00:00.000Z",
			tags: ["tag2", "tag4"],
		});

		// sort check
		expect(product1).toBe(respJson[respJson.length - 1]);
		expect(product2).toBe(respJson[respJson.length - 2]);
	});

	it("GET tags, return tags", async () => {
		const res = await worker.fetch("/tags");
		expect(res.status).toBe(200);

		const respJson = (await res.json()) as Record<string, string[]>;
		expect(respJson.Talent).not.undefined;
		expect(respJson.Generation).not.undefined;
		expect(respJson.Group).not.undefined;

		expect(respJson.Talent).toStrictEqual(["t1", "t2", "t3"]);
		expect(respJson.Generation).toStrictEqual(["g1"]);
		expect(respJson.Group).toStrictEqual(["gg1"]);
	});
});
