[Genr](https://genr.netlify.app/yo+la+tengo)

Everytime that I want to know the genres of a specific artist I open Last.fm and search for the artist. I was bored and thought "why not have the most simple website to do this for me?" and here we are 😬.

## Development

Copy `.env.example` to `.env` and set a Last.fm API key:

```sh
LASTFM_API_KEY=your_key_here
```

Then run:

```sh
pnpm install
pnpm dev
```

Checks:

```sh
pnpm check
pnpm lint
pnpm test:unit
pnpm test:e2e
```

## Production

Netlify should build with Node 22 and pnpm 10.18.0, as configured in `netlify.toml`.
Production also needs `LASTFM_API_KEY` set as a Netlify environment variable.

After deploy, run:

```sh
pnpm smoke:prod
```

To smoke-test another deployment URL:

```sh
GENR_PRODUCTION_URL=https://example.netlify.app pnpm smoke:prod
```
