'use client'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatTariffChannel } from '@/lib/constants/tariff-channels'
import type { Tariff } from '@/lib/tariffs-new/types'
import { formatAmountRange, formatFeeAmount } from '@/lib/tariffs-new/utils'
import { TariffActionsMenu } from './TariffActionsMenu'
import { TariffFeeSplit } from './TariffFeeSplit'
import { TariffStatusBadge } from './TariffStatusBadge'

type TariffTierTableProps = {
  tariffs: Tariff[]
  showNetwork?: boolean
  showChannel?: boolean
  canManage: boolean
  canApprove: boolean
  currentUserId?: string
  onView: (tariff: Tariff) => void
  onEdit: (tariff: Tariff) => void
  onDelete: (tariff: Tariff) => void
  onApprove: (tariff: Tariff) => void
  onReject: (tariff: Tariff) => void
  onSubmitForApproval: (tariffId: string) => void
}

export function TariffTierTable({
  tariffs,
  showNetwork = false,
  showChannel = false,
  canManage,
  canApprove,
  currentUserId,
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onSubmitForApproval,
}: TariffTierTableProps) {
  if (tariffs.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">No tiers configured</p>
    )
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/80">
            <TableHead className="w-[100px]">Tier</TableHead>
            <TableHead>Amount range</TableHead>
            {showNetwork && <TableHead className="w-[90px]">Network</TableHead>}
            <TableHead className="w-[120px]">Total fee</TableHead>
            <TableHead className="min-w-[160px]">Fee split</TableHead>
            {showChannel && <TableHead className="w-[110px]">Channel</TableHead>}
            <TableHead className="w-[110px]">Status</TableHead>
            <TableHead className="w-[52px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tariffs.map((tariff) => (
            <TableRow key={tariff.id} className="hover:bg-gray-50/50">
              <TableCell className="font-medium text-sm">
                {tariff.group ? (
                  <Badge variant="outline" className="font-mono">
                    {tariff.group}
                  </Badge>
                ) : (
                  <span className="text-gray-700 truncate max-w-[140px] block" title={tariff.name}>
                    {tariff.name.length > 18 ? `${tariff.name.slice(0, 16)}…` : tariff.name}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm">{formatAmountRange(tariff)}</TableCell>
              {showNetwork && (
                <TableCell>
                  {tariff.network ? (
                    <Badge variant="secondary" className="text-xs">
                      {tariff.network}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-sm">All</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                <div className="text-sm font-semibold text-[#08163d]">
                  {formatFeeAmount(tariff)}
                </div>
                <Badge variant="outline" className="text-[10px] mt-0.5 font-normal">
                  {tariff.feeType}
                </Badge>
              </TableCell>
              <TableCell>
                <TariffFeeSplit tariff={tariff} />
              </TableCell>
              {showChannel && (
                <TableCell className="text-xs text-gray-600">
                  {formatTariffChannel(tariff.channel)}
                </TableCell>
              )}
              <TableCell>
                <TariffStatusBadge tariff={tariff} />
              </TableCell>
              <TableCell>
                <TariffActionsMenu
                  tariff={tariff}
                  canManage={canManage}
                  canApprove={canApprove}
                  currentUserId={currentUserId}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onApprove={onApprove}
                  onReject={onReject}
                  onSubmitForApproval={onSubmitForApproval}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
