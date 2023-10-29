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
    { name: "商品A", startDate: "2023-10-01", endDate: "2023-11-30" },
    { name: "商品B", startDate: "2023-10-20", endDate: "2023-10-25" },
    { name: "商品C", startDate: "2023-10-20", endDate: "2023-12-10" },
    // ... その他のデータ
];

const productNameWidth = "100px"; // 商品名のセルの幅を定義
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

    const monthHeaders: { month: number, year: number, days: number }[] = [];
    dateHeaders.forEach((date, index) => {
        const lastItem = monthHeaders[monthHeaders.length - 1];
        if (lastItem && lastItem.month === date.getMonth() && lastItem.year === date.getFullYear()) {
            lastItem.days++;
        } else {
            monthHeaders.push({ month: date.getMonth(), year: date.getFullYear(), days: 1 });
        }
    });

    return (
        <div className="overflow-auto">
            <div className="flex">
                <div style={{ width: productNameWidth }} className="text-center font-bold border-r border-b border-gray-400"></div> {/* 商品名の部分は空白 */}
                <div className="flex">
                    {monthHeaders.map((header, index) => (
                        <div key={index} style={{ width: `${parseFloat(cellWidth) * header.days}px`, height: cellHeight }} className="text-center font-bold border-r border-b bg-gray-300">
                            {header.year}年{header.month + 1}月
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex">
                <div style={{ width: productNameWidth, height: cellHeight }} className="text-center font-bold border-r border-b border-gray-400">商品</div>
                <div className="flex">
                    {dateHeaders.map((date, index) => (
                        <div key={index} style={{ width: cellWidth, height: cellHeight }} className={`text-center border-r border-b ${isToday(date) ? "bg-yellow-200" : "bg-gray-300"}`}>{date.getDate()}</div>
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

    let startOffset = (startDate.getTime() - chartStartDate.getTime()) / (24 * 60 * 60 * 1000);
    let endOffset = (endDate.getTime() - chartStartDate.getTime()) / (24 * 60 * 60 * 1000);

    // adjust offset If the start date is outside the display range.
    if (startOffset < 0) {
        startOffset = 0;
    }

    // adjust offset If the end date is outside the display range.
    const maxOffset = (chartEndDate.getTime() - chartStartDate.getTime()) / (24 * 60 * 60 * 1000);
    if (endOffset > maxOffset) {
        endOffset = maxOffset;
    }

    const duration = (endOffset - startOffset) + 1;
    const barPosition = startOffset * parseFloat(cellWidth);
    const barWidth = duration * parseFloat(cellWidth);
    const barHeight = parseFloat(cellHeight) / 2;

    return (
        <div className="flex items-end" style={{ height: cellHeight }}>
            <span style={{ width: productNameWidth, height: cellHeight }} className="border-r border-b border-gray-400">{data.name}</span>
            <div className="flex relative" style={{ height: cellHeight }}>
                <div
                    style={{ left: `${barPosition}px`, width: `${barWidth}px`, height: `${barHeight}px` }}
                    className="absolute bg-blue-500 bottom-0"
                ></div>
                {Array.from({ length: (chartEndDate.getTime() - chartStartDate.getTime()) / (24 * 60 * 60 * 1000) + 1 }).map((_, idx) => (
                    <div key={idx} style={{ width: cellWidth }} className={`border-r border-b h-full ${isToday(new Date(chartStartDate.getTime() + idx * (24 * 60 * 60 * 1000))) ? "bg-yellow-200" : ""}`}></div>
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
        <div style={{ width: productNameWidth }} className="border-r"></div>
        <div className="flex w-full">
            {dateHeaders.map((_, idx) => (
                <div key={idx} style={{ width: cellWidth }} className="border-r h-full"></div>
            ))}
        </div>
    </div>
);

const isToday = (date: Date) => {
    const today = new Date();
    return today.getDate() === date.getDate() && today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear();
};