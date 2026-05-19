import { ethers } from "ethers";

export type Role = "owner" | "company" | "none";

export interface CompanyInfo {
  name: string;
  isActive: boolean;
  registeredAt: bigint;
  companyAddress: string;
}

export async function detectRole(
  wallet: string,
  contract: ethers.Contract
): Promise<{ role: Role; companyInfo: CompanyInfo | null }> {
  try {
    const ownerAddr: string = await contract.owner();
    if (ownerAddr.toLowerCase() === wallet.toLowerCase()) {
      return { role: "owner", companyInfo: null };
    }
  } catch {
    // ignore
  }

  try {
    const c = await contract.getCompanyByAddress(wallet);
    if (c.companyAddress !== ethers.ZeroAddress) {
      return {
        role: "company",
        companyInfo: {
          name: c.name,
          isActive: c.isActive,
          registeredAt: c.registeredAt,
          companyAddress: c.companyAddress,
        },
      };
    }
  } catch {
    console.warn("getCompanyByAddress reverted — not a company:", wallet);
  }

  return { role: "none", companyInfo: null };
}

export async function getCompanyId(
  wallet: string,
  contract: ethers.Contract
): Promise<bigint | null> {
  const count: bigint = await contract.companyCount();
  for (let i = 1n; i <= count; i++) {
    try {
      const c = await contract.getCompanyById(i);
      if (c.companyAddress.toLowerCase() === wallet.toLowerCase()) {
        return i;
      }
    } catch {
      // skip
    }
  }
  return null;
}
