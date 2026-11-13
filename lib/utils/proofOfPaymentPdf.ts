import { jsPDF } from 'jspdf'
import { normalizePartyInfoForDisplay } from '@/components/dashboard/transactions/partyResolver'
import { formatKampalaDateTime } from '@/lib/utils/statementData'
import { getDisplayName } from '@/lib/utils/transactions'

const NAVY: [number, number, number] = [15, 23, 42]
const BLUE: [number, number, number] = [37, 99, 235]
const MUTED: [number, number, number] = [100, 116, 139]
const LINE: [number, number, number] = [226, 232, 240]
const BOX_BG: [number, number, number] = [241, 245, 249]
const SUCCESS: [number, number, number] = [22, 163, 74]
const FAILED: [number, number, number] = [220, 38, 38]
const PENDING: [number, number, number] = [217, 119, 6]
const REVERSED: [number, number, number] = [234, 88, 12]

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 20

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function registerOutfit(doc: jsPDF): Promise<string> {
  try {
    const [regular, bold] = await Promise.all([
      fetch('/fonts/Outfit-Regular.ttf').then((r) => {
        if (!r.ok) throw new Error('regular font missing')
        return r.arrayBuffer()
      }),
      fetch('/fonts/Outfit-Bold.ttf').then((r) => {
        if (!r.ok) throw new Error('bold font missing')
        return r.arrayBuffer()
      }),
    ])
    doc.addFileToVFS('Outfit-Regular.ttf', arrayBufferToBase64(regular))
    doc.addFont('Outfit-Regular.ttf', 'Outfit', 'normal')
    doc.addFileToVFS('Outfit-Bold.ttf', arrayBufferToBase64(bold))
    doc.addFont('Outfit-Bold.ttf', 'Outfit', 'bold')
    return 'Outfit'
  } catch {
    return 'helvetica'
  }
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch('/images/logoRukapay2.png')
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function setFont(doc: jsPDF, family: string, style: 'normal' | 'bold', size: number) {
  try {
    doc.setFont(family, style)
  } catch {
    doc.setFont('helvetica', style)
  }
  doc.setFontSize(size)
}

function dash(value: unknown): string {
  const text = String(value ?? '').trim()
  return text || '—'
}

function formatMoney(amount: unknown, currency = 'UGX'): string {
  const n = Number(amount)
  const safe = Number.isFinite(n) ? n : 0
  const hasFraction = Math.abs(safe % 1) > 1e-9
  const formatted = new Intl.NumberFormat('en-UG', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(safe)
  return `${currency} ${formatted}`
}

function formatReceiptDate(iso?: string | null): string {
  if (!iso) return '—'
  return formatKampalaDateTime(iso)
}

function partyName(info: any, fallback: string): string {
  return dash(
    info?.name ||
      info?.displayName ||
      info?.businessName ||
      info?.merchantName ||
      fallback,
  )
}

function partyContact(info: any): string {
  return String(
    info?.contact ||
      info?.phone ||
      info?.msisdn ||
      info?.account ||
      info?.walletId ||
      '',
  ).trim()
}

function paymentMethodLabel(transaction: any): string {
  const type = String(transaction?.type || '').toUpperCase()
  const metadata = transaction?.metadata || {}
  const channel = String(transaction?.channel || metadata.channel || '').toUpperCase()

  if (
    type.includes('MNO') ||
    type.includes('TOPUP') ||
    type === 'BILL_PAYMENT' ||
    type === 'WALLET_TO_UTILITY'
  ) {
    return 'Mobile Money'
  }
  if (type.includes('BANK') || String(metadata.bankName || metadata.bank || '').trim()) {
    return 'Bank'
  }
  if (type.includes('CARD')) return 'Card'
  if (channel === 'USSD' || channel === 'APP' || type.includes('WALLET') || type.includes('MERCHANT')) {
    return 'Wallet'
  }
  return 'Wallet'
}

function receiptCopy(status: string): {
  title: string
  subtitle: string
  statusLabel: string
  statusColor: [number, number, number]
} {
  const key = String(status || '').toUpperCase()
  if (key === 'SUCCESS' || key === 'COMPLETED') {
    return {
      title: 'Payment successful',
      subtitle: 'This receipt confirms that the payment below was processed.',
      statusLabel: 'SUCCESSFUL',
      statusColor: SUCCESS,
    }
  }
  if (key === 'PENDING' || key === 'PROCESSING') {
    return {
      title: 'Payment pending',
      subtitle: 'This receipt shows a payment that is still being processed.',
      statusLabel: key === 'PROCESSING' ? 'PROCESSING' : 'PENDING',
      statusColor: PENDING,
    }
  }
  if (key === 'FAILED') {
    return {
      title: 'Payment failed',
      subtitle: 'This receipt shows that the payment below was not completed.',
      statusLabel: 'FAILED',
      statusColor: FAILED,
    }
  }
  if (key === 'CANCELLED') {
    return {
      title: 'Payment cancelled',
      subtitle: 'This receipt shows that the payment below was cancelled.',
      statusLabel: 'CANCELLED',
      statusColor: MUTED,
    }
  }
  if (key === 'REVERSED') {
    return {
      title: 'Payment reversed',
      subtitle: 'This receipt shows that the payment below was reversed.',
      statusLabel: 'REVERSED',
      statusColor: REVERSED,
    }
  }
  return {
    title: 'Proof of payment',
    subtitle: 'This receipt shows the payment details recorded for this transaction.',
    statusLabel: key || 'UNKNOWN',
    statusColor: MUTED,
  }
}

export function proofOfPaymentFileName(transaction: any): string {
  const ref = String(transaction?.reference || transaction?.id || 'receipt')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .slice(0, 40)
  return `rukapay-proof-of-payment-${ref}.pdf`
}

export async function downloadProofOfPayment(transaction: any): Promise<void> {
  if (!transaction) throw new Error('Transaction is required')

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const [font, logo] = await Promise.all([registerOutfit(doc), loadLogoDataUrl()])

  const senderInfo = transaction.senderInfo
    ? normalizePartyInfoForDisplay(transaction.senderInfo, transaction, 'sender')
    : null
  const receiverInfo = transaction.receiverInfo
    ? normalizePartyInfoForDisplay(transaction.receiverInfo, transaction, 'receiver')
    : null

  const senderFallback = getDisplayName(
    transaction.user,
    transaction.metadata,
    transaction.counterpartyUser,
    transaction.wallet,
    transaction,
    'sender',
  )
  const receiverFallback = getDisplayName(
    transaction.counterpartyUser || transaction.user,
    transaction.metadata,
    transaction.user,
    transaction.wallet,
    transaction,
    'receiver',
  )

  const sender = partyName(senderInfo, senderFallback)
  const receiver = partyName(receiverInfo, receiverFallback)
  const receiverAccount = dash(
    partyContact(receiverInfo) ||
      transaction.metadata?.recipientPhone ||
      transaction.metadata?.receiverPhone ||
      transaction.metadata?.destinationAccount ||
      transaction.metadata?.accountNumber ||
      transaction.counterpartyUser?.phone,
  )
  const currency = String(transaction.currency || 'UGX')
  const amountLabel = formatMoney(transaction.amount, currency)
  const copy = receiptCopy(transaction.status)
  const reference = dash(transaction.reference || transaction.id)
  const paidAt = formatReceiptDate(transaction.processedAt || transaction.createdAt)
  const method = paymentMethodLabel(transaction)

  const x = MARGIN
  const w = PAGE_W - MARGIN * 2
  const logoSize = 12
  let y = 14

  if (logo) {
    try {
      doc.addImage(logo, 'PNG', x, y, logoSize, logoSize)
    } catch {
      // skip a broken image
    }
    setFont(doc, font, 'bold', 14)
    doc.setTextColor(...NAVY)
    doc.text('RukaPay', x + logoSize + 3, y + 5.5)
    setFont(doc, font, 'normal', 7)
    doc.setTextColor(...MUTED)
    doc.text('Rhino Payments', x + logoSize + 3, y + 10)
  } else {
    setFont(doc, font, 'bold', 15)
    doc.setTextColor(...NAVY)
    doc.text('RukaPay', x, y + 7)
  }

  setFont(doc, font, 'bold', 7.5)
  doc.setTextColor(...BLUE)
  doc.text('PAYMENT RECEIPT', x + w, y + 7, { align: 'right' })

  y += logo ? logoSize + 3 : 12
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.3)
  doc.line(x, y, x + w, y)

  y += 14
  setFont(doc, font, 'bold', 13)
  doc.setTextColor(...NAVY)
  doc.text(copy.title, PAGE_W / 2, y, { align: 'center' })

  y += 5
  setFont(doc, font, 'normal', 8)
  doc.setTextColor(...MUTED)
  const subtitle = doc.splitTextToSize(copy.subtitle, w - 16)
  doc.text(subtitle, PAGE_W / 2, y, { align: 'center' })

  y += subtitle.length * 3.8 + 7
  const boxH = 26
  doc.setFillColor(...BOX_BG)
  doc.roundedRect(x, y, w, boxH, 2.5, 2.5, 'F')

  setFont(doc, font, 'bold', 7)
  doc.setTextColor(...MUTED)
  doc.text('AMOUNT PAID', PAGE_W / 2, y + 7.5, { align: 'center' })

  setFont(doc, font, 'bold', 16)
  doc.setTextColor(...NAVY)
  doc.text(amountLabel, PAGE_W / 2, y + 15.5, { align: 'center' })

  const statusPrefix = 'Payment status: '
  setFont(doc, font, 'normal', 8)
  const prefixW = doc.getTextWidth(statusPrefix)
  setFont(doc, font, 'bold', 8)
  const statusW = doc.getTextWidth(copy.statusLabel)
  const statusStart = PAGE_W / 2 - (prefixW + statusW) / 2
  setFont(doc, font, 'normal', 8)
  doc.setTextColor(...MUTED)
  doc.text(statusPrefix, statusStart, y + 21.5)
  setFont(doc, font, 'bold', 8)
  doc.setTextColor(...copy.statusColor)
  doc.text(copy.statusLabel, statusStart + prefixW, y + 21.5)

  y += boxH + 10

  const rows: Array<[string, string]> = [
    ['PAID BY', sender],
    ['SENT TO', receiver],
    ['RECEIVER PHONE / ACCOUNT', receiverAccount],
    ['PAYMENT METHOD', method],
    ['TRANSACTION ID', String(reference)],
    ['DATE & TIME', paidAt],
  ]

  const valueW = w * 0.55

  rows.forEach(([label, value], index) => {
    setFont(doc, font, 'normal', 7)
    doc.setTextColor(...MUTED)
    doc.text(label, x, y)

    setFont(doc, font, 'bold', 8.5)
    doc.setTextColor(...NAVY)
    const lines = doc.splitTextToSize(value, valueW)
    doc.text(lines, x + w, y, { align: 'right' })

    const rowH = Math.max(8, lines.length * 4 + 4)
    y += rowH
    if (index < rows.length - 1) {
      doc.setDrawColor(...LINE)
      doc.setLineWidth(0.25)
      doc.line(x, y - 3.5, x + w, y - 3.5)
    }
  })

  y += 6
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.25)
  doc.line(x + 24, y, x + w - 24, y)

  y += 7
  setFont(doc, font, 'normal', 7.5)
  doc.setTextColor(...MUTED)
  const footer = doc.splitTextToSize(
    'Keep this receipt for your records. If you have questions about this payment, contact RukaPay support and quote the transaction ID.',
    w - 20,
  )
  doc.text(footer, PAGE_W / 2, y, { align: 'center' })

  y += footer.length * 3.8 + 5
  setFont(doc, font, 'bold', 8)
  doc.setTextColor(...NAVY)
  doc.text('RukaPay · Proof of Payment', PAGE_W / 2, y, { align: 'center' })

  setFont(doc, font, 'normal', 6.5)
  doc.setTextColor(...MUTED)
  const licence = doc.splitTextToSize(
    'Rhino Payments services Limited, trading as Rukapay is licenced by the Bank of Uganda as a PSP and PSO.',
    w,
  )
  doc.text(licence, PAGE_W / 2, PAGE_H - 14, { align: 'center' })

  doc.save(proofOfPaymentFileName(transaction))
}
