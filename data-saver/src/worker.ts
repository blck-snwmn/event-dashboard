import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { products, productsToTags, tags } from './db/product';
import * as schema from './db/product';
import { Product, Itemliimit, ProductWithLimit } from "dash-message/message"
import { and, asc, desc, eq, gt, gte, inArray, lt } from 'drizzle-orm';

type Bindings = {
	DB: D1Database;
}
type Variables = {
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>()

// app.delete('/', async (c) => {
// 	const db = drizzle(c.env.DB, { schema });
// 	await db.delete(productsToTags).execute()
// 	await db.delete(tags).execute()
// 	await db.delete(products).execute()

// 	return c.text("ok")
// })

app.get('/tags', async (c) => {
	const db = drizzle(c.env.DB, { schema });
	const rows = await db.select().from(tags).orderBy(tags.name).all();

	const tagGroups: Record<string, string[]> = {
		Talent: [],
		Generation: [],
		Group: [],
	}
	for (const row of rows) {
		for (const key in tagGroups) {
			if (row.name.startsWith(key)) {
				tagGroups[key].push(row.name.replace(key + "_", ""))
				break
			}
		}
	}
	return c.json(tagGroups)
})

app.get('/products/endingsoon', async (c) => {
	const now = new Date()
	const monthAgo = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

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
		.leftJoin(tags, eq(productsToTags.tagId, tags.id))
		.where(and(gte(products.end, now), lt(products.end, monthAgo)))
		.orderBy(asc(products.end))
		.all();

	const results = rows.reduce<ProductWithLimit[]>((acc, row) => {
		const last = acc.length > 0 ? acc[acc.length - 1] : null
		if (last && last.id === row.id) {
			if (row.tagName) {
				last.tags.push(row.tagName)
			}
			return acc
		}

		acc.push({
			id: row.id,
			title: row.title,
			handle: row.handle,
			vendor: row.vendor,
			tags: row.tagName ? [row.tagName] : [],
			startDate: row.start ? new Date(row.start).toISOString() : null,
			endDate: row.end ? new Date(row.end).toISOString() : null,
		})
		return acc
	}, [])

	return c.json(results)
})

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
		.leftJoin(tags, eq(productsToTags.tagId, tags.id))
		.orderBy(desc(products.id))
		.all();

	const results = rows.reduce<ProductWithLimit[]>((acc, row) => {
		const last = acc.length > 0 ? acc[acc.length - 1] : null
		if (last && last.id === row.id) {
			if (row.tagName) {
				last.tags.push(row.tagName)
			}
			return acc
		}

		acc.push({
			id: row.id,
			title: row.title,
			handle: row.handle,
			vendor: row.vendor,
			tags: row.tagName ? [row.tagName] : [],
			startDate: row.start ? new Date(row.start).toISOString() : null,
			endDate: row.end ? new Date(row.end).toISOString() : null,
		})
		return acc
	}, [])

	return c.json(results)
})

app.post('/products', async (c) => {
	const ps: Product[] = await c.req.json()
	console.info(`products: ${ps.length}`)

	const db = drizzle(c.env.DB, { schema });

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
	console.info(`insertProducts: ${insertProducts.length}`)

	type productType = typeof products.$inferInsert
	let insertedId: productType[] = []
	try {
		insertedId = await db.insert(products)
			.values(insertProducts)
			// ignore if same id exists
			.onConflictDoNothing()
			.returning()

		console.info("[products]result:", insertedId, insertedId.length)

		// save all tags 
		// each 50 items
		const count = 50
		for (let i = 0; i < insertTags.length; i += count) {
			const resultTags = await db.insert(tags)
				.values(insertTags.slice(i, i + count))
				.onConflictDoNothing()
				.execute()

			console.info("[tags]result:", resultTags.meta)
		}
		console.info("[tags]result:", insertTags.length)
	} catch (e) {
		console.error(e)
		throw e
	}

	console.info("save all products to tags")

	// save all products to tags
	const insertProductsToTags: { productId: number, tagId: number }[] = []
	for (const p of ps) {

		const savedTags = await db.select().from(tags).where(inArray(tags.name, p.tags)).execute()
		savedTags.forEach(t => {
			insertProductsToTags.push({
				productId: p.id,
				tagId: t.id,
			})
		})
	}
	console.info(`insertProductsToTags: ${insertProductsToTags.length}`)

	try {
		// Save 50 items at a time.
		const count = 50
		for (let i = 0; i < insertProductsToTags.length; i += count) {
			const result = await db.insert(productsToTags)
				.values(insertProductsToTags.slice(i, i + count))
				.onConflictDoNothing()
				.execute()

			console.info("result:", result.meta)
		}
	} catch (e) {
		console.error(e)
		throw e
	}

	console.info("done")

	return c.json(insertedId, { status: 200 })
})

app.put('/products', async (c) => {
	console.info("post /products")
	const limit: Itemliimit = await c.req.json()

	console.info("limit:", limit)

	const db = drizzle(c.env.DB);

	try {
		const result = await db.
			update(products)
			.set({
				start: strToDate(limit.startDate),
				end: strToDate(limit.endDate),
			})
			.where(eq(products.id, limit.id))
			.execute()
		// .returning();

		console.info("result:", result.meta)
		return c.json(result.meta)
	} catch (e) {
		console.error(e)
		throw e
	}
})

function strToDate(date: string | null) {
	if (!date) {
		return null
	}
	return new Date(date)
}

export default app