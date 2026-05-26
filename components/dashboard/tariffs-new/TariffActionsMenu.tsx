'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Tariff } from '@/lib/tariffs-new/types'
import {
  CheckCircle,
  Clock,
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
  XCircle,
} from 'lucide-react'

type TariffActionsMenuProps = {
  tariff: Tariff
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

export function TariffActionsMenu({
  tariff,
  canManage,
  canApprove,
  currentUserId,
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onSubmitForApproval,
}: TariffActionsMenuProps) {
  const isPending =
    tariff.status === 'PENDING_APPROVAL' || tariff.approvalStatus === 'PENDING'
  const isDraft = tariff.status === 'DRAFT' || !tariff.status
  const canActOnApproval =
    canApprove &&
    isPending &&
    currentUserId !== tariff.createdById &&
    currentUserId !== tariff.submittedById

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onView(tariff)}>
          <Eye className="h-4 w-4 mr-2" />
          View details
        </DropdownMenuItem>
        {canManage && (
          <DropdownMenuItem onClick={() => onEdit(tariff)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        {canManage && isDraft && (
          <DropdownMenuItem onClick={() => onSubmitForApproval(tariff.id)}>
            <Clock className="h-4 w-4 mr-2" />
            Submit for approval
          </DropdownMenuItem>
        )}
        {canActOnApproval && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onApprove(tariff)}
              className="text-green-700 focus:text-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onReject(tariff)}
              className="text-red-700 focus:text-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </DropdownMenuItem>
          </>
        )}
        {canManage && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(tariff)}
              className="text-red-700 focus:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
