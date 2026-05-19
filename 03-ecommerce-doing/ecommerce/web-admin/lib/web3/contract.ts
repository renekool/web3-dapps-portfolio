import { ethers } from "ethers";
import EcommerceABI from "@/lib/abi/Ecommerce.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://127.0.0.1:8545";

export function getEcommerceContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, EcommerceABI.abi, signerOrProvider);
}

export function getHttpProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getWsProvider() {
  return new ethers.WebSocketProvider(WS_URL);
}
