import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify document | Truxign',
  description: 'Verify the authenticity and signature of any document on the blockchain.',
}

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
