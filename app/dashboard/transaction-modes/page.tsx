'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/dashboard/Navbar';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { PERMISSIONS, usePermissions } from '@/lib/hooks/usePermissions';
import {
  useTransactionModes,
  useCreateTransactionMode,
  useUpdateTransactionMode,
  useDeleteTransactionMode,
  useActivateTransactionMode,
  useDeactivateTransactionMode,
  type TransactionMode,
  type CreateTransactionModeDto,
} from '@/lib/hooks/useTransactionModes';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Search,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Workflow,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CATEGORIES = [
  { value: 'WALLET', label: 'Wallet' },
  { value: 'MNO', label: 'Mobile Money' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'MERCHANT', label: 'Merchant' },
  { value: 'BANK', label: 'Bank' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'BNPL', label: 'Buy Now Pay Later' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'LOAN', label: 'Loan' },
  { value: 'CUSTOM', label: 'Custom' },
];

const CURRENCIES = ['UGX', 'USD', 'EUR', 'GBP', 'KES', 'TZS'];

export default function TransactionModesPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<TransactionMode | null>(null);

  // Check if user has permission to view this page
  if (!hasPermission(PERMISSIONS.TRANSACTION_MODES_VIEW)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600 mb-6">
                You don't have permission to view transaction modes.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Filters based on active tab
  const filters = {
    search: searchTerm || undefined,
    isActive: activeTab === 'active' ? true : activeTab === 'inactive' ? false : undefined,
    isSystem: activeTab === 'system' ? true : activeTab === 'custom' ? false : undefined,
  };

  const { data: modes, isLoading, error } = useTransactionModes(filters);
  const createMode = useCreateTransactionMode();
  const updateMode = useUpdateTransactionMode();
  const deleteMode = useDeleteTransactionMode();
  const activateMode = useActivateTransactionMode();
  const deactivateMode = useDeactivateTransactionMode();

  const handleCreate = (dto: CreateTransactionModeDto) => {
    createMode.mutate(dto, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
      },
    });
  };

  const handleUpdate = (dto: CreateTransactionModeDto) => {
    if (!selectedMode) return;
    updateMode.mutate(
      { id: selectedMode.id, dto },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedMode(null);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!selectedMode) return;
    deleteMode.mutate(selectedMode.id, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setSelectedMode(null);
      },
    });
  };

  const handleToggleActive = (mode: TransactionMode) => {
    if (mode.isActive) {
      deactivateMode.mutate(mode.id);
    } else {
      activateMode.mutate(mode.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <div className="mb-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/dashboard" className="hover:text-[#08163d]">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium">Transaction Modes</span>
            </nav>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Transaction Modes</h1>
                <p className="text-gray-600">Manage transaction modes and their configurations</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                {hasPermission(PERMISSIONS.TRANSACTION_MODES_CREATE) && (
                  <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Mode
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create Transaction Mode</DialogTitle>
                        <DialogDescription>
                          Create a new custom transaction mode with specific rules and configurations
                        </DialogDescription>
                      </DialogHeader>
                      <TransactionModeForm onSubmit={handleCreate} isSubmitting={createMode.isPending} />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Modes</CardTitle>
                <Workflow className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{modes?.length || 0}</div>
                <p className="text-xs text-muted-foreground">All transaction modes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <Power className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{modes?.filter(m => m.isActive).length || 0}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System</CardTitle>
                <Workflow className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{modes?.filter(m => m.isSystem).length || 0}</div>
                <p className="text-xs text-muted-foreground">System-defined</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custom</CardTitle>
                <Plus className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{modes?.filter(m => !m.isSystem).length || 0}</div>
                <p className="text-xs text-muted-foreground">Custom modes</p>
              </CardContent>
            </Card>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load transaction modes. Please try again later.
              </AlertDescription>
            </Alert>
          )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction Modes</CardTitle>
              <CardDescription>View and manage all transaction modes</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading modes...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Limits</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modes?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No transaction modes found
                        </TableCell>
                      </TableRow>
                    ) : (
                      modes?.map((mode) => (
                        <TableRow key={mode.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-medium">{mode.displayName}</div>
                              <div className="text-sm text-muted-foreground">{mode.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">{mode.code}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{mode.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={mode.isActive ? 'default' : 'secondary'}>
                              {mode.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={mode.isSystem ? 'secondary' : 'default'}>
                              {mode.isSystem ? 'System' : 'Custom'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {mode.minAmount || mode.maxAmount ? (
                              <div>
                                {mode.minAmount && <div>Min: {mode.minAmount}</div>}
                                {mode.maxAmount && <div>Max: {mode.maxAmount}</div>}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No limits</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!mode.isSystem && (
                                <>
                                  {hasPermission(PERMISSIONS.TRANSACTION_MODES_UPDATE) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedMode(mode);
                                        setIsEditModalOpen(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {hasPermission(PERMISSIONS.TRANSACTION_MODES_DELETE) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedMode(mode);
                                        setIsDeleteModalOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                              {hasPermission(PERMISSIONS.TRANSACTION_MODES_UPDATE) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleActive(mode)}
                                >
                                  {mode.isActive ? (
                                    <PowerOff className="h-4 w-4" />
                                  ) : (
                                    <Power className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

          {/* Edit Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Transaction Mode</DialogTitle>
                <DialogDescription>Update the transaction mode configuration</DialogDescription>
              </DialogHeader>
              {selectedMode && (
                <TransactionModeForm
                  initialData={selectedMode}
                  onSubmit={handleUpdate}
                  isSubmitting={updateMode.isPending}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Transaction Mode</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <strong>{selectedMode?.name}</strong>? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  {deleteMode.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
}

interface TransactionModeFormProps {
  initialData?: TransactionMode;
  onSubmit: (data: CreateTransactionModeDto) => void;
  isSubmitting: boolean;
}

function TransactionModeForm({ initialData, onSubmit, isSubmitting }: TransactionModeFormProps) {
  const [formData, setFormData] = useState<CreateTransactionModeDto>({
    code: initialData?.code || '',
    name: initialData?.name || '',
    displayName: initialData?.displayName || '',
    description: initialData?.description || '',
    category: initialData?.category || 'CUSTOM',
    supportedCurrencies: initialData?.supportedCurrencies || ['UGX'],
    requiredFields: initialData?.requiredFields || [],
    minAmount: initialData?.minAmount || undefined,
    maxAmount: initialData?.maxAmount || undefined,
    requiresApproval: initialData?.requiresApproval || false,
    approvalThreshold: initialData?.approvalThreshold || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Code *</Label>
          <Input
            id="code"
            placeholder="SCHOOL_FEES_PAYMENT"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            required
            disabled={!!initialData}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          placeholder="School Fees Payment"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name *</Label>
        <Input
          id="displayName"
          placeholder="School Fees"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Description of the transaction mode"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minAmount">Minimum Amount</Label>
          <Input
            id="minAmount"
            type="number"
            placeholder="0"
            value={formData.minAmount || ''}
            onChange={(e) =>
              setFormData({ ...formData, minAmount: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxAmount">Maximum Amount</Label>
          <Input
            id="maxAmount"
            type="number"
            placeholder="No limit"
            value={formData.maxAmount || ''}
            onChange={(e) =>
              setFormData({ ...formData, maxAmount: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialData ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>{initialData ? 'Update' : 'Create'}</>
          )}
        </Button>
      </div>
    </form>
  );
}

