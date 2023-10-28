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
  const results = useLoaderData<typeof loader>();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <Products products={results} />
    </div>
  );
}

function Tags(props: { ts: string[] }) {
  return (
    <div className="table-cell overflow-y-auto">
      <div className="h-0">
        {props.ts.map((t) => (
          <div key={t}>{t}</div>
        ))}
      </div>
    </div>
  );
}

function Product(props: { p: ProductWithLimit }) {
  return (
    <div className="table-row">
      {/* <div className="table-cell">{props.p.id}</div> */}
      <div className="table-cell">{props.p.title}</div>
      <div className="table-cell">{props.p.vendor}</div>
      {/* <div className="table-cell">{props.p.handle}</div> */}
      <div className="table-cell">{props.p.startDate}</div>
      <div className="table-cell">{props.p.endDate}</div>
      <Tags ts={props.p.tags} />
    </div>
  );
}

function Products(props: { products: ProductWithLimit[] }) {
  return (
    <div className="table w-full relative">
      <div className="sticky top-0 bg-cyan-300 table-header-group">
        <div className="table-row">
          {/* <div className="table-cell text-left">ID</div> */}
          <div className="table-cell text-left">Title</div>
          <div className="table-cell text-left">Vendor</div>
          {/* <div className="table-cell text-left">Handle</div> */}
          <div className="table-cell text-left">Start</div>
          <div className="table-cell text-left">End</div>
          <div className="table-cell text-left">Tag</div>
        </div>
      </div>
      <div className="table-row-group">
        {props.products.map((p) => (
          <Product key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
