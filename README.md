# DonationVault

Solidity + Foundry project: a **timed ETH donation campaign** with a funding **goal**.

Anyone can **`deposit`** while the campaign is open (`block.timestamp < endTime`). After the deadline:

- if **`totalDeposits >= goal`**, only the **`owner`** can **`withdraw`** the recorded pot
- if the goal is **missed**, each donor can **`claimRefund`** their own contribution

Per-donor amounts in **`deposited`** are lifetime campaign contributions. They are **not** rewritten when the owner withdraws. A dashboard can compute share as `deposited[user] / totalDeposits` (or index `Deposit` events).

## Trust model

- **During the campaign:** donors cannot withdraw early.
- **If the goal is met:** donors trust the **owner** (ideally a multisig) to use the funds as promised.
- **If the goal is missed:** donors reclaim their ETH; the owner cannot take the pot.

## Build & test

```shell
forge build
forge test
```

## Deploy (example)

Constructor args: `goal` (wei) and `endTime` (unix timestamp). The script defaults to a 1 ETH goal and a 7-day window:

```shell
export CAMPAIGN_GOAL=1000000000000000000      # 1 ether in wei (optional)
export CAMPAIGN_DURATION=604800               # 7 days in seconds (optional)

forge script script/DonationVault.s.sol:DonationVaultScript \
  --rpc-url <YOUR_RPC_URL> \
  --broadcast
```

Use a hardware wallet or Foundry keystore in production; avoid plain private keys in shell history.

## Remix (quick manual test)

1. Open [Remix](https://remix.ethereum.org), create `DonationVault.sol`, paste this repo’s contract (no external imports required).
2. **Compiler:** Solidity `0.8.33+`, enable **optimizer** if you use the same settings as `foundry.toml`.
3. **Deploy** with constructor args: e.g. `goal = 1000000000000000000` (1 ETH), `endTime =` a unix time a few minutes ahead.
4. While open: donor account sets **VALUE** → **`deposit`** → check **`deposited(donor)`**, **`totalDeposits()`**, **`Deposit`** logs.
5. After `endTime` (Remix VM: increase block time):
   - goal met → only owner **`withdraw()`** succeeds
   - goal missed → donors **`claimRefund()`**; owner **`withdraw()`** reverts

## Sepolia (testnet)

1. **Wallet:** MetaMask (or similar) on **Sepolia**; get ETH from a public [Sepolia faucet](https://sepoliafaucet.com/) (or search “Sepolia faucet” — availability changes).
2. **RPC:** Use your wallet’s default RPC or a provider (Infura, Alchemy, etc.); keep the URL private if it contains a key.
3. **Deploy via Foundry** (from this directory):

   ```shell
   export SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_KEY"
   export CAMPAIGN_GOAL=1000000000000000000
   export CAMPAIGN_DURATION=604800
   forge script script/DonationVault.s.sol:DonationVaultScript \
     --rpc-url "$SEPOLIA_RPC_URL" \
     --broadcast \
     --verify \
     --etherscan-api-key "$ETHERSCAN_API_KEY"
   ```

   Omit `--verify` and the API key if you only want deployment first; verify later on [Etherscan Sepolia](https://sepolia.etherscan.io/).

4. **Save** the deployed **contract address** and the **deployment block number**; treat the **deployer** as **`owner`**.
5. **Front-end:** see [`frontend/README.md`](frontend/README.md). The Sepolia portfolio lists its vaults in `frontend/src/config/campaigns.ts`. Set `VITE_CHAIN_ID=11155111` in `frontend/.env.local`, then `npm run build` (or use the `web` service in `../docker/docker-compose.yml`).

## Front-end

The dashboard lives in [`frontend/`](frontend/). It is a Vite + React + TypeScript app that reads the vault on-chain and drives `deposit` / `claimRefund` / `withdraw` through a browser wallet.

```shell
cd frontend
cp .env.example .env.local   # VITE_CHAIN_ID; Anvil also needs VITE_VAULT_ADDRESS
npm install
npm run dev                  # http://127.0.0.1:5173
```

Docker (from `../docker/`): `docker compose up web` after `docker compose run --rm web npm install`. The `web` service was not exercised in this environment because the Docker daemon was not running.

## Foundry toolkit

Foundry includes **Forge** (build/test), **Cast**, **Anvil**, and more. Full docs: [Foundry Book](https://book.getfoundry.sh/).

### Format & gas snapshot

```shell
forge fmt
forge snapshot
```

### Local node

```shell
anvil
```

### Cast

```shell
cast <subcommand>
```

### Help

```shell
forge --help
anvil --help
cast --help
```
