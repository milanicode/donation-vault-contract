# DonationVault front-end

A Vite + React + TypeScript site that reads a deployed `DonationVault` and lets
visitors donate, claim refunds, or (as the organizer) withdraw. It talks to the
chain through [wagmi](https://wagmi.sh/) and [viem](https://viem.sh/), with a
browser wallet (injected / MetaMask-style). Without a wallet the page stays
read-only.

## Configure

Copy `.env.example` to `.env.local` and fill in at least:

| Variable | Meaning |
| --- | --- |
| `VITE_CHAIN_ID` | `11155111` (Sepolia portfolio) or `31337` (one local Anvil vault) |
| `VITE_VAULT_ADDRESS` | Deployed contract address. Required on Anvil. The Sepolia demo uses the three contracts in `src/config/campaigns.ts` |
| `VITE_DEPLOY_BLOCK` | Anvil only: first block scanned for `Deposit` events. Each Sepolia campaign stores its own |

Optional: `VITE_RPC_URL`, `VITE_CAMPAIGN_TITLE`, `VITE_CAMPAIGN_DESCRIPTION`,
`VITE_REPO_URL`, `VITE_LOGS_CHUNK_SIZE`. Title and description apply to the
Anvil preview. Every `VITE_*` value ends up in the public bundle — never put a
private key here.

## Run locally

Needs Node 20+ (or the `web` service in `../../docker/docker-compose.yml`).

```shell
npm install
npm run dev
```

Against a local Anvil node:

```shell
# terminal 1 — from the contract directory
anvil --host 127.0.0.1 --port 8545

# terminal 2 — deploy (example uses Anvil account 0; local only)
CAMPAIGN_GOAL=3000000000000000000 forge script script/DonationVault.s.sol \
  --rpc-url http://127.0.0.1:8545 --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# terminal 3 — from this directory
# .env.local: VITE_VAULT_ADDRESS=<deployed>, VITE_CHAIN_ID=31337
npm run dev
```

## Scripts

```shell
npm run typecheck
npm test
npm run build
npm run preview
```

## Sepolia

The portfolio page lists three deployed vaults (a missed goal, a met goal, and
one that stays open). Their addresses, titles, and deploy blocks live in
`src/config/campaigns.ts`.

1. Set `VITE_CHAIN_ID=11155111`.
2. Prefer your own `VITE_RPC_URL` — public Sepolia endpoints are rate-limited.
   Do not put a URL that contains a secret into a file you might commit.
3. `npm run build`, then host the `dist/` folder (or `npm run preview` to try it).

The site has no WalletConnect project ID; visitors use an injected browser
wallet on Sepolia. Routes are hashes: `#/` is the list, `#/c/<id>` is one campaign.

## Host on Vercel

The Hobby plan is free for this site. It is a static build: Vercel runs
`npm run build` and serves `dist/`. `.env.production` already points the build
at Sepolia and a public RPC, so no secret is required. Do not add an Alchemy
URL that contains a key unless you set it only in the Vercel project settings.

From the frontend directory, with [Node 22](https://nodejs.org/) installed:

```shell
npx vercel login
npx vercel deploy --prod
```

On this machine Node lives in the `web` container, so the same two steps are:

```shell
docker exec -it portfolio-solidity-web-1 npx vercel login
docker exec -it portfolio-solidity-web-1 npx vercel deploy --prod
```

The CLI prints a `*.vercel.app` address when the deploy finishes. Hash routes
need no extra rewrite. A later deploy of the same project updates that address.
