import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Upload document | Truxign',
  description: 'Upload and sign your documents securely on the blockchain.',
}

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
