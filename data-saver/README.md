## Create DB
```bash
$ wrangler d1 create event-products
```



## Migration
generate
```bash
$ pnpm drizzle-kit generate:sqlite
```

for local
```bash
$ pnpm wrangler d1 migrations apply event-products --local
```

for remote
```bash
$ pnpm wrangler d1 migrations apply event-products
```

## Test
```bash
$ pnpm vitest run
```