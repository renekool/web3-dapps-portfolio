import type { Metadata } from 'next'
import UploadPage from './UploadPage'

export const metadata: Metadata = {
  title: 'Upload document | Truxign',
  description: 'Upload and sign your documents securely on the blockchain.',
}

export default function Page() {
  return <UploadPage />
}
