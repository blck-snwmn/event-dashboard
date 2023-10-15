## Create DB
```bash
$ wrangler d1 create event-products
```



## Migration
generate
```bash
$ npx drizzle-kit generate:sqlite
```

for local
```bash
$ npx wrangler d1 migrations apply event-products --local
```

for remote
```bash
$ npx wrangler d1 migrations apply event-products
```