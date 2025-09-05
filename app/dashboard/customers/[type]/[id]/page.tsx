"use client"
import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/dashboard/Navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User,
  CreditCard,
  Activity,
  Settings
} from 'lucide-react'
import CustomerProfileHeader from '@/components/dashboard/customers/profile/CustomerProfileHeader'
import toast from 'react-hot-toast'
import CustomerStatsCards from '@/components/dashboard/customers/profile/CustomerStatsCards'
import CustomerOverview from '@/components/dashboard/customers/profile/CustomerOverview'
import CustomerTransactions from '@/components/dashboard/customers/profile/CustomerTransactions'
import CustomerActivity from '@/components/dashboard/customers/profile/CustomerActivity'
import CustomerSettings from '@/components/dashboard/customers/profile/CustomerSettings'

const CustomerProfilePage = () => {
  const params = useParams()
  const router = useRouter()
  const { type, id } = params
  const [activeTab, setActiveTab] = useState("overview")

  // Sample customer profile data
  const customerProfile = {
    id: id,
    type: type,
    name: "John Doe",
    email: "john.doe@email.com",
    phone: "+256 701 234 567",
    status: "active",
    joinDate: "2024-01-15",
    lastActivity: "2024-01-20",
    location: "Kampala, Uganda",
    address: "Plot 123, Kampala Road, Kampala",
    totalTransactions: 45,
    totalVolume: 1250000,
    avgTransactionValue: 27777,
    successRate: 98.5,
    kycStatus: "verified",
    kycLevel: "level_2",
    riskLevel: "low",
    tags: ["Premium", "Verified", "Active"],
    notes: "Reliable customer with consistent transaction patterns",
    
    // Profile details based on type
    profileDetails: {
      subscribers: {
        dateOfBirth: "1990-05-15",
        gender: "Male",
        occupation: "Software Engineer",
        company: "Tech Solutions Ltd",
        emergencyContact: "+256 702 345 678",
        preferredLanguage: "English",
        notificationPreferences: {
          email: true,
          sms: true,
          push: true
        }
      },
      merchants: {
        businessName: "ABC Supermarket",
        businessType: "Retail",
        registrationNumber: "REG123456",
        taxNumber: "TAX789012",
        businessAddress: "Plot 456, Commercial Street, Kampala",
        contactPerson: "Jane Manager",
        contactPhone: "+256 704 567 890",
        businessCategory: "Retail",
        annualRevenue: 500000000,
        employeeCount: 25,
        operatingHours: "8:00 AM - 8:00 PM",
        website: "www.abcsupermarket.com"
      },
      partners: {
        companyName: "East Africa Bank",
        partnershipType: "Banking Partner",
        partnershipDate: "2023-08-15",
        contractNumber: "CONTRACT-2023-001",
        contactPerson: "Sarah Partner",
        contactPhone: "+256 707 890 123",
        partnershipLevel: "Strategic",
        integrationStatus: "Active",
        apiAccess: true,
        revenueShare: 2.5,
        serviceLevel: "Premium"
      },
      agents: {
        agentId: "AGT-001",
        agentType: "Field Agent",
        supervisor: "Mike Supervisor",
        supervisorPhone: "+256 710 123 456",
        territory: "Kampala Central",
        commissionRate: 2.5,
        performanceRating: 4.8,
        trainingCompleted: true,
        lastTraining: "2024-01-10",
        equipment: ["POS Device", "Mobile App", "ID Card"],
        workingHours: "9:00 AM - 6:00 PM"
      },
      superAgents: {
        superAgentId: "SAGT-001",
        networkName: "Super Agent Network",
        subAgentsCount: 45,
        territoryCoverage: "Kampala Region",
        commissionStructure: "Tiered",
        performanceMetrics: {
          totalVolume: 125000000,
          totalTransactions: 2500,
          successRate: 99.2,
          customerSatisfaction: 4.9
        },
        networkHealth: "Excellent",
        expansionPlans: "Planning to expand to Jinja"
      },
      banks: {
        bankName: "Central Bank of Uganda",
        bankType: "Central Bank",
        licenseNumber: "LIC-001",
        regulatoryStatus: "Compliant",
        integrationDate: "2023-06-15",
        apiEndpoints: 5,
        transactionVolume: 450000000,
        uptime: 99.9,
        supportLevel: "24/7",
        complianceStatus: "Fully Compliant"
      }
    },

    // Transaction history
    transactions: [
      {
        id: 1,
        type: "Wallet to Wallet",
        amount: 50000,
        fee: 2500,
        status: "completed",
        date: "2024-01-20 14:30:00",
        sender: {
          id: 1,
          name: "John Doe",
          type: "subscribers",
          phone: "+256 701 234 567"
        },
        receiver: {
          id: 2,
          name: "Jane Smith",
          type: "subscribers",
          phone: "+256 702 345 678"
        },
        reference: "TXN-2024-001",
        description: "Monthly rent payment"
      },
      {
        id: 2,
        type: "Wallet to Mobile Money",
        amount: 25000,
        fee: 1250,
        status: "completed",
        date: "2024-01-19 10:15:00",
        sender: {
          id: 1,
          name: "John Doe",
          type: "subscribers",
          phone: "+256 701 234 567"
        },
        receiver: {
          id: 7,
          name: "MTN Mobile Money",
          type: "partners",
          phone: "+256 777 123 456"
        },
        reference: "TXN-2024-002",
        description: "Send to mobile money"
      }
    ],

    // Activity log
    activities: [
      {
        id: 1,
        type: "login",
        description: "User logged in successfully",
        timestamp: "2024-01-20 14:30:00",
        ipAddress: "192.168.1.100",
        device: "iPhone 14",
        location: "Kampala, Uganda"
      },
      {
        id: 2,
        type: "transaction",
        description: "Completed money transfer of UGX 50,000",
        timestamp: "2024-01-20 14:25:00",
        ipAddress: "192.168.1.100",
        device: "iPhone 14",
        location: "Kampala, Uganda"
      }
    ]
  }

  const handleBack = () => {
    router.back()
  }

  const handleExport = () => {
    toast.success('Exporting customer data...')
    // TODO: Implement export functionality
  }

  const handleEdit = () => {
    toast.success('Opening edit form...')
    // TODO: Implement edit functionality
  }

  const handleActions = () => {
    toast.success('Opening actions menu...')
    // TODO: Implement actions menu
  }

  const handleConfigureNotifications = () => {
    toast.success('Opening notification settings...')
    // TODO: Implement notification configuration
  }

  const handleConfigureSecurity = () => {
    toast.success('Opening security settings...')
    // TODO: Implement security configuration
  }

  const handleViewLoginHistory = () => {
    toast.success('Opening login history...')
    // TODO: Implement login history view
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <CustomerProfileHeader
            customer={{
              id: customerProfile.id as string,
              name: customerProfile.name,
              type: customerProfile.type as string
            }}
            onBack={handleBack}
            onExport={handleExport}
            onEdit={handleEdit}
            onActions={handleActions}
          />

          {/* Stats Cards */}
          <CustomerStatsCards
            stats={{
              totalTransactions: customerProfile.totalTransactions,
              totalVolume: customerProfile.totalVolume,
              avgTransactionValue: customerProfile.avgTransactionValue,
              successRate: customerProfile.successRate,
              status: customerProfile.status,
              joinDate: customerProfile.joinDate,
              kycStatus: customerProfile.kycStatus,
              riskLevel: customerProfile.riskLevel
            }}
          />

          {/* Profile Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <CustomerOverview
                customer={{
                  name: customerProfile.name,
                  email: customerProfile.email,
                  phone: customerProfile.phone,
                  status: customerProfile.status,
                  joinDate: customerProfile.joinDate,
                  location: customerProfile.location,
                  address: customerProfile.address
                }}
                type={customerProfile.type as string}
                profileDetails={customerProfile.profileDetails}
              />
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6 mt-6">
              <CustomerTransactions
                transactions={customerProfile.transactions}
                onExport={handleExport}
                onFilter={() => toast.success('Opening transaction filters...')}
              />
            </TabsContent>

            <TabsContent value="activity" className="space-y-6 mt-6">
              <CustomerActivity
                activities={customerProfile.activities}
                onExport={handleExport}
                onFilter={() => toast.success('Opening activity filters...')}
              />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-6">
              <CustomerSettings
                onConfigureNotifications={handleConfigureNotifications}
                onConfigureSecurity={handleConfigureSecurity}
                onViewLoginHistory={handleViewLoginHistory}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default CustomerProfilePage 