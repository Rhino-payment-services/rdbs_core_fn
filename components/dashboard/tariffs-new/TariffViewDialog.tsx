'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { Tariff } from '@/lib/tariffs-new/types'
import {
  formatAmountRange,
  formatFeeAmount,
  getTransactionTypeLabel,
} from '@/lib/tariffs-new/utils'
import { formatTariffChannel } from '@/lib/constants/tariff-channels'
import {
  formatTariffGovernmentTax,
  formatTariffSplitField,
} from '@/lib/utils/tariffDisplay'
import { TariffStatusBadge } from './TariffStatusBadge'
import { TariffFeeSplit } from './TariffFeeSplit'

type TariffViewDialogProps = {
  tariff: Tariff | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TariffViewDialog({ tariff, open, onOpenChange }: TariffViewDialogProps) {
  if (!tariff) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tariff.name}</DialogTitle>
          <DialogDescription>
            {getTransactionTypeLabel(tariff.transactionType, tariff)} · {tariff.tariffType}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Overview
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <Label className="text-xs text-gray-500">Status</Label>
                <div className="mt-1">
                  <TariffStatusBadge tariff={tariff} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Channel</Label>
                <p className="mt-1">{formatTariffChannel(tariff.channel)}</p>
              </div>
              {tariff.group && (
                <div>
                  <Label className="text-xs text-gray-500">Tier group</Label>
                  <p className="mt-1 font-mono">{tariff.group}</p>
                </div>
              )}
              {tariff.network && (
                <div>
                  <Label className="text-xs text-gray-500">Network</Label>
                  <p className="mt-1">{tariff.network}</p>
                </div>
              )}
              <div className="col-span-2">
                <Label className="text-xs text-gray-500">Description</Label>
                <p className="mt-1 text-gray-700">{tariff.description || '—'}</p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Pricing
            </h3>
            <div className="rounded-lg border bg-gray-50/50 p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total fee</span>
                <span className="font-semibold text-[#08163d]">{formatFeeAmount(tariff)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Amount range</span>
                <span>{formatAmountRange(tariff)}</span>
              </div>
              <div className="pt-2 border-t">
                <Label className="text-xs text-gray-500">Fee split</Label>
                <div className="mt-1">
                  <TariffFeeSplit tariff={tariff} />
                </div>
              </div>
            </div>
          </section>

          {tariff.tariffType === 'EXTERNAL' && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Partner
              </h3>
              <div className="text-sm">
                {tariff.apiPartner ? (
                  <>
                    <p className="font-medium">{tariff.apiPartner.partnerName}</p>
                    <p className="text-gray-500 text-xs">{tariff.apiPartner.partnerType}</p>
                  </>
                ) : tariff.partner ? (
                  <>
                    <p className="font-medium">{tariff.partner.partnerName}</p>
                    <p className="text-gray-500 text-xs">{tariff.partner.partnerCode}</p>
                  </>
                ) : (
                  <p className="text-gray-500">Platform (no partner)</p>
                )}
              </div>
            </section>
          )}

          {(tariff.partnerFee != null ||
            tariff.rukapayFee != null ||
            tariff.telecomBankCharge != null) && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Raw split fields
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {tariff.partnerFee != null && (
                  <div>
                    <span className="text-gray-500 text-xs">Partner</span>
                    <p>
                      {formatTariffSplitField(tariff.partnerFee, tariff) ??
                        `${tariff.partnerFee}`}
                    </p>
                  </div>
                )}
                {tariff.rukapayFee != null && (
                  <div>
                    <span className="text-gray-500 text-xs">RukaPay</span>
                    <p>{formatTariffSplitField(tariff.rukapayFee, tariff)}</p>
                  </div>
                )}
                {tariff.telecomBankCharge != null && (
                  <div>
                    <span className="text-gray-500 text-xs">Telecom</span>
                    <p>{formatTariffSplitField(tariff.telecomBankCharge, tariff)}</p>
                  </div>
                )}
                {tariff.governmentTax != null && (
                  <div>
                    <span className="text-gray-500 text-xs">Gov tax</span>
                    <p>{formatTariffGovernmentTax(tariff.governmentTax)}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="flex flex-wrap gap-2 text-xs text-gray-500">
            <Badge variant="outline">{tariff.feeType}</Badge>
            <Badge variant="outline">{tariff.userType}</Badge>
            {tariff.subscriberType && (
              <Badge variant="outline">{tariff.subscriberType}</Badge>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
