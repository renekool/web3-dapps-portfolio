import type { Metadata } from 'next'
import VerifyPage from './VerifyPage'

export const metadata: Metadata = {
  title: 'Verify document | Truxign',
  description: 'Verify the authenticity and signature of any document on the blockchain.',
}

export default function Page() {
  return <VerifyPage />
}
