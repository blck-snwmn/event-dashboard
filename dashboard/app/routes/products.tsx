import { Outlet } from "@remix-run/react";

export default function Home() {
    /* homeの共通処理 */
    return (
        <div className="flex h-screen">
            <nav className="w-56 h-full flex-none bg-slate-400"></nav>
            <div className="flex-1">
                <div className="h-20">header</div>
                <div className="p-4 h-[calc(100%-80px)]">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}