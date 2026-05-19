import { Contract } from 'ethers';
import { signer } from './ethers';
import artifact from '../deployments/EuroToken.abi.json';

export const euroToken = new Contract(
  process.env.EUROTOKEN_CONTRACT_ADDRESS!,
  artifact.abi,
  signer
);
