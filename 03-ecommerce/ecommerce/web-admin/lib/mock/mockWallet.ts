export type MockRole = "owner" | "company" | "none";

export interface MockWalletState {
  address: string | null;
  role: MockRole;
  balance: string;
  status: "disconnected" | "connecting" | "connected";
}

export const MOCK_ADDRESSES: Record<MockRole, string> = {
  owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  company: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  none: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
};

export function connectMockWallet(role: MockRole): MockWalletState {
  return {
    address: MOCK_ADDRESSES[role],
    role,
    balance: "0.00 ETH",
    status: "connected",
  };
}

export function detectMockRole(address: string): MockRole {
  const entry = Object.entries(MOCK_ADDRESSES).find(([, addr]) => addr === address);
  return (entry?.[0] as MockRole) ?? "none";
}
