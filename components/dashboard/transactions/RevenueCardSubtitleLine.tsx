import {
  revenueSubtitleClassName,
  type RevenueCardSubtitle,
} from '@/lib/hooks/useRevenueCardSubtitle'

export function RevenueCardSubtitleLine({ subtitle }: { subtitle: RevenueCardSubtitle | null }) {
  if (!subtitle) return null

  return (
    <div className="mt-0">
      <span className={`text-sm font-medium ${revenueSubtitleClassName(subtitle.tone)}`}>
        {subtitle.value}
      </span>
      <span className="text-sm ml-1 text-gray-500">{subtitle.suffix}</span>
    </div>
  )
}
