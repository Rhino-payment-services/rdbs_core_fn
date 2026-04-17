"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Wallet as WalletIcon, Loader2, ArrowLeft } from "lucide-react"
import Navbar from "@/components/dashboard/Navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/hooks/useWallets"
import { useWalletTransactionHistory } from "@/lib/hooks/useTransactions"
import { extractErrorMessage } from "@/lib/utils"

const pageSize = 20

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDateShort = (dateString: string) => {
  const date = new Date(dateString)
  const month = date.toLocaleDateString("en-US", { month: "short" })
  const day = date.getDate()
  const year = date.getFullYear()
  return `${month} ${day}, ${year}`
}

/**
 * Resolve the external payment rail label for a transaction.
 * Checks (in priority order):
 *  1. partnerMapping.partner.partnerCode  → ExternalPaymentPartner (ABC, Pegasus…)
 *  2. metadata MNO fields                 → MTN, Airtel…
 *  3. metadata bank fields                → bank name
 * Returns null when no external rail is identifiable (direct / API-only transactions).
 */
function getPaymentRailLabel(tx: any): string | null {
  const meta = tx?.metadata || {}

  // External payment partner (e.g. ABC bank gateway, Pegasus)
  const extPartner = tx?.partnerMapping?.partner
  if (extPartner) {
    const code = String(extPartner.partnerCode || '').trim()
    if (code) return code.toUpperCase()
    const name = String(extPartner.partnerName || '').trim()
    if (name) return name.split(/\s+/)[0].toUpperCase()
  }

  // MNO / mobile-money provider from metadata
  const mno =
    meta.mnoProvider ||
    meta.network ||
    meta.operator ||
    meta.counterpartyInfo?.provider ||
    meta.counterpartyInfo?.providerName ||
    meta.counterpartyInfo?.mnoProvider ||
    null
  if (mno) {
    return String(mno)
      .replace(/\s*mobile money\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase() || null
  }

  // Bank
  const bank =
    meta.bankName ||
    meta.bank ||
    meta.counterpartyInfo?.bankName ||
    meta.counterpartyInfo?.bank ||
    null
  if (bank) return String(bank).trim().toUpperCase()

  return null
}

const WalletStatementPage = () => {
  const params = useParams<{ walletId: string }>()
  const walletId = params.walletId
  const router = useRouter()
  const [page, setPage] = useState(1)

  const {
    data: walletResponse,
    isLoading: walletLoading,
    error: walletError,
  } = useWallet(walletId)

  const {
    data: walletStatement,
    isLoading: isStatementLoading,
    error: walletStatementError,
  } = useWalletTransactionHistory(walletId, {
    page,
    limit: pageSize,
  })

  const wallet = (walletResponse as any)?.data || walletResponse || null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/wallet")}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Wallet Statement</h1>
              {wallet && (
                <p className="text-sm text-gray-600 mt-1">
                  {wallet.description || `${wallet.walletType} Wallet`} · {wallet.currency}
                </p>
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="w-5 h-5 text-gray-600" />
              <span>Transactions</span>
            </CardTitle>
            <CardDescription>
              {wallet && (
                <>
                  Wallet ID{" "}
                  <span className="font-mono text-xs text-gray-700">{wallet.id}</span>
                  {wallet.user && (
                    <span className="block mt-1 text-xs text-gray-500">
                      Owner:{" "}
                      {wallet.user.profile?.firstName && wallet.user.profile?.lastName
                        ? `${wallet.user.profile.firstName} ${wallet.user.profile.lastName}`
                        : wallet.user.phone || wallet.user.email || "Unknown User"}
                    </span>
                  )}
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {walletLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Loading wallet...</p>
              </div>
            ) : walletError ? (
              <div className="py-8 text-center">
                <p className="text-sm text-red-600">
                  Failed to load wallet: {extractErrorMessage(walletError as any)}
                </p>
              </div>
            ) : null}

            {isStatementLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Loading wallet transactions...</p>
              </div>
            ) : walletStatementError ? (
              <div className="py-8 text-center">
                <p className="text-sm text-red-600">
                  Failed to load wallet statement: {extractErrorMessage(walletStatementError as any)}
                </p>
              </div>
            ) : !walletStatement || walletStatement.transactions.length === 0 ? (
              <div className="py-8 text-center">
                <WalletIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No transactions found for this wallet</p>
              </div>
            ) : (
              <>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Payment Rail</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {walletStatement.transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm text-gray-600">
                            {formatDateShort(tx.createdAt as any)}
                          </TableCell>
                          <TableCell className="text-xs font-mono">{tx.type}</TableCell>
                          <TableCell>
                            {(() => {
                              const rail = getPaymentRailLabel(tx)
                              return rail ? (
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                                  {rail}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )
                            })()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                tx.direction === "INCOMING"
                                  ? "border-green-500 text-green-700"
                                  : "border-red-500 text-red-700"
                              }
                            >
                              {tx.direction || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold">
                            {formatCurrency(
                              Number(tx.amount),
                              tx.currency || wallet?.currency || "UGX",
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono max-w-[160px] truncate">
                            {tx.reference || "—"}
                          </TableCell>
                          <TableCell className="text-xs max-w-[260px] truncate">
                            {tx.description || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {walletStatement.pagination && (
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
                    <span>
                      Page{" "}
                      <span className="font-semibold">{walletStatement.pagination.page}</span> of{" "}
                      <span className="font-semibold">{walletStatement.pagination.pages}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={walletStatement.pagination.page <= 1}
                        onClick={() =>
                          setPage((prev) => Math.max(1, prev - 1))
                        }
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={walletStatement.pagination.page >= walletStatement.pagination.pages}
                        onClick={() =>
                          setPage((prev) =>
                            Math.min(walletStatement.pagination.pages, prev + 1),
                          )
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default WalletStatementPage

