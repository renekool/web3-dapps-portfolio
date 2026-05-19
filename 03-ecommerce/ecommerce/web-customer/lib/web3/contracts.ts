import { BrowserProvider, Contract, type Signer } from "ethers";
import EcommerceABI from "../abi/Ecommerce.json";
import EuroTokenABI from "../abi/EuroToken.json";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
  }
}

const ECOMMERCE_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS ?? "";
const EUROTOKEN_ADDRESS = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS ?? "";
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "http://localhost:8545";

export function getProvider(): BrowserProvider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No ethereum provider found");
  }
  return new BrowserProvider(window.ethereum);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getEcommerceContract(signerOrProvider: any) {
  return new Contract(ECOMMERCE_ADDRESS, EcommerceABI.abi, signerOrProvider);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getEuroTokenContract(signerOrProvider: any) {
  return new Contract(EUROTOKEN_ADDRESS, EuroTokenABI.abi, signerOrProvider);
}

export { ECOMMERCE_ADDRESS, EUROTOKEN_ADDRESS, RPC_URL };
