"use client"
import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield,
  Radar,
  AlertTriangle,
  Monitor,
  ShieldCheck
} from 'lucide-react'
import SecurityStatsCards from '@/components/dashboard/security/SecurityStatsCards'
import SecurityOverview from '@/components/dashboard/security/SecurityOverview'
import SecurityRadar from '@/components/dashboard/security/SecurityRadar'
import SecurityIncidents from '@/components/dashboard/security/SecurityIncidents'
import SecurityPlatforms from '@/components/dashboard/security/SecurityPlatforms'
import SecurityPolicies from '@/components/dashboard/security/SecurityPolicies'
import toast from 'react-hot-toast'

const SecurityPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedRisk, setSelectedRisk] = useState("all")
  const [timeRange, setTimeRange] = useState("24h")
  const [activeTab, setActiveTab] = useState("overview")

  // Flagged transactions data (Radar)
  const flaggedTransactions = [
    {
      id: 1,
      timestamp: "2024-01-15 14:30:25",
      transactionId: "TXN_123456789",
      user: "john.doe@email.com",
      amount: 5000000,
      currency: "UGX",
      riskLevel: "high",
      status: "flagged",
      reason: "Unusual transaction pattern",
      ip: "192.168.1.100",
      location: "Kampala, Uganda",
      device: "Mobile",
      riskScore: 85,
      flags: ["large_amount", "new_device", "unusual_time"],
      description: "Large transaction from new device at unusual time",
      action: "pending",
      metadata: {
        previousTransactions: 3,
        accountAge: "2 weeks",
        deviceType: "iPhone 15",
        browser: "Safari",
        os: "iOS 17.0"
      }
    },
    {
      id: 2,
      timestamp: "2024-01-15 14:25:15",
      transactionId: "TXN_987654321",
      user: "sarah.smith@email.com",
      amount: 2500000,
      currency: "UGX",
      riskLevel: "medium",
      status: "reviewed",
      reason: "Multiple failed attempts",
      ip: "203.0.113.45",
      location: "Unknown",
      device: "Desktop",
      riskScore: 65,
      flags: ["multiple_failures", "suspicious_ip", "location_mismatch"],
      description: "Multiple failed login attempts from suspicious IP",
      action: "blocked",
      metadata: {
        failedAttempts: 8,
        timeWindow: "15 minutes",
        previousLocation: "Kampala, Uganda",
        currentLocation: "Unknown"
      }
    }
  ]

  // Security incidents data
  const securityIncidents = [
    {
      id: 1,
      timestamp: "2024-01-15 14:30:00",
      type: "brute_force",
      severity: "high",
      status: "active",
      description: "Multiple failed login attempts detected",
      affectedUsers: 15,
      ipAddresses: ["203.0.113.45", "198.51.100.67"],
      location: "Multiple",
      action: "IP blocking",
      metadata: {
        attempts: 150,
        timeWindow: "30 minutes",
        successRate: "0%"
      }
    },
    {
      id: 2,
      timestamp: "2024-01-15 14:25:00",
      type: "suspicious_activity",
      severity: "medium",
      status: "investigating",
      description: "Unusual transaction patterns detected",
      affectedUsers: 8,
      ipAddresses: ["192.168.1.100"],
      location: "Kampala, Uganda",
      action: "Enhanced monitoring",
      metadata: {
        transactionCount: 25,
        amountTotal: "UGX 15,000,000",
        timeWindow: "2 hours"
      }
    }
  ]

  // Platform status data
  const platformStatus = [
    {
      id: 1,
      name: "Merchant App",
      type: "Mobile Application",
      status: "active",
      uptime: 99.8,
      lastCheck: "2024-01-15 14:30:00",
      responseTime: 245,
      users: 1247,
      version: "2.1.4",
      environment: "Production",
      health: "excellent",
      issues: []
    },
    {
      id: 2,
      name: "Subscriber App",
      type: "Mobile Application",
      status: "active",
      uptime: 99.9,
      lastCheck: "2024-01-15 14:30:00",
      responseTime: 189,
      users: 45231,
      version: "3.2.1",
      environment: "Production",
      health: "excellent",
      issues: []
    },
    {
      id: 3,
      name: "Agent App",
      type: "Mobile Application",
      status: "active",
      uptime: 99.7,
      lastCheck: "2024-01-15 14:30:00",
      responseTime: 312,
      users: 892,
      version: "1.8.3",
      environment: "Production",
      health: "good",
      issues: ["Minor performance degradation"]
    }
  ]

  // Security policies data
  const securityPolicies = [
    {
      id: 1,
      name: "Password Policy",
      status: "active",
      lastUpdated: "2024-01-10",
      description: "Minimum 12 characters, mixed case, numbers, symbols",
      compliance: 98,
      violations: 12,
      category: "authentication"
    },
    {
      id: 2,
      name: "Transaction Limits",
      status: "active",
      lastUpdated: "2024-01-12",
      description: "Daily limit UGX 5M, monthly limit UGX 50M",
      compliance: 95,
      violations: 8,
      category: "transactions"
    },
    {
      id: 3,
      name: "Device Verification",
      status: "active",
      lastUpdated: "2024-01-08",
      description: "Two-factor authentication for new devices",
      compliance: 92,
      violations: 25,
      category: "authentication"
    },
    {
      id: 4,
      name: "Geographic Restrictions",
      status: "active",
      lastUpdated: "2024-01-15",
      description: "Block transactions from high-risk countries",
      compliance: 100,
      violations: 0,
      category: "location"
    }
  ]

  const stats = {
    totalFlagged: flaggedTransactions.length,
    highRisk: flaggedTransactions.filter(t => t.riskLevel === 'high').length,
    pendingReview: flaggedTransactions.filter(t => t.status === 'pending').length,
    blocked: flaggedTransactions.filter(t => t.action === 'blocked').length,
    totalIncidents: securityIncidents.length,
    activeIncidents: securityIncidents.filter(i => i.status === 'active').length,
    criticalIncidents: securityIncidents.filter(i => i.severity === 'critical').length,
    policiesCompliance: Math.round(securityPolicies.reduce((acc, policy) => acc + policy.compliance, 0) / securityPolicies.length)
  }

  const handleRefresh = () => {
    toast.success('Refreshing security data...')
    // TODO: Implement refresh functionality
  }

  const handleExport = () => {
    toast.success('Exporting security data...')
    // TODO: Implement export functionality
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <SecurityStatsCards
            stats={stats}
            onRefresh={handleRefresh}
            onExport={handleExport}
          />

          {/* Security Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="radar" className="flex items-center gap-2">
                <Radar className="h-4 w-4" />
                Radar Actions
              </TabsTrigger>
              <TabsTrigger value="incidents" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Incidents
              </TabsTrigger>
              <TabsTrigger value="platforms" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Platforms
              </TabsTrigger>
              <TabsTrigger value="policies" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Policies
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Tab Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="overview" className="space-y-6">
              <SecurityOverview
                activeIncidents={stats.activeIncidents}
                securityIncidents={securityIncidents}
              />
            </TabsContent>

            <TabsContent value="radar" className="space-y-6">
              <SecurityRadar
                flaggedTransactions={flaggedTransactions}
                searchTerm={searchTerm}
                selectedStatus={selectedStatus}
                selectedRisk={selectedRisk}
                timeRange={timeRange}
                onSearchChange={setSearchTerm}
                onStatusChange={setSelectedStatus}
                onRiskChange={setSelectedRisk}
                onTimeRangeChange={setTimeRange}
              />
            </TabsContent>

            <TabsContent value="incidents" className="space-y-6">
              <SecurityIncidents
                securityIncidents={securityIncidents}
              />
            </TabsContent>

            <TabsContent value="platforms" className="space-y-6">
              <SecurityPlatforms
                platformStatus={platformStatus}
              />
            </TabsContent>

            <TabsContent value="policies" className="space-y-6">
              <SecurityPolicies
                securityPolicies={securityPolicies}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default SecurityPage 