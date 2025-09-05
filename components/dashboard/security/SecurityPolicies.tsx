"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'

interface SecurityPolicy {
  id: number
  name: string
  status: string
  lastUpdated: string
  description: string
  compliance: number
  violations: number
  category: string
}

interface SecurityPoliciesProps {
  securityPolicies: SecurityPolicy[]
}

const SecurityPolicies = ({ securityPolicies }: SecurityPoliciesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Policies</CardTitle>
        <CardDescription>
          Active security policies and compliance status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-48">Policy Name</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-32">Compliance</TableHead>
                <TableHead className="w-32">Violations</TableHead>
                <TableHead className="w-64">Description</TableHead>
                <TableHead className="w-32">Last Updated</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {securityPolicies.map((policy) => (
                <TableRow key={policy.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="text-sm font-medium">{policy.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={policy.compliance} className="w-16" />
                      <span className="text-sm font-medium">{policy.compliance}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{policy.violations}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">{policy.description}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">{policy.lastUpdated}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default SecurityPolicies 