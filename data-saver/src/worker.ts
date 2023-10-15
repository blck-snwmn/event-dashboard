import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { products, productsToTags, tags } from './db/product';
import * as schema from './db/product';
import { eq } from 'drizzle-orm';

interface Product {
	id: number;
	title: string;
	handle: string;
	vendor: string;
	tags: string[];
}

interface Limit {
	startDate: Date | null;
	endDate: Date | null;
}

type Bindings = {
	DB: D1Database;
}
type Variables = {
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>()

app.get('/products', async (c) => {
	const db = drizzle(c.env.DB, { schema });
	const results = await db.select().from(products).all();
	console.log(results)
	return c.json(results)
})

app.put('/products', async (c) => {
	const ps: Product[] = await c.req.json()
	console.log(ps)
	const db = drizzle(c.env.DB, { schema });

	type newProducs = typeof products.$inferInsert;
	type newTags = typeof tags.$inferInsert;
	type newProductsToTags = typeof productsToTags.$inferInsert;

	// save all products
	const insertProducts = []
	const insertTags: { name: string }[] = []


	for (const p of ps) {
		insertProducts.push({
			id: p.id,
			title: p.title,
			handle: p.handle,
			vendor: p.vendor,
		})
		for (const tag of p.tags) {
			if (insertTags.find(t => t.name === tag)) {
				continue
			}
			insertTags.push({
				name: tag
			})
		}
	}
	await db.insert(products)
		.values(insertProducts)
		// ignore if same id exists
		.onConflictDoNothing()
		.execute()

	// save all tags
	await db.insert(tags)
		.values(insertTags)
		.onConflictDoNothing()
		.execute()

	// save all products to tags
	const insertProductsToTags: { productId: number, tagId: number }[] = []
	for (const p of ps) {
		for (const tag of p.tags) {
			const savedTag = await db.query.tags.findFirst({
				where: eq(tags.name, tag)
			})
			if (!savedTag) {
				throw new Error("tag not found")
			}
			insertProductsToTags.push({
				productId: p.id,
				tagId: savedTag.id,
			})
		}
	}

	await db.insert(productsToTags)
		.values(insertProductsToTags)
		.onConflictDoNothing()
		.execute()

	return c.text("ok")
})

app.post('/products', async (c) => {
	const db = drizzle(c.env.DB);
	const results = db.select().from(products).all();
	return c.json(results)
})

export default app