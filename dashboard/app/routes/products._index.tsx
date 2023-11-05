import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import type { ProductWithLimit } from "dash-message/message"
import { useState } from "react";

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
  const results = useLoaderData<typeof loader>();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <Products products={results} />
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
        <div key={i} className="table-cell p-1 border border-slate-300">{v}</div>
      ))}
      {/* <Tags ts={props.p.tags} /> */}
    </div>
  );
}

function Products(props: { products: ProductWithLimit[] }) {
  const data = props.products
  const allTags = Array.from(new Set(data.flatMap(item => item.tags).filter(tag => tag.startsWith("Talent_"))));

  const [selectedTags, setSelectedTags] = useState<string[]>(allTags);
  const [openGroups, setOpenGroups] = useState<string[]>(["Talent", "Generation"]);

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleGroupToggle = (group: string) => {
    if (openGroups.includes(group)) {
      setOpenGroups(openGroups.filter(g => g !== group));
    } else {
      setOpenGroups([...openGroups, group]);
    }
  };

  const groupedTags: { [key: string]: string[] } = {};
  allTags.forEach(tag => {
    if (tag.startsWith("Talent_")) {
      groupedTags["Talent"] = [...(groupedTags["Talent"] || []), tag];
    } else if (tag.startsWith("Generation_")) {
      groupedTags["Generation"] = [...(groupedTags["Generation"] || []), tag];
    }
  });

  const filteredData = data.filter(item => item.tags.some(tag => selectedTags.includes(tag)));

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
    <>
      <div className="mb-4">
        {Object.keys(groupedTags).map(group => (
          <div key={group}>
            <div onClick={() => handleGroupToggle(group)}>{group}</div>
            <div className="flex flex-row flex-wrap whitespace-nowrap">
              {openGroups.includes(group) && groupedTags[group].map(tag => (
                <div
                  key={tag}
                  className={`m-1 p-1 cursor-pointer rounded ${selectedTags.includes(tag) ? "bg-sky-600 text-white" : "bg-slate-400"}`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="table w-full relative border-collapse">
        <div className="sticky top-0 bg-cyan-200 table-header-group">
          <div className="table-row">
            {headers.map((h, i) => (
              <div key={i} className="table-cell p-1 text-left border border-slate-300">{h}</div>
            ))}
          </div>
        </div>
        <div className="table-row-group">
          {filteredData.map((p) => (
            <Product key={p.id} p={p} />
          ))}
        </div>
      </div>
    </>
  );
}
