import { JsonRpcProvider, Wallet } from 'ethers';

export const provider = new JsonRpcProvider(process.env.RPC_URL!);
export const signer = new Wallet(process.env.WALLET_PRIVATE_KEY!, provider);
