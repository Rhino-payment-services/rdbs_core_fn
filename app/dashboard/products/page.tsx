'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/dashboard/Navbar';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { PERMISSIONS, usePermissions } from '@/lib/hooks/usePermissions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
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
  CheckCircle,
  XCircle,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Package,
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
import { toast } from 'sonner';
import { useTransactionModes } from '@/lib/hooks/useTransactionModes';

interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  productCode: string;
  status: string;
  minAmount?: number;
  maxAmount?: number;
  currency: string;
  tariffId?: string;
  tariff?: {
    id: string;
    name: string;
    isActive: boolean;
  };
  transactionModeId?: string;
  transactionMode?: {
    id: string;
    code: string;
    displayName: string;
    isActive: boolean;
  };
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
}

interface CreateProductDto {
  name: string;
  description?: string;
  category: string;
  productCode: string;
  minAmount?: number;
  maxAmount?: number;
  currency: string;
  tariffId?: string;
  transactionModeId?: string;
  metadata?: any;
}

const CATEGORIES = [
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'LOAN', label: 'Loan' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'BNPL', label: 'Buy Now Pay Later' },
  { value: 'OTHER', label: 'Other' },
];

export default function ProductsPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const queryClient = useQueryClient();

  // Check if user has permission to view this page
  if (!hasPermission(PERMISSIONS.PRODUCTS_VIEW)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600 mb-6">
                You don't have permission to view products.
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

  // Fetch products
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', activeTab, searchTerm],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (activeTab === 'active') params.append('isActive', 'true');
        if (activeTab === 'inactive') params.append('isActive', 'false');
        if (searchTerm) params.append('search', searchTerm);
        
        console.log('Fetching products:', params.toString());
        const { data } = await axios.get(`/products${params.toString() ? `?${params.toString()}` : ''}`);
        console.log('Products response:', data);
        return data as Product[];
      } catch (err) {
        console.error('Error fetching products:', err);
        throw err;
      }
    },
  });

  // Fetch transaction modes for form
  const { data: transactionModes } = useTransactionModes({ isActive: true });

  // Fetch tariffs for form
  const { data: tariffs } = useQuery({
    queryKey: ['tariffs'],
    queryFn: async () => {
      const { data } = await axios.get('/finance/tariffs');
      return data;
    },
  });

  // Create product mutation
  const createProduct = useMutation({
    mutationFn: async (dto: CreateProductDto) => {
      const { data } = await axios.post('/products', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create product');
    },
  });

  // Update product mutation
  const updateProduct = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: Partial<CreateProductDto> }) => {
      const { data } = await axios.patch(`/products/${id}`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
      setIsEditModalOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update product');
    },
  });

  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    },
  });

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
              <span className="text-gray-900 font-medium">Products</span>
            </nav>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                <p className="text-gray-600">Manage financial products and services</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                {hasPermission(PERMISSIONS.PRODUCTS_CREATE) && (
                  <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create Product</DialogTitle>
                        <DialogDescription>
                          Create a new financial product with transaction mode and tariff configuration
                        </DialogDescription>
                      </DialogHeader>
                      <ProductForm
                        transactionModes={transactionModes}
                        tariffs={tariffs}
                        onSubmit={(data) => createProduct.mutate(data)}
                        isSubmitting={createProduct.isPending}
                      />
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
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products?.length || 0}</div>
                <p className="text-xs text-muted-foreground">All products</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products?.filter(p => p.isActive).length || 0}</div>
                <p className="text-xs text-muted-foreground">Active products</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                <XCircle className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products?.filter(p => !p.isActive).length || 0}</div>
                <p className="text-xs text-muted-foreground">Inactive products</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Package className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{new Set(products?.map(p => p.category)).size || 0}</div>
                <p className="text-xs text-muted-foreground">Unique categories</p>
              </CardContent>
            </Card>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load products. Please try again later.
              </AlertDescription>
            </Alert>
          )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>View and manage all products</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
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
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading products...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Transaction Mode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Limits</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      products?.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-medium">{product.name}</div>
                              {product.description && (
                                <div className="text-sm text-muted-foreground truncate max-w-xs">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {product.productCode}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell>
                            {product.transactionMode ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                  {product.transactionMode.displayName}
                                </Badge>
                                {product.transactionMode.isActive ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No mode</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.isActive ? 'default' : 'secondary'}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {product.minAmount || product.maxAmount ? (
                              <div>
                                {product.minAmount && <div>Min: {product.minAmount}</div>}
                                {product.maxAmount && <div>Max: {product.maxAmount}</div>}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No limits</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {hasPermission(PERMISSIONS.PRODUCTS_UPDATE) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setIsEditModalOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {hasPermission(PERMISSIONS.PRODUCTS_DELETE) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setIsDeleteModalOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
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
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>Update product configuration</DialogDescription>
              </DialogHeader>
              {selectedProduct && (
                <ProductForm
                  initialData={selectedProduct}
                  transactionModes={transactionModes}
                  tariffs={tariffs}
                  onSubmit={(data) => updateProduct.mutate({ id: selectedProduct.id, dto: data })}
                  isSubmitting={updateProduct.isPending}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <strong>{selectedProduct?.name}</strong>? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => selectedProduct && deleteProduct.mutate(selectedProduct.id)}
                  className="bg-destructive text-destructive-foreground"
                >
                  {deleteProduct.isPending ? (
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

interface ProductFormProps {
  initialData?: Product;
  transactionModes?: any[];
  tariffs?: any[];
  onSubmit: (data: CreateProductDto) => void;
  isSubmitting: boolean;
}

function ProductForm({ initialData, transactionModes, tariffs, onSubmit, isSubmitting }: ProductFormProps) {
  const [formData, setFormData] = useState<CreateProductDto>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || 'SAVINGS',
    productCode: initialData?.productCode || '',
    minAmount: initialData?.minAmount || undefined,
    maxAmount: initialData?.maxAmount || undefined,
    currency: initialData?.currency || 'UGX',
    tariffId: initialData?.tariffId || undefined,
    transactionModeId: initialData?.transactionModeId || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            placeholder="e.g., School Fees Savings"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="productCode">Product Code *</Label>
          <Input
            id="productCode"
            placeholder="e.g., PROD_EDU_001"
            value={formData.productCode}
            onChange={(e) => setFormData({ ...formData, productCode: e.target.value.toUpperCase() })}
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
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief description of the product"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="transactionModeId">Transaction Mode</Label>
          <Select
            value={formData.transactionModeId || 'none'}
            onValueChange={(value) =>
              setFormData({ ...formData, transactionModeId: value === 'none' ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select transaction mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {transactionModes?.map((mode) => (
                <SelectItem key={mode.id} value={mode.id}>
                  {mode.displayName} ({mode.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Link to a specific transaction mode for structured processing
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tariffId">Tariff</Label>
          <Select
            value={formData.tariffId || 'none'}
            onValueChange={(value) =>
              setFormData({ ...formData, tariffId: value === 'none' ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tariff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {tariffs?.map((tariff: any) => (
                <SelectItem key={tariff.id} value={tariff.id}>
                  {tariff.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Associated fee structure for this product
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency *</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UGX">UGX</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minAmount">Minimum Amount</Label>
          <Input
            id="minAmount"
            type="number"
            placeholder="0"
            value={formData.minAmount || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                minAmount: e.target.value ? Number(e.target.value) : undefined,
              })
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
              setFormData({
                ...formData,
                maxAmount: e.target.value ? Number(e.target.value) : undefined,
              })
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

