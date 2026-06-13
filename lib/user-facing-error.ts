const MAX_USER_FACING_MESSAGE_LENGTH = 100

const TECHNICAL_PATTERNS = [
  /\{[\s\S]*"[\w]+"[\s\S]*\}/,
  /\bat\s+[\w./]+\(/,
  /\bprisma\b/i,
  /\bECONNREFUSED\b/,
  /\bstack\s*trace\b/i,
  /\bKey:\s*'/,
  /\bError:\s*Field validation\b/i,
]

const MESSAGE_RULES: Array<{ test: RegExp; message: string }> = [
  { test: /insufficient\s+(funds|balance)/i, message: 'Insufficient wallet balance.' },
  { test: /daily\s+limit/i, message: 'Daily transaction limit reached.' },
  { test: /wallet\s+not\s+found/i, message: 'Wallet not found.' },
  { test: /user\s+not\s+found|account\s+not\s+found|customer\s+not\s+found/i, message: 'Account not found.' },
  { test: /invalid\s+phone|phone\s+number\s+format/i, message: 'Invalid phone number.' },
  { test: /invalid\s+pin|incorrect\s+pin|wrong\s+pin/i, message: 'Incorrect PIN.' },
  { test: /token\s+(has\s+)?expired|session\s+expired/i, message: 'Session expired. Please log in again.' },
  { test: /too\s+many\s+requests|rate\s+limit/i, message: 'Too many requests. Please wait and try again.' },
  { test: /duplicate|already\s+(exists|used|submitted)|still\s+processing|still\s+pending/i, message: 'This transaction was already submitted.' },
  { test: /permission|not\s+allowed|forbidden/i, message: 'You do not have permission for this action.' },
  { test: /unauthorized|authentication\s+failed|log\s*in\s+again/i, message: 'Please log in again.' },
  { test: /timeout|timed\s+out|no\s+response/i, message: 'Request timed out. Please try again.' },
  { test: /network|connection|unreachable|offline/i, message: 'Connection problem. Check your network and try again.' },
]

function isTechnicalMessage(message: string): boolean {
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(message))
}

function truncateMessage(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, ' ')
  if (trimmed.length <= MAX_USER_FACING_MESSAGE_LENGTH) return trimmed
  return `${trimmed.slice(0, MAX_USER_FACING_MESSAGE_LENGTH - 1).trimEnd()}…`
}

function fallbackForStatus(statusCode?: number | null): string {
  switch (statusCode) {
    case 400:
      return 'Invalid request. Please check your details.'
    case 401:
      return 'Please log in again.'
    case 403:
      return 'You do not have permission for this action.'
    case 404:
      return 'Requested item was not found.'
    case 409:
      return 'This action conflicts with the current state.'
    case 429:
      return 'Too many requests. Please wait and try again.'
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again.'
    default:
      if (statusCode && statusCode >= 500) {
        return 'Something went wrong. Please try again.'
      }
      return 'Something went wrong. Please try again.'
  }
}

function mapByPattern(message: string): string | null {
  for (const rule of MESSAGE_RULES) {
    if (rule.test.test(message)) return rule.message
  }
  return null
}

export function toUserFacingMessage(raw: unknown, statusCode?: number | null): string {
  const message = Array.isArray(raw)
    ? String(raw[0] ?? '').trim()
    : String(raw ?? '').trim()

  if (!message) return fallbackForStatus(statusCode)

  const mapped = mapByPattern(message)
  if (mapped) return mapped

  if (isTechnicalMessage(message) || message.length > MAX_USER_FACING_MESSAGE_LENGTH) {
    return fallbackForStatus(statusCode)
  }

  return truncateMessage(message)
}
