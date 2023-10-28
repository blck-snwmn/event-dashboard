import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { ProductWithLimit } from "dash-message/message"

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
    <div>
      {props.ts.map((t) => (
        <span key={t}>{t}</span>
      ))}
    </div>
  );
}

function Product(props: { p: ProductWithLimit }) {
  return (
    <div>
      <h2>{props.p.id}</h2>
      <p>{props.p.title}</p>
      <p>{props.p.vendor}</p>
      <p>{props.p.handle}</p>
      <Tags ts={props.p.tags} />
    </div>
  );
}

function Products(props: { products: ProductWithLimit[] }) {
  return (
    <div>
      {props.products.map((p) => (
        <Product key={p.id} p={p} />
      ))}
    </div>
  );
}
