"use client"

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { Button } from './button'

export function TableTabsTest() {
  const [activeTab, setActiveTab] = useState('utility')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">External Transaction Mappings (4)</h2>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="utility" className="flex items-center gap-2">
              <span>⚡</span>
              Utility Bills
            </TabsTrigger>
            <TabsTrigger value="wallet-mno" className="flex items-center gap-2">
              <span>📱</span>
              Wallet to MNO
            </TabsTrigger>
            <TabsTrigger value="mno-wallet" className="flex items-center gap-2">
              <span>📱</span>
              MNO to Wallet
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex items-center gap-2">
              <span>🏦</span>
              Bank Transfers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="utility" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Utility Bills</h3>
                  <p className="text-gray-600">Electricity, Water, TV subscriptions</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Current Partner</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">A</span>
                        </div>
                        <div>
                          <div className="font-medium">ABC Payment Gateway</div>
                          <div className="text-sm text-gray-500">Regions not configured</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>0% success</div>
                        <div>0ms avg</div>
                      </div>
                    </TableCell>
                    <TableCell>0 UGX</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Priority:</div>
                        <div>Failover:</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                        Inactive
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          👁️
                        </Button>
                        <Button variant="ghost" size="sm">
                          ↕️
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="wallet-mno" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-xl">📱</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Wallet to MNO</h3>
                  <p className="text-gray-600">Wallet to Mobile Network Operator transfers</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Current Partner</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">A</span>
                        </div>
                        <div>
                          <div className="font-medium">ABC Payment Gateway</div>
                          <div className="text-sm text-gray-500">All networks supported</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>95% success</div>
                        <div>1200ms avg</div>
                      </div>
                    </TableCell>
                    <TableCell>50 UGX</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Priority: Primary</div>
                        <div>Failover: Pegasus</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Active
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          👁️
                        </Button>
                        <Button variant="ghost" size="sm">
                          ↕️
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="mno-wallet" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-xl">📱</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">MNO to Wallet</h3>
                  <p className="text-gray-600">Mobile Network Operator to Wallet transfers</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Current Partner</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-semibold">P</span>
                        </div>
                        <div>
                          <div className="font-medium">Pegasus Payment Gateway</div>
                          <div className="text-sm text-gray-500">Collection API enabled</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>98% success</div>
                        <div>800ms avg</div>
                      </div>
                    </TableCell>
                    <TableCell>30 UGX</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Priority: Primary</div>
                        <div>Failover: ABC</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Active
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          👁️
                        </Button>
                        <Button variant="ghost" size="sm">
                          ↕️
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="bank" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-xl">🏦</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Bank Transfers</h3>
                  <p className="text-gray-600">Direct bank account transfers</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Current Partner</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">A</span>
                        </div>
                        <div>
                          <div className="font-medium">ABC Payment Gateway</div>
                          <div className="text-sm text-gray-500">Bank integration active</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>92% success</div>
                        <div>2000ms avg</div>
                      </div>
                    </TableCell>
                    <TableCell>100 UGX</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Priority: Primary</div>
                        <div>Failover: Manual</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Active
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          👁️
                        </Button>
                        <Button variant="ghost" size="sm">
                          ↕️
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
