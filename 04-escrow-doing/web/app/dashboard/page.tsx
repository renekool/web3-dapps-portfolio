import { cookies } from "next/headers";
import { DashboardPage } from "./DashboardPage";

export default async function Page() {
  const cookieStore = await cookies();
  const initialAddress = cookieStore.get("escrow_session_address")?.value ?? null;
  return <DashboardPage initialAddress={initialAddress} />;
}
