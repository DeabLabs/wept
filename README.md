# wept

(we GPT)

Chat GPT, Together.

Multiplayer GPT interface for collaborative conversation.

## NOTICE

This application should only be used for evaluation purposes. While data access is secure, and all connections are fully authenticated, all data is stored plaintext in the database.
Meaning, those who have access to the production database can view the content of messages as well as openai keys.
Data encryption is on the roadmap, but not yet implemented.
This notice will remain here until data is encrypted within columns.

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
