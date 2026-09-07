'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2 } from 'lucide-react'
import api from '@/lib/axios'

const equityRequest = {
  timeout: 60000,
}

function ResultBox({ value }: { value: unknown }) {
  return (
    <pre className="mt-4 max-h-80 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">
      {value == null ? 'No response yet' : JSON.stringify(value, null, 2)}
    </pre>
  )
}

export default function EquityTestPage() {
  const router = useRouter()
  const [lookupAccount, setLookupAccount] = useState('')
  const [payoutAccount, setPayoutAccount] = useState('')
  const [payoutName, setPayoutName] = useState('')
  const [payoutAmount, setPayoutAmount] = useState('1000')
  const [payoutNarration, setPayoutNarration] = useState('Equity sandbox test')
  const [payoutReference, setPayoutReference] = useState('')
  const [statusReference, setStatusReference] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, unknown>>({})

  const healthQuery = useQuery({
    queryKey: ['equity-test-health'],
    queryFn: async () => {
      const response = await api.get('/equity/health', equityRequest)
      return response.data
    },
  })

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key)
    try {
      const data = await fn()
      setResults((prev) => ({ ...prev, [key]: data }))
      toast.success('Equity response received')
    } catch (error: any) {
      const data = error?.response?.data || { error: error?.message || 'Request failed' }
      setResults((prev) => ({ ...prev, [key]: data }))
      toast.error(data?.error || data?.message || 'Equity request failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('finance/partners/equity-test')} />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="outline" className="mb-3" onClick={() => router.push('/dashboard/finance/partners')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Partners
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Equity Bank test</h1>
          <p className="text-gray-600">
            Calls Equity directly (token, name lookup, float balance, intra payout, status). Admin only.
          </p>
        </div>
        {healthQuery.data?.configured ? (
          <Badge>Configured</Badge>
        ) : (
          <Badge variant="destructive">Not configured</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>1. Health / token</CardTitle>
            <CardDescription>Checks env and requests an OAuth token from Equity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => healthQuery.refetch()} disabled={healthQuery.isFetching}>
                Refresh health
              </Button>
              <Button
                onClick={() => run('token', async () => (await api.post('/equity/test/token', {}, equityRequest)).data)}
                disabled={busy !== null}
              >
                {busy === 'token' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get token
              </Button>
            </div>
            <ResultBox value={results.token ?? healthQuery.data} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Account name lookup</CardTitle>
            <CardDescription>GET /v1/account/lookup/name/56/&#123;account&#125;</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="lookup-account">Equity account number</Label>
            <Input
              id="lookup-account"
              className="mt-1 mb-3"
              value={lookupAccount}
              onChange={(e) => setLookupAccount(e.target.value)}
              placeholder="1036100123456"
            />
            <Button
              disabled={!lookupAccount.trim() || busy !== null}
              onClick={() =>
                run(
                  'lookup',
                  async () =>
                    (
                      await api.post(
                        '/equity/test/lookup',
                        { accountNumber: lookupAccount.trim(), bankSortCode: '300147' },
                        equityRequest,
                      )
                    ).data,
                )
              }
            >
              {busy === 'lookup' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lookup
            </Button>
            <ResultBox value={results.lookup} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Float balance</CardTitle>
            <CardDescription>Uses EQUITY_ACCOUNT_NUMBER from the server env.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              disabled={busy !== null}
              onClick={() =>
                run('balance', async () => (await api.get('/equity/test/balance', equityRequest)).data)
              }
            >
              {busy === 'balance' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check balance
            </Button>
            <ResultBox value={results.balance} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Intra-bank payout</CardTitle>
            <CardDescription>Sends a live sandbox transfer from the Equity float account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="payout-account">Destination account</Label>
              <Input
                id="payout-account"
                value={payoutAccount}
                onChange={(e) => setPayoutAccount(e.target.value)}
                placeholder="1036100123456"
              />
            </div>
            <div>
              <Label htmlFor="payout-name">Account name (optional)</Label>
              <Input
                id="payout-name"
                value={payoutName}
                onChange={(e) => setPayoutName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="payout-amount">Amount (UGX)</Label>
              <Input
                id="payout-amount"
                type="number"
                min={1}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="payout-ref">Reference (max 20, optional)</Label>
              <Input
                id="payout-ref"
                value={payoutReference}
                onChange={(e) => setPayoutReference(e.target.value)}
                maxLength={20}
              />
            </div>
            <div>
              <Label htmlFor="payout-narration">Narration</Label>
              <Textarea
                id="payout-narration"
                value={payoutNarration}
                onChange={(e) => setPayoutNarration(e.target.value)}
              />
            </div>
            <Button
              disabled={!payoutAccount.trim() || busy !== null}
              onClick={() =>
                run('payout', async () => {
                  const data = (
                    await api.post(
                      '/equity/test/payout',
                      {
                        accountNumber: payoutAccount.trim(),
                        accountName: payoutName.trim() || undefined,
                        amount: Number(payoutAmount),
                        currency: 'UGX',
                        reference: payoutReference.trim() || undefined,
                        narration: payoutNarration.trim() || undefined,
                        bankSortCode: '300147',
                      },
                      equityRequest,
                    )
                  ).data
                  const ref = data?.reference
                  if (ref) setStatusReference(String(ref))
                  return data
                })
              }
            >
              {busy === 'payout' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send payout
            </Button>
            <ResultBox value={results.payout} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>5. Transaction status</CardTitle>
            <CardDescription>GET /v3/transfer/transactiondetails/&#123;reference&#125;</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="status-ref">Reference</Label>
            <div className="mt-1 mb-3 flex gap-2">
              <Input
                id="status-ref"
                value={statusReference}
                onChange={(e) => setStatusReference(e.target.value)}
                placeholder="EQ123456789012"
              />
              <Button
                disabled={!statusReference.trim() || busy !== null}
                onClick={() =>
                  run(
                    'status',
                    async () =>
                      (
                        await api.get('/equity/test/status', {
                          ...equityRequest,
                          params: { reference: statusReference.trim() },
                        })
                      ).data,
                  )
                }
              >
                {busy === 'status' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Check status
              </Button>
            </div>
            <ResultBox value={results.status} />
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  )
}
