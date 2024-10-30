## omnivore-workers

Sync Saved articles in Inoreader to Omnivore with Cloudflare Workers.

## Development

Define environment variables in `.dev.vars`.

```
INOREADER_RULE_NAME=********
OMNIVORE_API_KEY=********
```

Run.

```
npm ci
npm run dev
```

Deploy.

```
npm run deploy
```
