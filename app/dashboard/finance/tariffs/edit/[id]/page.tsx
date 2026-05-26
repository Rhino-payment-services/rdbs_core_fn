'use client'

import { useParams } from 'next/navigation'
import { TariffFormPage } from '@/components/dashboard/finance/tariff-form/TariffFormPage'

export default function EditTariffPage() {
  const params = useParams()
  const tariffId = params.id as string

  return <TariffFormPage mode="edit" tariffId={tariffId} />
}
