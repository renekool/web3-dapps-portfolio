import type { Metadata } from 'next'
import SelectWalletPage from './SelectWalletPage'

export const metadata: Metadata = {
  title: 'Welcome | Truxign',
  description: 'Select a wallet to access the Truxign dashboard.',
}

export default function Page() {
  return <SelectWalletPage />
}
