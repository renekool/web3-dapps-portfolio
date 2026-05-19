import { ethers } from 'ethers';
import abiData from '../../../contract/out/DocumentRegistry.sol/DocumentRegistry.json';

const RPC_URL = 'http://127.0.0.1:8546';
const provider = new ethers.JsonRpcProvider(RPC_URL);

/**
 * Creates a fresh contract instance.
 * For true isolation in INV tests, we'd ideally deploy a new contract per run,
 * but with Anvil we'll use a singleton and reset if needed or just handle it.
 */
export async function getContractInstance() {
  const [deployer] = await provider.listAccounts();
  // Using an existing deployment if available or just the ABI for testing
  // In a real local test setup, we'd deploy here.
  // For these properties, we'll assume the contract is deployed or we'll connect.
  return new ethers.Contract(
    process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    abiData.abi,
    await provider.getSigner()
  );
}

export { provider };
