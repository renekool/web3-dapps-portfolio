# EuroToken — Deployment Artifacts

## Contract

| Field | Value |
|---|---|
| Name | EuroToken |
| Symbol | EURT |
| Decimals | 6 |
| Network | Anvil local (`chainId: 31337`, `http://localhost:8545`) |
| Address (last deploy) | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| Owner (deployer) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |

> **Note:** The address above corresponds to a local Anvil deployment. On each fresh Anvil restart + redeploy, the address will be the same if the deployer account and nonce are consistent (first account, first tx).

## ABI

**File:** `stablecoin/deployments/EuroToken.abi.json`

**Source:** Extracted from `stablecoin/sc/eurotoken/out/EuroToken.sol/EuroToken.json` after `forge build`.

To update the ABI after modifying the contract:
```bash
cd stablecoin/sc/eurotoken
forge build
jq '.abi' out/EuroToken.sol/EuroToken.json > ../../deployments/EuroToken.abi.json
```

## Environment Variable

All consuming apps must set:

```
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

## Consuming Modules

| Module | Usage |
|---|---|
| Web Compra Crypto (A.2) | `mint(userAddress, amount)` via backend with owner wallet |
| Web Pasarela de Pagos (A.3) | `balanceOf`, `allowance`, `approve` |
| Smart Contract Ecommerce (B.1) | `transferFrom(user, merchant, amount)` in `processPayment` |
