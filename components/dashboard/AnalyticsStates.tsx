'use client'

import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface AnalyticsErrorAlertProps {
  message: string
  context?: string
  onRetry?: () => void
  isRetrying?: boolean
}

export function AnalyticsErrorAlert({
  message,
  context,
  onRetry,
  isRetrying = false,
}: AnalyticsErrorAlertProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {context ? `Failed to load ${context}` : 'Failed to load analytics'}
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{message || 'Something went wrong while loading this data.'}</span>
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="shrink-0 border-destructive/30 bg-background"
          >
            {isRetrying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </>
            )}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
