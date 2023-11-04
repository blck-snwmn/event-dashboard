import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Outlet, useLoaderData } from "@remix-run/react";
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
    const results = useLoaderData<typeof loader>();
    /* homeの共通処理 */
    return (
        <div className="flex">
            {/* <div className="w-56 flex-grow">
                <nav className="flex-shrink-0 flex-grow bg-slate-400">
                </nav>
            </div> */}
            <div className="flex flex-col">
                <div className="flex flex-col whitespace-nowrap">
                    <div className="flex flex-row flex-wrap">
                        {results["Talent"].map((t, i) => (<div key={i}>{t}</div>))}
                    </div>
                    <div className="flex flex-row flex-wrap">
                        {results["Generation"].map((t, i) => (<div key={i}>{t}</div>))}
                    </div>
                    <div className="flex flex-row flex-wrap">
                        {results["Group"].map((t, i) => (<div key={i}>{t}</div>))}
                    </div>
                </div>
                {/* <div className="p-4 h-[calc(100%-80px)]"> */}
                <Outlet />
                {/* </div> */}
            </div>
        </div>
    );
}