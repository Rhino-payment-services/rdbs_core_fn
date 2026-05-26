'use client'

import { Suspense } from 'react'
import { TariffFormPage } from '@/components/dashboard/finance/tariff-form/TariffFormPage'

function CreateTariffPageContent() {
  return <TariffFormPage mode="create" />
}

export default function CreateTariffPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08163d]" />
        </div>
      }
    >
      <CreateTariffPageContent />
    </Suspense>
  )
}
