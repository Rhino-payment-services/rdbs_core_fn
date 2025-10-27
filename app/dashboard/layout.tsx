"use client"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Remove all session checks from layout - let middleware handle it
  return <>{children}</>
}
