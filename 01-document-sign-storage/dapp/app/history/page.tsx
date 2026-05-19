import type { Metadata } from 'next'
import HistoryPage from './HistoryPage'

export const metadata: Metadata = {
  title: 'Document History | Truxign',
  description: 'View the complete timeline and history of secured documents.',
}

export default function Page() {
  return <HistoryPage />
}
