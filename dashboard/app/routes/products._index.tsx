import {
	type LoaderFunctionArgs,
	type MetaFunction,
	json,
} from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import type { ProductWithLimit } from "dash-message/message";
import { useSelectedTags } from "./products";

interface Env {
	SAVER: Fetcher;
}

export const meta: MetaFunction = () => {
	return [
		{ title: "Dashboard" },
		{ name: "description", content: "dashboard" },
	];
};

export const loader = async ({ context, params }: LoaderFunctionArgs) => {
	const env = context.env as Env;
	const resp = await env.SAVER.fetch("http://localhost:8787/products");
	const j = (await resp.json()) as ProductWithLimit[];
	return json(j);
};

export default function Index() {
	const selected = useSelectedTags();

	const results = useLoaderData<typeof loader>();
	return (
		<div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
			<Products products={results} selectedTags={selected} />
		</div>
	);
}

// function Tags(props: { ts: string[] }) {
//   return (
//     <div className="table-cell p-1 border border-slate-300 overflow-y-auto">
//       <div className="h-0">
//         {props.ts.map((t) => (
//           <div key={t}>{t}</div>
//         ))}
//       </div>
//     </div>
//   );
// }

function Product(props: { p: ProductWithLimit }) {
	const values = [
		props.p.id,
		props.p.title,
		props.p.vendor,
		props.p.handle,
		props.p.startDate,
		props.p.endDate,
	];

	return (
		<div className="table-row p-5">
			{values.map((v, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: show elements in a table
				<div key={i} className="table-cell p-1 border border-slate-300">
					{v}
				</div>
			))}
			{/* <Tags ts={props.p.tags} /> */}
		</div>
	);
}

function Products(props: {
	products: ProductWithLimit[];
	selectedTags: string[];
}) {
	const data = props.products;
	const selectedTags = props.selectedTags;

	const filteredData = data.filter((item) =>
		item.tags.some((tag) => selectedTags.includes(tag.replace("Talent_", ""))),
	);

	const headers = [
		"ID",
		"Title",
		"Vendor",
		"Handle",
		"Start",
		"End",
		// "Tag",
	];
	return (
		<div>
			<div>Products</div>
			<div className="table w-full relative border-collapse">
				<div className="sticky top-0 bg-cyan-200 table-header-group">
					<div className="table-row">
						{headers.map((h, i) => (
							<div
								key={h}
								className="table-cell p-1 text-left border border-slate-300"
							>
								{h}
							</div>
						))}
					</div>
				</div>
				<div className="table-row-group">
					{filteredData.map((p) => (
						<Product key={p.id} p={p} />
					))}
				</div>
			</div>
		</div>
	);
}
