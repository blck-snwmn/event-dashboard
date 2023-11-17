import {
	integer,
	primaryKey,
	sqliteTable,
	text,
	uniqueIndex,
	index,
} from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

export const products = sqliteTable(
	"products",
	{
		id: integer("id").primaryKey(),
		title: text("title").notNull(),
		handle: text("handle").notNull(),
		vendor: text("vendor").notNull(),
		start: integer("start", { mode: "timestamp_ms" }),
		end: integer("end", { mode: "timestamp_ms" }),
	},
	(t) => ({
		startIdx: index("period_idx").on(t.start, t.end),
		endStartIndex: index("end_starts_idx").on(t.end, t.start),
	}),
);

export const productsRelations = relations(products, ({ many }) => ({
	productsToTags: many(productsToTags),
}));

export const tags = sqliteTable(
	"tags",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		name: text("name").notNull(),
	},
	(t) => ({
		uniqueName: uniqueIndex("name_idx").on(t.name),
	}),
);

export const tagsRelations = relations(tags, ({ many }) => ({
	productsToTags: many(productsToTags),
}));

export const productsToTags = sqliteTable(
	"products_to_tags",
	{
		productId: integer("product_id")
			.notNull()
			.references(() => products.id),
		tagId: integer("tag_id")
			.notNull()
			.references(() => tags.id),
	},
	(t) => ({
		pk: primaryKey(t.productId, t.tagId),
	}),
);

export const productsToTagsRelations = relations(productsToTags, ({ one }) => ({
	product: one(products, {
		fields: [productsToTags.productId],
		references: [products.id],
	}),
	tag: one(tags, {
		fields: [productsToTags.tagId],
		references: [tags.id],
	}),
}));
