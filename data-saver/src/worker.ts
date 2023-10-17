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
	const rows = await db
		.select({
			// There is a shift in column values, possibly due to the presence of columns with the same name.
			// To avoid this, use `select` to specify the field name.
			id: products.id,
			title: products.title,
			handle: products.handle,
			vendor: products.vendor,
			start: products.start,
			end: products.end,
			tagName: tags.name
		})
		.from(products)
		.leftJoin(productsToTags, eq(products.id, productsToTags.productId))
		.leftJoin(tags, eq(productsToTags.tagId, tags.id)).all();

	type productType = typeof products.$inferSelect

	const results = rows.reduce<Record<number, { product: productType; tags: string[] }>>((acc, row) => {

		if (!acc[row.id]) {
			acc[row.id] = {
				product: {
					id: row.id,
					title: row.title,
					handle: row.handle,
					vendor: row.vendor,
					start: row.start,
					end: row.end,
				}, tags: []
			}
		}
		if (row.tagName) {
			acc[row.id].tags.push(row.tagName)
		}

		return acc
	}, {})
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
	const limit: { id: number } & Limit = await c.req.json()

	const db = drizzle(c.env.DB);
	const result = await db.
		update(products)
		.set({
			start: strToDate(limit.startDate),
			end: strToDate(limit.endDate),
		})
		.where(eq(products.id, limit.id))
		.execute()
	// .returning();

	return c.json(result.meta)
})

function strToDate(date: string | null) {
	if (!date) {
		return null
	}
	return new Date(date)
}

export default app