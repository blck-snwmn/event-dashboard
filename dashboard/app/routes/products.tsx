import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Outlet } from "@remix-run/react";

interface Env {
    SAVER: Fetcher;
}
export const loader = async ({ context, params }: LoaderFunctionArgs) => {
    const env = context.env as Env;
    const resp = await env.SAVER.fetch("http://localhost:8787/tags")
    if (resp.status !== 200) {
        throw new Error("failed to fetch tags");
    }
    const j = await resp.json() as Record<string, string[]>;
    console.log(j);
    return json(j);
};

export default function Home() {
    // const results = useLoaderData<typeof loader>();
    // const talentOptions = results["Talent"].map((t) => ({ value: t, label: t }))
    // const generationOptions = results["Generation"].map((t) => ({ value: t, label: t }))
    // const groupOptions = results["Group"].map((t) => ({ value: t, label: t }))

    /* homeの共通処理 */
    return (
        <div className="flex">
            {/* <div className="w-56 flex-grow">
                <nav className="flex-shrink-0 flex-grow bg-slate-400">
                </nav>
            </div> */}
            <div className="flex flex-col">
                {/* <div className="flex flex-col p-5">
                    <div>
                        <label>Talent</label>
                        <Select options={talentOptions} isMulti={true} />
                    </div>
                    <div>
                        <label>Generation</label>
                        <Select options={generationOptions} isMulti={true} />
                    </div>
                    <div>
                        <label>Group</label>
                        <Select options={groupOptions} isMulti={true} />
                    </div>
                </div> */}
                {/* <div className="p-4 h-[calc(100%-80px)]"> */}
                <Outlet />
                {/* </div> */}
            </div>
        </div>
    );
}