# Suspicious Transaction Detection and User Blocking

## Overview
This feature provides automated detection of suspicious transaction patterns and allows administrators to block users who exhibit fraudulent or suspicious behavior.

## Features

### 1. Suspicious Transaction Detection
The system automatically detects the following suspicious patterns:

- **Multiple Failed Transactions**: Users with 5+ failed transactions within 1 hour
- **Large Amount Failures**: Failed transactions exceeding 10M UGX
- **Rapid Successive Transactions**: 5+ transactions within 5 minutes
- **High Failure Rate**: Users with >70% failure rate (minimum 10 transactions)

### 2. Risk Scoring
Each suspicious transaction and user is assigned a risk score (0-100) and risk level:
- **Critical**: Risk score ≥ 80 (e.g., large failed amounts, multiple rapid failures)
- **High**: Risk score 60-79 (e.g., rapid transactions, high failure rate)
- **Medium**: Risk score 40-59
- **Low**: Risk score < 40

### 3. User Blocking
Administrators can:
- View all users with suspicious activity patterns
- See detailed transaction history for each suspicious user
- Block users with a reason
- Unblock previously blocked users
- View risk scores and flags for each user

## Implementation

### Files Created

1. **`lib/hooks/useSuspiciousTransactions.ts`**
   - Detects suspicious transaction patterns
   - Groups transactions by user
   - Calculates risk scores
   - Provides hooks: `useSuspiciousTransactions()`, `useSuspiciousUsers()`

2. **`lib/hooks/useUserBlocking.ts`**
   - Handles user blocking/unblocking
   - Provides hooks: `useBlockUser()`, `useUnblockUser()`
   - Updates user status to SUSPENDED/ACTIVE

3. **`components/dashboard/security/SuspiciousUsersTable.tsx`**
   - UI component displaying suspicious users
   - Shows risk scores, transaction counts, flags
   - Expandable transaction details
   - Block/unblock dialogs

### Integration

The suspicious users feature is integrated into the Security Dashboard:
- **Location**: `/dashboard/security`
- **Tab**: "Suspicious Users" (5th tab)
- **Access**: Available to users with security permissions

## Usage

### Viewing Suspicious Users
1. Navigate to Security Dashboard
2. Click on "Suspicious Users" tab
3. Review users sorted by risk score (highest first)
4. Expand user rows to see detailed transaction history

### Blocking a User
1. Click "Block" button next to suspicious user
2. Enter reason for blocking
3. Review suspicious activity summary
4. Confirm blocking action

### Unblocking a User
1. Find blocked user in the table
2. Click "Unblock" button
3. Confirm unblocking action

## API Endpoints Used

- `GET /transactions?limit={limit}` - Fetch transactions for analysis
- `GET /users?ids={ids}` - Check user status (blocked/suspended)
- `PATCH /users/{userId}/status` - Update user status (block/unblock)

## Risk Flags

The system tracks various flags for suspicious activity:
- `multiple_failed_transactions` - Multiple failures detected
- `rapid_failures` - Failures occurring rapidly
- `large_amount` - Unusually large transaction amount
- `failed_large_transaction` - Large transaction that failed
- `rapid_transactions` - Multiple transactions in short time
- `velocity_check` - Velocity pattern detected
- `high_failure_rate` - User has high percentage of failures

## Future Enhancements

Potential improvements:
- Real-time alerts for critical risk users
- Automated blocking based on configurable thresholds
- Machine learning-based fraud detection
- Integration with external fraud detection services
- Customizable risk scoring rules
- Email notifications for security team
