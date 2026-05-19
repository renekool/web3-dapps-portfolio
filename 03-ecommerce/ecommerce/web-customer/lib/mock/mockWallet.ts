export const MOCK_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

export async function connectMockWallet(): Promise<string> {
  await new Promise((res) => setTimeout(res, 1500));
  return MOCK_ADDRESS;
}
