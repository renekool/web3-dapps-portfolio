import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Document History | Truxign',
  description: 'View the complete timeline and history of secured documents.',
}

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
