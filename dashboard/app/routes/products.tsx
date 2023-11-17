import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Outlet, useLoaderData, useOutletContext } from "@remix-run/react";
import { useState } from "react";

interface Env {
	SAVER: Fetcher;
}

export const loader = async ({ context, params }: LoaderFunctionArgs) => {
	const env = context.env as Env;
	const resp = await env.SAVER.fetch("http://localhost:8787/tags");
	if (resp.status !== 200) {
		throw new Error("failed to fetch tags");
	}
	const j = (await resp.json()) as Record<string, string[]>;
	return json(j);
};

type SelectedTags = string[];

export default function Home() {
	const results = useLoaderData<typeof loader>();
	const allTags = results["Talent"];
	if (!allTags) {
		throw new Error("failed to fetch tags");
	}
	const [selectedTags, setSelectedTags] = useState<string[]>(allTags);

	const handleTagClick = (tag: string) => {
		if (selectedTags.includes(tag)) {
			setSelectedTags(selectedTags.filter((t) => t !== tag));
		} else {
			setSelectedTags([...selectedTags, tag]);
		}
	};

	const [openGroups, setOpenGroups] = useState<string[]>([
		"Talent",
		"Generation",
	]);
	const handleGroupToggle = (group: string) => {
		if (openGroups.includes(group)) {
			setOpenGroups(openGroups.filter((g) => g !== group));
		} else {
			setOpenGroups([...openGroups, group]);
		}
	};

	const groupedTags: { [key: string]: string[] } = {};
	allTags.forEach((tag) => {
		groupedTags["Talent"] = [...(groupedTags["Talent"] || []), tag];
	});
	/* homeの共通処理 */
	return (
		<div className="flex">
			{/* <div className="w-56 flex-grow">
                <nav className="flex-shrink-0 flex-grow bg-slate-400">
                </nav>
            </div> */}
			<div className="flex flex-col">
				<div className="mb-4 p-4">
					{Object.keys(groupedTags).map((group) => (
						<div key={group}>
							<div onClick={() => handleGroupToggle(group)}>{group}</div>
							<div className="flex flex-row flex-wrap whitespace-nowrap">
								{openGroups.includes(group) &&
									groupedTags[group].map((tag) => (
										<div
											key={tag}
											className={`m-1 p-1 cursor-pointer rounded ${
												selectedTags.includes(tag)
													? "bg-sky-600 text-white"
													: "bg-slate-400"
											}`}
											onClick={() => handleTagClick(tag)}
										>
											{tag}
										</div>
									))}
							</div>
						</div>
					))}
				</div>
				<Outlet context={selectedTags} />
				{/* </div> */}
			</div>
		</div>
	);
}

export function useSelectedTags() {
	return useOutletContext<SelectedTags>();
}
