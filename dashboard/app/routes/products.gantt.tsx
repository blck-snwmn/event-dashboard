import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import type { ProductWithLimit } from "dash-message/message"

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
    const resp = await env.SAVER.fetch("http://localhost:8787/products")
    const j = await resp.json() as ProductWithLimit[];
    return json(j);
};

export default function Index() {
    // const results = useLoaderData<typeof loader>();
    return (
        <GanttChart />
    );
}

type ProductData = {
    name: string;
    startDate: string;
    endDate: string;
};

const sampleData: ProductData[] = [
    { name: "商品A", startDate: "2023-10-01", endDate: "2023-11-31" },
    { name: "商品B", startDate: "2023-10-20", endDate: "2023-10-25" },
    // ... その他のデータ
];


const cellHeight = "30px";
const cellWidth = "40px";

const GanttChart: React.FC = () => {
    const today = new Date();
    const chartStartDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10);
    const chartEndDate = new Date(chartStartDate.getTime() + (45 * 24 * 60 * 60 * 1000));

    // 表示期間内の日付を取得
    const dateHeaders: Date[] = [];
    for (let d = new Date(chartStartDate); d <= chartEndDate; d.setDate(d.getDate() + 1)) {
        dateHeaders.push(new Date(d));
    }

    return (
        <div className="overflow-auto">
            <div className="flex">
                <div style={{ width: cellWidth, height: cellHeight }} className="text-center font-bold border-r">商品</div>
                <div className="flex">
                    {dateHeaders.map((date, index) => (
                        <div key={index} style={{ width: cellWidth, height: cellHeight }} className="text-center border-r">{date.getDate()}</div>
                    ))}
                </div>
            </div>
            {sampleData.map((item, index) => (
                <GanttRow key={index} data={item} chartStartDate={chartStartDate} chartEndDate={chartEndDate} />
            ))}
            {/* Empty rows for grid */}
            {Array.from({ length: dateHeaders.length }).map((_, idx) => (
                <EmptyRow key={idx} dateHeaders={dateHeaders} />
            ))}
        </div>
    );
};

type GanttRowProps = {
    data: ProductData;
    chartStartDate: Date;
    chartEndDate: Date;
};

const GanttRow: React.FC<GanttRowProps> = ({ data, chartStartDate, chartEndDate }) => {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    const startOffset = (startDate.getTime() - chartStartDate.getTime()) / (24 * 60 * 60 * 1000);
    const duration = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000) + 1;

    const barPosition = startOffset * parseFloat(cellWidth);
    const barWidth = duration * parseFloat(cellWidth);
    const barHeight = parseFloat(cellHeight) / 2;

    return (
        <div className="flex items-end" style={{ height: cellHeight }}>
            <span style={{ width: cellWidth, height: cellHeight }} className="border-r">{data.name}</span>
            <div className="flex relative w-full" style={{ height: cellHeight }}>
                <div
                    style={{ left: `${barPosition}px`, width: `${barWidth}px`, height: `${barHeight}px` }}
                    className="absolute bg-blue-500 bottom-0"
                ></div>
                {Array.from({ length: (chartEndDate.getTime() - chartStartDate.getTime()) / (24 * 60 * 60 * 1000) + 1 }).map((_, idx) => (
                    <div key={idx} style={{ width: cellWidth }} className="border-r h-full"></div>
                ))}
            </div>
        </div>
    );
};
type EmptyRowProps = {
    dateHeaders: Date[];
};

const EmptyRow: React.FC<EmptyRowProps> = ({ dateHeaders }) => (
    <div className="flex items-center" style={{ height: cellHeight }}>
        <div style={{ width: cellWidth }} className="border-r"></div>
        <div className="flex w-full">
            {dateHeaders.map((_, idx) => (
                <div key={idx} style={{ width: cellWidth }} className="border-r h-full"></div>
            ))}
        </div>
    </div>
);