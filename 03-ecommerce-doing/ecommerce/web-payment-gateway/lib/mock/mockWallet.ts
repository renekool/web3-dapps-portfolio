export async function connectMockWallet(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
}
