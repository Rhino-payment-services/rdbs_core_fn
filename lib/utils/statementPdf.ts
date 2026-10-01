import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  formatKampalaDateTime,
  formatMoney,
  formatPeriodDay,
  periodFromRows,
  type StatementRow,
  type StatementStatus,
} from '@/lib/utils/statementData'

const HEADER_BG: [number, number, number] = [2, 28, 102]
const BRAND: [number, number, number] = [9, 72, 182]
const ROW_ALT: [number, number, number] = [241, 245, 249]
const MUTED: [number, number, number] = [55, 65, 81]
const GREY_LINE: [number, number, number] = [209, 213, 219]

const MARGIN = 12.7
const PAGE_W = 210
const PAGE_H = 297

const LICENCE =
  'Rhino Payments services Limited, trading as Rukapay is licenced by the Bank of Uganda as a PSP and PSO.'

const ALL_STATUSES: StatementStatus[] = ['SUCCESS', 'PENDING', 'FAILED', 'CANCELLED']

export type StatementPdfFooter =
  | { kind: 'balance'; amount: number; currency?: string }
  | { kind: 'totals'; debit: number; credit: number; currency?: string }

export type BuildStatementPdfInput = {
  name: string
  walletLabel: string
  startDate?: string
  endDate?: string
  allTime?: boolean
  statuses: StatementStatus[]
  rows: StatementRow[]
  footer: StatementPdfFooter | null
}

type PdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } }

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

function statusFilterLabel(statuses: StatementStatus[]): string | null {
  const unique = Array.from(new Set(statuses))
  if (unique.length === 0 || unique.length >= ALL_STATUSES.length) return null
  const labels: Record<string, string> = {
    SUCCESS: 'Success',
    PENDING: 'Pending',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
  }
  return unique.map((s) => labels[s] || s).join(', ')
}

function setFont(doc: jsPDF, family: string, style: 'normal' | 'bold', size: number) {
  try {
    doc.setFont(family, style)
  } catch {
    doc.setFont('helvetica', style)
  }
  doc.setFontSize(size)
}

function drawMetaBlock(
  doc: jsPDF,
  font: string,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
): number {
  setFont(doc, font, 'bold', 8)
  doc.setTextColor(...MUTED)
  doc.text(label.toUpperCase(), x, y)
  setFont(doc, font, 'bold', 11)
  doc.setTextColor(17, 24, 39)
  const lines = doc.splitTextToSize(value || '—', width)
  doc.text(lines, x, y + 5)
  return y + 5 + lines.length * 4.5
}

function drawHero(doc: jsPDF, font: string, logo: string | null): number {
  const x = MARGIN
  const y = MARGIN
  const w = PAGE_W - MARGIN * 2
  const h = 22
  doc.setFillColor(...HEADER_BG)
  doc.roundedRect(x, y, w, h, 2.5, 2.5, 'F')

  setFont(doc, font, 'bold', 18)
  doc.setTextColor(255, 255, 255)
  doc.text('RukaPay', x + 6, y + 9)
  setFont(doc, font, 'normal', 10)
  doc.text('Transaction statement', x + 6, y + 16)

  if (logo) {
    const box = 12
    const lx = x + w - box - 5
    const ly = y + (h - box) / 2
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(lx - 1, ly - 1, box + 2, box + 2, 2, 2, 'F')
    try {
      doc.addImage(logo, 'PNG', lx, ly, box, box)
    } catch {
      // skip a broken image
    }
  }
  return y + h
}

function drawContinuationHeader(
  doc: jsPDF,
  font: string,
  period: string,
) {
  setFont(doc, font, 'bold', 9)
  doc.setTextColor(...BRAND)
  doc.text('RukaPay statement', MARGIN, 12)
  setFont(doc, font, 'normal', 8)
  doc.setTextColor(...MUTED)
  doc.text(period, PAGE_W - MARGIN, 12, { align: 'right' })
}

function drawFooter(doc: jsPDF, font: string, page: number, pages: number) {
  const y = PAGE_H - 12
  setFont(doc, font, 'normal', 7.5)
  doc.setTextColor(...MUTED)
  doc.text(`Page ${page} of ${pages}  ·  Powered by RukaPay`, PAGE_W - MARGIN, y, {
    align: 'right',
  })
  setFont(doc, font, 'normal', 6.5)
  const licenceLines = doc.splitTextToSize(LICENCE, PAGE_W - MARGIN * 2)
  doc.text(licenceLines, PAGE_W / 2, y + 4.5, { align: 'center' })
}

function drawClosingBox(
  doc: jsPDF,
  font: string,
  startY: number,
  footer: StatementPdfFooter,
): void {
  const boxH = 16
  let y = startY + 6
  if (y + boxH > PAGE_H - 22) {
    doc.addPage()
    y = 22
  }
  const x = MARGIN
  const w = PAGE_W - MARGIN * 2
  doc.setFillColor(...ROW_ALT)
  doc.roundedRect(x, y, w, boxH, 1.8, 1.8, 'F')

  const currency = footer.kind === 'balance' ? footer.currency || 'UGX' : footer.currency || 'UGX'
  setFont(doc, font, 'normal', 7)
  doc.setTextColor(...MUTED)
  if (footer.kind === 'balance') {
    doc.text('CURRENT BALANCE', x + w - 6, y + 5.5, { align: 'right' })
    setFont(doc, font, 'bold', 12)
    doc.setTextColor(17, 24, 39)
    doc.text(`${currency} ${formatMoney(footer.amount)}`, x + w - 6, y + 12, {
      align: 'right',
    })
    return
  }

  doc.text('TOTAL DEBIT', x + w / 2 - 8, y + 5.5, { align: 'right' })
  doc.text('TOTAL CREDIT', x + w - 6, y + 5.5, { align: 'right' })
  setFont(doc, font, 'bold', 11)
  doc.setTextColor(17, 24, 39)
  doc.text(`${currency} ${formatMoney(footer.debit)}`, x + w / 2 - 8, y + 12, {
    align: 'right',
  })
  doc.text(`${currency} ${formatMoney(footer.credit)}`, x + w - 6, y + 12, {
    align: 'right',
  })
}

function statementPeriodLabel(input: BuildStatementPdfInput): string {
  if (input.allTime) {
    const span = periodFromRows(input.rows)
    if (!span) return 'All time'
    return `All time (${formatPeriodDay(span.startDate)} – ${formatPeriodDay(span.endDate)})`
  }
  if (input.startDate && input.endDate) {
    return `${formatPeriodDay(input.startDate)} – ${formatPeriodDay(input.endDate)}`
  }
  return 'All time'
}

export async function buildStatementPdf(input: BuildStatementPdfInput): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as PdfWithTable
  const font = await registerOutfit(doc)
  const logo = await loadLogoDataUrl()
  const period = statementPeriodLabel(input)
  const generated = formatKampalaDateTime(new Date().toISOString())
  const statusLabel = statusFilterLabel(input.statuses)

  const heroBottom = drawHero(doc, font, logo)
  let y = heroBottom + 8
  const colW = (PAGE_W - MARGIN * 2 - 8) / 2
  drawMetaBlock(doc, font, MARGIN, y, colW, 'Name', input.name)
  drawMetaBlock(doc, font, MARGIN + colW + 8, y, colW, 'Wallet', input.walletLabel)
  y += 14
  drawMetaBlock(doc, font, MARGIN, y, colW, 'Period', period)
  drawMetaBlock(
    doc,
    font,
    MARGIN + colW + 8,
    y,
    colW,
    'Transactions',
    String(input.rows.length),
  )
  y += 14
  drawMetaBlock(doc, font, MARGIN, y, colW, 'Generated', generated)
  if (statusLabel) {
    drawMetaBlock(doc, font, MARGIN + colW + 8, y, colW, 'Status', statusLabel)
  }
  y += 12

  const body = input.rows.map((row) => [
    row.date,
    row.wallet,
    row.type,
    row.sender,
    row.receiver,
    row.debit,
    row.credit,
    row.status,
  ])

  autoTable(doc, {
    startY: y,
    margin: { top: 18, left: MARGIN, right: MARGIN, bottom: 22 },
    head: [['Date', 'Wallet', 'Type', 'Sender', 'Receiver', 'Debit', 'Credit', 'Status']],
    body: body.length
      ? body
      : [['—', '—', 'No transactions', '—', '—', '', '', '']],
    theme: 'plain',
    tableWidth: PAGE_W - MARGIN * 2,
    styles: {
      font,
      fontSize: 7,
      textColor: MUTED,
      cellPadding: { top: 1.6, bottom: 1.6, left: 1.2, right: 1.2 },
      overflow: 'linebreak',
      valign: 'top',
      minCellWidth: 12,
    },
    headStyles: {
      fillColor: HEADER_BG,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      valign: 'middle',
    },
    alternateRowStyles: { fillColor: ROW_ALT },
    columnStyles: {
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawContinuationHeader(doc, font, period)
      }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        data.cell.styles.lineWidth = { top: 0, right: 0, bottom: 0.12, left: 0 }
        data.cell.styles.lineColor = GREY_LINE
      }
    },
  })

  const tableEnd = doc.lastAutoTable?.finalY ?? y
  if (input.footer) {
    drawClosingBox(doc, font, tableEnd, input.footer)
  }

  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i)
    drawFooter(doc, font, i, pages)
  }

  return doc
}

export function downloadStatementPdf(doc: jsPDF, fileName: string): void {
  doc.save(fileName)
}
