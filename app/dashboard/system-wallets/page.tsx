import { redirect } from 'next/navigation'

/** @deprecated Use /dashboard/platform-revenue */
export default function SystemWalletsRedirectPage() {
  redirect('/dashboard/platform-revenue')
}
