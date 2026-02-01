'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { RoleGuard } from '@/components/ui/PermissionGuard';
import Navbar from '@/components/dashboard/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import toast from 'react-hot-toast';
import { Building2, UserPlus, Users, Link2, Unlink, RefreshCw, Search, Crown, ShieldAlert } from 'lucide-react';
import api from '@/lib/axios';

interface SuperMerchant {
  id: string;
  userId: string;
  merchantCode: string;
  businessTradeName: string;
  isActive: boolean;
  isVerified: boolean;
  childMerchantsCount: number;
}

interface AvailableMerchant {
  id: string;
  merchantCode: string;
  businessTradeName: string;
  ownerFirstName: string;
  ownerLastName: string;
  isActive: boolean;
  isVerified: boolean;
  parentMerchantId?: string | null;
}

interface AllMerchant {
  id: string;
  merchantCode: string;
  businessTradeName: string;
  ownerFirstName: string;
  ownerLastName: string;
  isActive: boolean;
  isVerified: boolean;
  isSuperMerchant?: boolean;
}

const AccessDeniedFallback = () => {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center max-w-md text-center">
        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-6">
          Only Super Admins can manage super merchants and assign merchants. Contact your administrator if you need access.
        </p>
        <Button variant="outline" onClick={() => router.push('/dashboard/customers')}>
          Back to Customers
        </Button>
      </div>
    </div>
  );
};

export default function SuperMerchantsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [superMerchants, setSuperMerchants] = useState<SuperMerchant[]>([]);
  const [availableMerchants, setAvailableMerchants] = useState<AvailableMerchant[]>([]);
  const [allMerchants, setAllMerchants] = useState<AllMerchant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuperMerchant, setSelectedSuperMerchant] = useState<string>('');
  const [selectedMerchantToAssign, setSelectedMerchantToAssign] = useState<string>('');
  const [selectedMerchantToGrant, setSelectedMerchantToGrant] = useState<string>('');
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [childMerchants, setChildMerchants] = useState<any[]>([]);
  const [viewChildrenDialogOpen, setViewChildrenDialogOpen] = useState(false);
  const [viewingSuperMerchant, setViewingSuperMerchant] = useState<SuperMerchant | null>(null);

  useEffect(() => {
    fetchSuperMerchants();
    fetchAvailableMerchants();
    fetchAllMerchants();
  }, []);

  const fetchSuperMerchants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/super-merchant/list');
      setSuperMerchants(response.data.superMerchants || []);
    } catch (error: any) {
      console.error('Error fetching super merchants:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch super merchants');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMerchants = async () => {
    try {
      const response = await api.get('/super-merchant/available-merchants?limit=100');
      setAvailableMerchants(response.data.merchants || []);
    } catch (error: any) {
      console.error('Error fetching available merchants:', error);
    }
  };

  const fetchAllMerchants = async () => {
    try {
      // Fetch all merchants that are not already super merchants
      const response = await api.get('/super-merchant/available-merchants?limit=200');
      setAllMerchants(response.data.merchants || []);
    } catch (error: any) {
      console.error('Error fetching all merchants:', error);
    }
  };

  const handleGrantSuperMerchant = async () => {
    if (!selectedMerchantToGrant) {
      toast.error('Please select a merchant');
      return;
    }

    try {
      const response = await api.post('/super-merchant/grant', { merchantId: selectedMerchantToGrant });
      toast.success(response.data.message || 'Successfully granted SUPER_MERCHANT status');
      setSelectedMerchantToGrant('');
      setGrantDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['merchants'] });
      fetchSuperMerchants();
      fetchAvailableMerchants();
      fetchAllMerchants();
    } catch (error: any) {
      console.error('Error granting super merchant:', error);
      toast.error(error?.response?.data?.message || 'Failed to grant SUPER_MERCHANT status');
    }
  };

  const handleRevokeSuperMerchant = async (merchantId: string) => {
    if (!confirm('Are you sure you want to revoke SUPER_MERCHANT status from this merchant?')) {
      return;
    }

    try {
      const response = await api.delete(`/super-merchant/revoke/${merchantId}`);
      toast.success(response.data.message || 'Successfully revoked SUPER_MERCHANT status');
      await queryClient.invalidateQueries({ queryKey: ['merchants'] });
      fetchSuperMerchants();
      fetchAvailableMerchants();
      fetchAllMerchants();
    } catch (error: any) {
      console.error('Error revoking super merchant:', error);
      toast.error(error?.response?.data?.message || 'Failed to revoke SUPER_MERCHANT status');
    }
  };

  const handleAssignMerchant = async () => {
    if (!selectedSuperMerchant || !selectedMerchantToAssign) {
      toast.error('Please select both a super merchant and a merchant to assign');
      return;
    }

    try {
      const response = await api.post('/super-merchant/assign', {
        superMerchantId: selectedSuperMerchant,
        merchantId: selectedMerchantToAssign,
      });
      toast.success(response.data.message || 'Successfully assigned merchant');
      setSelectedMerchantToAssign('');
      setAssignDialogOpen(false);
      fetchSuperMerchants();
      fetchAvailableMerchants();
    } catch (error: any) {
      console.error('Error assigning merchant:', error);
      toast.error(error?.response?.data?.message || 'Failed to assign merchant');
    }
  };

  const handleUnassignMerchant = async (merchantId: string) => {
    if (!confirm('Are you sure you want to unassign this merchant?')) {
      return;
    }

    try {
      const response = await api.delete(`/super-merchant/unassign/${merchantId}`);
      toast.success(response.data.message || 'Successfully unassigned merchant');
      fetchSuperMerchants();
      fetchAvailableMerchants();
      if (viewingSuperMerchant) {
        fetchChildMerchants(viewingSuperMerchant.id);
      }
    } catch (error: any) {
      console.error('Error unassigning merchant:', error);
      toast.error(error?.response?.data?.message || 'Failed to unassign merchant');
    }
  };

  const fetchChildMerchants = async (superMerchantId: string) => {
    try {
      const response = await api.get(`/super-merchant/child-merchants/${superMerchantId}`);
      setChildMerchants(response.data.childMerchants || []);
    } catch (error: any) {
      console.error('Error fetching child merchants:', error);
      toast.error('Failed to fetch child merchants');
    }
  };

  const openViewChildrenDialog = (superMerchant: SuperMerchant) => {
    setViewingSuperMerchant(superMerchant);
    fetchChildMerchants(superMerchant.id);
    setViewChildrenDialogOpen(true);
  };

  const filteredSuperMerchants = superMerchants.filter(
    (sm) =>
      sm.businessTradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sm.merchantCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGuard role="SUPER_ADMIN" showFallback fallback={<AccessDeniedFallback />}>
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Super Merchants Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage super merchants and their assigned merchants
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { fetchSuperMerchants(); fetchAvailableMerchants(); fetchAllMerchants(); }} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Grant Super Merchant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Grant SUPER_MERCHANT Status</DialogTitle>
                <DialogDescription>
                  Select a specific merchant account to grant SUPER_MERCHANT status.
                  Only the selected merchant will become a super merchant.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Merchant</Label>
                  <Select value={selectedMerchantToGrant} onValueChange={setSelectedMerchantToGrant}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a merchant to promote" />
                    </SelectTrigger>
                    <SelectContent>
                      {allMerchants.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.businessTradeName} ({m.merchantCode}) - {m.ownerFirstName} {m.ownerLastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Note: This grants super merchant status to this specific merchant only, not all merchants under the same user.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGrantDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGrantSuperMerchant} disabled={!selectedMerchantToGrant}>
                  Grant Status
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Super Merchants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{superMerchants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Assigned Merchants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {superMerchants.reduce((acc, sm) => acc + sm.childMerchantsCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Available for Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableMerchants.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Super Merchants Table */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Super Merchants</CardTitle>
              <CardDescription>
                Merchants with SUPER_MERCHANT status who can view aggregate data of their assigned merchants
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Link2 className="h-4 w-4 mr-2" />
                    Assign Merchant
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Merchant to Super Merchant</DialogTitle>
                    <DialogDescription>
                      Select a super merchant and a merchant to assign under them.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Super Merchant</Label>
                      <Select value={selectedSuperMerchant} onValueChange={setSelectedSuperMerchant}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a super merchant" />
                        </SelectTrigger>
                        <SelectContent>
                          {superMerchants.map((sm) => (
                            <SelectItem key={sm.id} value={sm.id}>
                              {sm.businessTradeName} ({sm.merchantCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Merchant to Assign</Label>
                      <Select value={selectedMerchantToAssign} onValueChange={setSelectedMerchantToAssign}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a merchant" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMerchants.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.businessTradeName} ({m.merchantCode}) - {m.ownerFirstName} {m.ownerLastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAssignMerchant}>Assign</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredSuperMerchants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No super merchants found. Grant SUPER_MERCHANT status to a merchant user to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Merchant Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Child Merchants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuperMerchants.map((sm) => (
                  <TableRow key={sm.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        {sm.businessTradeName}
                      </div>
                    </TableCell>
                    <TableCell>{sm.merchantCode}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant={sm.isActive ? 'default' : 'secondary'}>
                          {sm.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {sm.isVerified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewChildrenDialog(sm)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        {sm.childMerchantsCount} merchants
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSuperMerchant(sm.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Child Merchants Dialog */}
      <Dialog open={viewChildrenDialogOpen} onOpenChange={setViewChildrenDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Child Merchants of {viewingSuperMerchant?.businessTradeName}
            </DialogTitle>
            <DialogDescription>
              Merchants assigned under this super merchant
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {childMerchants.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No merchants assigned yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {childMerchants.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.businessTradeName}</TableCell>
                      <TableCell>{m.merchantCode}</TableCell>
                      <TableCell>{m.businessCity}</TableCell>
                      <TableCell>
                        <Badge variant={m.isActive ? 'default' : 'secondary'}>
                          {m.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnassignMerchant(m.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Unlink className="h-4 w-4 mr-1" />
                          Unassign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewChildrenDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
    </RoleGuard>
  );
}
