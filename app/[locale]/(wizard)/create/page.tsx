import { listForDropdown } from '@/lib/localities/repository'
import CreatePageClient from './create-page-client'

export default async function CreatePage() {
  const localityOptions = await listForDropdown()
  return <CreatePageClient localityOptions={localityOptions} />
}
