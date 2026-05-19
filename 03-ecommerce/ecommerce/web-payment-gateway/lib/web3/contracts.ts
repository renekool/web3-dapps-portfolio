import { ethers } from 'ethers';
import EcommerceABI from '../abi/Ecommerce.json';
import EuroTokenABI from '../abi/EuroToken.json';

const ECOMMERCE_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '';
const EUROTOKEN_ADDRESS = process.env.NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS || '';

export const getEcommerceContract = (providerOrSigner: ethers.Provider | ethers.Signer) => {
  if (!ECOMMERCE_ADDRESS) console.warn('NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS is not defined');
  return new ethers.Contract(ECOMMERCE_ADDRESS, EcommerceABI.abi, providerOrSigner);
};

export const getEuroTokenContract = (providerOrSigner: ethers.Provider | ethers.Signer) => {
  if (!EUROTOKEN_ADDRESS) console.warn('NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS is not defined');
  return new ethers.Contract(EUROTOKEN_ADDRESS, EuroTokenABI.abi, providerOrSigner);
};

export { ECOMMERCE_ADDRESS, EUROTOKEN_ADDRESS };
