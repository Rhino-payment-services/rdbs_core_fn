'use client';

import { useState } from 'react';
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
  RefreshCw,
  Image as ImageIcon,
  X,
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
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';

interface CarouselImage {
  id: string;
  imageUrl: string;
  orderId: number;
  title?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateCarouselImageDto {
  imageUrl: string;
  orderId: number;
  title?: string;
  description?: string;
  isActive?: boolean;
}

interface UpdateCarouselImageDto {
  imageUrl?: string;
  orderId?: number;
  title?: string;
  description?: string;
  isActive?: boolean;
}

export default function CarouselPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCarousel, setSelectedCarousel] = useState<CarouselImage | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState<CreateCarouselImageDto>({
    imageUrl: '',
    orderId: 1,
    title: '',
    description: '',
    isActive: true,
  });

  // Fetch carousel images
  const { data: carouselImages, isLoading, error } = useQuery({
    queryKey: ['carousel', activeTab, searchTerm],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (activeTab === 'active') params.append('activeOnly', 'true');
        if (searchTerm) {
          // Note: Backend might not support search, but we can filter client-side
        }
        
        const { data } = await axios.get(`/carousel${params.toString() ? `?${params.toString()}` : ''}`);
        return data as CarouselImage[];
      } catch (err) {
        console.error('Error fetching carousel images:', err);
        throw err;
      }
    },
  });

  // Filter carousel images client-side if needed
  const filteredCarouselImages = carouselImages?.filter((item) => {
    if (activeTab === 'active' && !item.isActive) return false;
    if (activeTab === 'inactive' && item.isActive) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.title?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.imageUrl.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }).sort((a, b) => a.orderId - b.orderId);

  // Create carousel image mutation
  const createCarousel = useMutation({
    mutationFn: async (dto: CreateCarouselImageDto) => {
      const { data } = await axios.post('/carousel', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carousel'] });
      toast.success('Carousel image created successfully');
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create carousel image');
    },
  });

  // Update carousel image mutation
  const updateCarousel = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateCarouselImageDto }) => {
      const { data } = await axios.put(`/carousel/${id}`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carousel'] });
      toast.success('Carousel image updated successfully');
      setIsEditModalOpen(false);
      setSelectedCarousel(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update carousel image');
    },
  });

  // Delete carousel image mutation
  const deleteCarousel = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/carousel/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carousel'] });
      toast.success('Carousel image deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedCarousel(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete carousel image');
    },
  });

  // Toggle active status mutation
  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data } = await axios.put(`/carousel/${id}`, { isActive });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carousel'] });
      toast.success('Carousel image status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      imageUrl: '',
      orderId: 1,
      title: '',
      description: '',
      isActive: true,
    });
    setImagePreview(null);
  };

  // Handle image upload to Cloudinary
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
      formData.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Image upload failed');
      }

      const data = await response.json();
      const imageUrl = data.secure_url;

      setFormData((prev) => ({ ...prev, imageUrl }));
      setImagePreview(imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      handleImageUpload(file);
    }
  };

  // Handle edit
  const handleEdit = (carousel: CarouselImage) => {
    setSelectedCarousel(carousel);
    setFormData({
      imageUrl: carousel.imageUrl,
      orderId: carousel.orderId,
      title: carousel.title || '',
      description: carousel.description || '',
      isActive: carousel.isActive,
    });
    setImagePreview(carousel.imageUrl);
    setIsEditModalOpen(true);
  };

  // Handle create submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      toast.error('Please upload an image');
      return;
    }
    createCarousel.mutate(formData);
  };

  // Handle update submit
  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarousel) return;
    if (!formData.imageUrl) {
      toast.error('Please upload an image');
      return;
    }
    updateCarousel.mutate({ id: selectedCarousel.id, dto: formData });
  };

  // Handle delete
  const handleDelete = () => {
    if (!selectedCarousel) return;
    deleteCarousel.mutate(selectedCarousel.id);
  };

  // Handle toggle active
  const handleToggleActive = (carousel: CarouselImage) => {
    toggleActive.mutate({ id: carousel.id, isActive: !carousel.isActive });
  };

  // Check if user has permission to view this page
  // Note: You may want to add a specific permission for carousel management
  // For now, using a general admin permission check
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
                You don't have permission to view carousel images.
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Carousel Management</h1>
              <p className="text-gray-600 mt-1">Manage carousel images for your application</p>
            </div>
            <PermissionGuard permission={PERMISSIONS.PRODUCTS_CREATE}>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Carousel Image
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Carousel Image</DialogTitle>
                    <DialogDescription>
                      Upload an image and configure its display settings
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateSubmit} className="space-y-4">
                    {/* Image Upload */}
                    <div className="space-y-2">
                      <Label>Image</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {imagePreview ? (
                          <div className="relative">
                            <Image
                              src={imagePreview}
                              alt="Preview"
                              width={400}
                              height={200}
                              className="mx-auto rounded-lg object-cover"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setImagePreview(null);
                                setFormData((prev) => ({ ...prev, imageUrl: '' }));
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <Label htmlFor="image-upload" className="cursor-pointer">
                              <span className="text-sm text-gray-600">
                                Click to upload or drag and drop
                              </span>
                            </Label>
                            <Input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                              disabled={uploadingImage}
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              PNG, JPG, GIF up to 5MB
                            </p>
                          </div>
                        )}
                        {uploadingImage && (
                          <div className="mt-4">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                            <p className="text-sm text-gray-600 mt-2">Uploading...</p>
                          </div>
                        )}
                      </div>
                      {formData.imageUrl && (
                        <Input
                          type="text"
                          value={formData.imageUrl}
                          readOnly
                          className="mt-2 text-xs"
                          placeholder="Image URL will appear here after upload"
                        />
                      )}
                    </div>

                    {/* Order ID */}
                    <div className="space-y-2">
                      <Label htmlFor="orderId">Order ID *</Label>
                      <Input
                        id="orderId"
                        type="number"
                        min="1"
                        value={formData.orderId}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, orderId: parseInt(e.target.value) || 1 }))
                        }
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Display order (1, 2, 3, etc.). Lower numbers appear first.
                      </p>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title">Title (Optional)</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="Enter carousel title"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="Enter carousel description"
                        rows={3}
                      />
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isActive">Active</Label>
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, isActive: checked }))
                        }
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreateModalOpen(false);
                          resetForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createCarousel.isPending || uploadingImage}>
                        {createCarousel.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create'
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </PermissionGuard>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load carousel images. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Tabs and Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="inactive">Inactive</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by title, description, or URL..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['carousel'] })}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Carousel Images Table */}
          <Card>
            <CardHeader>
              <CardTitle>Carousel Images</CardTitle>
              <CardDescription>
                {filteredCarouselImages?.length || 0} image(s) found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCarouselImages?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No carousel images found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCarouselImages?.map((carousel) => (
                        <TableRow key={carousel.id}>
                          <TableCell>
                            <div className="relative w-20 h-20">
                              <Image
                                src={carousel.imageUrl}
                                alt={carousel.title || 'Carousel image'}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{carousel.orderId}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {carousel.title || <span className="text-muted-foreground">No title</span>}
                          </TableCell>
                          <TableCell>
                            {carousel.description ? (
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {carousel.description}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No description</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={carousel.isActive ? 'default' : 'secondary'}>
                              {carousel.isActive ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(carousel.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(carousel)}
                                disabled={toggleActive.isPending}
                                title={carousel.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {carousel.isActive ? (
                                  <PowerOff className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Power className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                              {hasPermission(PERMISSIONS.PRODUCTS_UPDATE) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(carousel)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {hasPermission(PERMISSIONS.PRODUCTS_DELETE) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCarousel(carousel);
                                    setIsDeleteModalOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
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
            </CardContent>
          </Card>

          {/* Edit Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Carousel Image</DialogTitle>
                <DialogDescription>
                  Update carousel image settings
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Image</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {imagePreview ? (
                      <div className="relative">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          width={400}
                          height={200}
                          className="mx-auto rounded-lg object-cover"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData((prev) => ({ ...prev, imageUrl: '' }));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <Label htmlFor="image-upload-edit" className="cursor-pointer">
                          <span className="text-sm text-gray-600">
                            Click to upload or drag and drop
                          </span>
                        </Label>
                        <Input
                          id="image-upload-edit"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                          disabled={uploadingImage}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    )}
                    {uploadingImage && (
                      <div className="mt-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                        <p className="text-sm text-gray-600 mt-2">Uploading...</p>
                      </div>
                    )}
                  </div>
                  {formData.imageUrl && (
                    <Input
                      type="text"
                      value={formData.imageUrl}
                      readOnly
                      className="mt-2 text-xs"
                      placeholder="Image URL will appear here after upload"
                    />
                  )}
                </div>

                {/* Order ID */}
                <div className="space-y-2">
                  <Label htmlFor="edit-orderId">Order ID *</Label>
                  <Input
                    id="edit-orderId"
                    type="number"
                    min="1"
                    value={formData.orderId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, orderId: parseInt(e.target.value) || 1 }))
                    }
                    required
                  />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title (Optional)</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Enter carousel title"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description (Optional)</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Enter carousel description"
                    rows={3}
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-isActive">Active</Label>
                  <Switch
                    id="edit-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedCarousel(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateCarousel.isPending || uploadingImage}>
                    {updateCarousel.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Carousel Image</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this carousel image? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600"
                  disabled={deleteCarousel.isPending}
                >
                  {deleteCarousel.isPending ? (
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






