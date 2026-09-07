# Aporia

A keyboard-first issue tracker for engineering teams: issues, projects, cycles and releases in one dense, calm workspace.

## Stack

- SvelteKit 2 with Svelte 5 runes, TypeScript throughout
- `@sveltejs/adapter-node`, so the built server reads `PORT` itself
- Hand-written CSS driven entirely by design tokens in `src/lib/styles/tokens.css`
- MongoDB for persistent data, Redis for sessions, caching and queued work

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server with HMR |
| `npm run build` | Production build into `build/` |
| `npm start` | Run the built Node server |
| `npm run check` | Type-check Svelte and TypeScript |

## Environment

Both values are injected by the platform and are never committed. See `.env.example`.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MongoDB connection string |
| `DATABASE_NAME` | Database name, defaults to `aporia` |
| `REDIS_URL` | Redis connection string for sessions, cache and queues |

When either variable is unset the app falls back to sample data (`src/lib/data/seed.ts`) and an in-process session store, so previews always render.

## Layout

```
src/
  app.css                 global primitives, imports the token file
  app.html                sets data-theme before first paint
  hooks.server.ts          resolves the session cookie onto locals
  lib/
    components/           Icon, StatusIcon, PriorityIcon, Avatar, LabelChip, CommandPalette
    data/seed.ts          in-memory sample workspace
    server/db.ts          MongoDB access layer, reads DATABASE_URL
    server/redis.ts       session/cache/queue keys, reads REDIS_URL
    styles/tokens.css     every color, radius, spacing and type value
    types.ts              User, Session, Project, Issue, Release, Comment, Label
  routes/
    +layout.svelte        sidebar, top bar, theme toggle, command palette
    +page.svelte          dashboard
    issues/               list and board views
    projects/  releases/  team/  inbox/  my-issues/  settings/
```

Infrastructure (web frame, MongoDB, Redis) is declared in `nubo.toml`.
