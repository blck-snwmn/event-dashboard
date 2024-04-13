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
	const filteredData = results.filter((p) =>
		p.tags.some((t) => selected.includes(t.replace("Talent_", ""))),
	);
	return (
		<GanttChart
			data={filteredData.map((p) => ({
				name: p.title,
				startDate: p.startDate,
				endDate: p.endDate,
			}))}
		/>
	);
}

type ProductData = {
	name: string;
	startDate: string | null;
	endDate: string | null;
};

const productNameWidth = "600px"; // 商品名のセルの幅を定義
const cellHeight = "30px";
const cellWidth = "40px";
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

const GanttChart: React.FC<{ data: ProductData[] }> = ({
	data,
}: { data: ProductData[] }) => {
	const today = new Date();
	const chartStartDate = new Date(
		today.getFullYear(),
		today.getMonth(),
		today.getDate() - 10,
	);
	const chartEndDate = new Date(chartStartDate.getTime() + 45 * ONE_DAY_IN_MS);

	// 表示期間内の日付を取得
	const dateHeaders: Date[] = [];
	for (
		let d = new Date(chartStartDate);
		d <= chartEndDate;
		d.setDate(d.getDate() + 1)
	) {
		dateHeaders.push(new Date(d));
	}

	const monthHeaders: { month: number; year: number; days: number }[] = [];
	for (const date of dateHeaders) {
		const lastItem = monthHeaders[monthHeaders.length - 1];
		if (
			lastItem &&
			lastItem.month === date.getMonth() &&
			lastItem.year === date.getFullYear()
		) {
			lastItem.days++;
		} else {
			monthHeaders.push({
				month: date.getMonth(),
				year: date.getFullYear(),
				days: 1,
			});
		}
	}

	return (
		<>
			<div>Gantt</div>
			<div className="flex">
				{/* 商品名の列 */}
				<div className="flex flex-col items-center justify-start border-r border-gray-400 sticky left-0 z-10">
					<div
						style={{ width: productNameWidth, height: cellHeight }}
						className="text-center font-bold bg-gray-300"
					/>
					<div
						style={{ width: productNameWidth, height: cellHeight }}
						className="text-center font-bold border-b bg-gray-300"
					>
						商品
					</div>
					{data.map((item, index) => (
						<span
							key={item.name}
							style={{ width: productNameWidth, height: cellHeight }}
							className="border-b bg-white"
						>
							{item.name}
						</span>
					))}
				</div>

				{/* ガントチャート部分 */}
				<div
					className="overflow-x-auto"
					style={{ width: `calc(99vw - ${productNameWidth})` }}
				>
					<div>
						{/* 月と年のヘッダー */}
						<div className="flex">
							{monthHeaders.map((header) => (
								<div
									key={`${header.year}-${header.month}-${header.days}`}
									style={{
										width: `${Number.parseFloat(cellWidth) * header.days}px`,
										height: cellHeight,
									}}
									className="text-center font-bold border-r border-b bg-gray-300 flex-shrink-0"
								>
									{header.year}年{header.month + 1}月
								</div>
							))}
						</div>

						{/* 日付のヘッダー */}
						<div className="flex">
							{dateHeaders.map((date, index) => (
								<div
									key={date.getTime()}
									style={{ width: cellWidth, height: cellHeight }}
									className={`text-center border-r border-b ${
										isToday(date) ? "bg-yellow-200" : "bg-gray-300"
									} flex-shrink-0`}
								>
									{date.getDate()}
								</div>
							))}
						</div>

						{/* ガントチャートの行 */}
						{data.map((item, index) => (
							<GanttRow
								key={item.name}
								data={item}
								chartStartDate={chartStartDate}
								chartEndDate={chartEndDate}
							/>
						))}
					</div>
				</div>
			</div>
		</>
	);
};

type GanttRowProps = {
	data: ProductData;
	chartStartDate: Date;
	chartEndDate: Date;
};

const GanttRow: React.FC<GanttRowProps> = ({
	data,
	chartStartDate,
	chartEndDate,
}) => {
	if (!data.startDate) {
		return (
			<div className="flex items-end" style={{ height: cellHeight }}>
				<div className="flex relative" style={{ height: cellHeight }}>
					{Array.from({
						length:
							(chartEndDate.getTime() - chartStartDate.getTime()) /
								(24 * 60 * 60 * 1000) +
							1,
					}).map((_, idx) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: This array is used to create tables.
							key={idx}
							style={{ width: cellWidth }}
							className="border-r border-b h-full"
						/>
					))}
				</div>
			</div>
		);
	}

	const startDate = new Date(data.startDate);
	startDate.setHours(0, 0, 0, 0);
	const endDate = data.endDate ? new Date(data.endDate) : chartEndDate;
	endDate.setHours(0, 0, 0, 0);

	let startOffset =
		(startDate.getTime() - chartStartDate.getTime()) / ONE_DAY_IN_MS;
	let endOffset =
		(endDate.getTime() - chartStartDate.getTime()) / ONE_DAY_IN_MS;

	// adjust offset If the start date is outside the display range.
	if (startOffset < 0) {
		startOffset = 0;
	}

	// adjust offset If the end date is outside the display range.
	const maxOffset =
		(chartEndDate.getTime() - chartStartDate.getTime()) / ONE_DAY_IN_MS;
	if (endOffset > maxOffset) {
		endOffset = maxOffset;
	}

	const duration = endOffset - startOffset + 1;
	const barPosition = startOffset * Number.parseFloat(cellWidth);
	const barWidth = duration * Number.parseFloat(cellWidth);
	const barHeight = Number.parseFloat(cellHeight) / 2;

	return (
		<div className="flex items-end" style={{ height: cellHeight }}>
			<div className="flex relative" style={{ height: cellHeight }}>
				<div
					style={{
						left: `${barPosition}px`,
						width: `${barWidth}px`,
						height: `${barHeight}px`,
					}}
					className="absolute bg-blue-400 bottom-0"
				/>
				{Array.from({
					length:
						(chartEndDate.getTime() - chartStartDate.getTime()) /
							ONE_DAY_IN_MS +
						1,
				}).map((_, idx) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: This array is used to create tables.
						key={idx}
						style={{ width: cellWidth }}
						className={`border-r border-b h-full ${
							isToday(new Date(chartStartDate.getTime() + idx * ONE_DAY_IN_MS))
								? "bg-yellow-200"
								: ""
						}`}
					/>
				))}
			</div>
		</div>
	);
};

const isToday = (date: Date) => {
	const today = new Date();
	return (
		today.getDate() === date.getDate() &&
		today.getMonth() === date.getMonth() &&
		today.getFullYear() === date.getFullYear()
	);
};
