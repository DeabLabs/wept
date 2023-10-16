# wept

(we GPT)

Chat GPT, Together.

Multiplayer GPT interface for collaborative conversation.

## Development

### Warning, vercel is having issues with deployments using bun lockfiles. Using `yarn` for now...

This project uses [bun](https://bun.sh) instead of node, install that first.

```bash
# clone this repo, then...
bun install
bun dev
```

## Deployment

- /apps/web hosted on vercel [vercel](https://vercel.com)
- /apps/messages hosted on partykit [partykit](https://docs.partykit.io)
- /packages/database hosted on [neon](https://console.neon.tech/)
