'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout';
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs';
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { PERMISSIONS, usePermissions } from '@/lib/hooks/usePermissions';
import {
  MiniAppAuthType,
  MiniAppRecord,
  MiniAppStatus,
  MiniAppWriteDto,
  useActivateMiniApp,
  useCreateMiniApp,
  useDeactivateMiniApp,
  useMiniAppPermissions,
  useMiniAppPreview,
  useMiniApps,
  useUpdateMiniApp,
} from '@/lib/hooks/useMiniApps';
import {
  resolveMiniAppIconUrl,
  uploadMiniAppIcon,
} from '@/lib/mini-apps-upload';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  ArrowLeft,
  Edit,
  Eye,
  Loader2,
  Plus,
  Power,
  PowerOff,
  Search,
  Star,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

const CATEGORIES = [
  'payments',
  'shopping',
  'bills',
  'education',
  'finance',
  'lifestyle',
] as const;

const AUTH_TYPES: { value: MiniAppAuthType; label: string }[] = [
  { value: 'REDIRECT_ONLY', label: 'Redirect only' },
  { value: 'RUKAPAY_SESSION', label: 'RukaPay session' },
  { value: 'RUKASENTE_SESSION', label: 'RukaSente session' },
  { value: 'BASIC_USER_INFO', label: 'Basic user information' },
];

const USER_DATA_FIELDS = [
  { value: 'userId', label: 'User ID' },
  { value: 'username', label: 'Username' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone number' },
  { value: 'displayName', label: 'Display name' },
];

const emptyForm = (): MiniAppWriteDto => ({
  name: '',
  slug: '',
  description: '',
  iconUrl: '',
  category: 'finance',
  redirectUrl: '',
  status: 'INACTIVE',
  isFeatured: false,
  sortOrder: 0,
  authenticationType: 'REDIRECT_ONLY',
  permissions: [],
  allowedUserData: [],
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function authLabel(type: MiniAppAuthType) {
  return AUTH_TYPES.find((item) => item.value === type)?.label || type;
}

export default function MiniAppsPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.MINI_APPS_MANAGE);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MiniAppStatus | 'ALL'>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editing, setEditing] = useState<MiniAppRecord | null>(null);
  const [form, setForm] = useState<MiniAppWriteDto>(emptyForm());
  const [configText, setConfigText] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: apps = [], isLoading } = useMiniApps({
    status: status === 'ALL' ? undefined : status,
    search: search.trim() || undefined,
  });
  const { data: permissions = [] } = useMiniAppPermissions();
  const { data: preview, isLoading: previewLoading } = useMiniAppPreview(previewId);
  const createMiniApp = useCreateMiniApp();
  const updateMiniApp = useUpdateMiniApp();
  const activateMiniApp = useActivateMiniApp();
  const deactivateMiniApp = useDeactivateMiniApp();

  const saving = createMiniApp.isPending || updateMiniApp.isPending;

  const filtered = useMemo(() => apps, [apps]);

  if (!hasPermission(PERMISSIONS.MINI_APPS_VIEW)) {
    return (
      <DashboardPageLayout>
        <DashboardBreadcrumbs items={getDashboardPageCrumbs('mini-apps')} />
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don&apos;t have permission to view Mini Apps.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardPageLayout>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setConfigText('');
    setFormOpen(true);
  };

  const openEdit = (app: MiniAppRecord) => {
    setEditing(app);
    setForm({
      name: app.name,
      slug: app.slug,
      description: app.description || '',
      iconUrl: app.iconUrl || '',
      category: app.category,
      redirectUrl: app.redirectUrl,
      status: app.status,
      isFeatured: app.isFeatured,
      sortOrder: app.sortOrder,
      authenticationType: app.authenticationType,
      permissions: app.permissions,
      allowedUserData: app.allowedUserData,
    });
    setConfigText(app.config ? JSON.stringify(app.config, null, 2) : '');
    setFormOpen(true);
  };

  const toggleValue = (field: 'permissions' | 'allowedUserData', value: string) => {
    setForm((prev) => {
      const current = prev[field] || [];
      return {
        ...prev,
        [field]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  };

  const handleIconChange = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const iconUrl = await uploadMiniAppIcon(file);
      setForm((prev) => ({ ...prev, iconUrl }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Icon upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    let config: Record<string, unknown> | undefined;
    if (configText.trim()) {
      try {
        config = JSON.parse(configText);
      } catch {
        toast.error('Advanced config must be valid JSON');
        return;
      }
    }
    const dto: MiniAppWriteDto = {
      ...form,
      slug: form.slug || slugify(form.name),
      config,
    };
    if (editing) {
      await updateMiniApp.mutateAsync({ id: editing.id, dto });
    } else {
      await createMiniApp.mutateAsync(dto);
    }
    setFormOpen(false);
  };

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('mini-apps')} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mini Apps</h1>
          <p className="text-gray-600 mt-1">
            Register and control Mini Apps shown in the RukaPay app.
          </p>
        </div>
        <PermissionGuard permission={PERMISSIONS.MINI_APPS_MANAGE}>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Mini App
          </Button>
        </PermissionGuard>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search name or slug"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as MiniAppStatus | 'ALL')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mini App</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Auth</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  Loading Mini Apps
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-gray-500">
                  No Mini Apps found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                        {app.iconUrl ? (
                          <Image
                            src={resolveMiniAppIconUrl(app.iconUrl)}
                            alt={app.name}
                            width={40}
                            height={40}
                            unoptimized
                            className="object-cover h-10 w-10"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">
                            {app.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{app.name}</div>
                        <div className="text-xs text-gray-500">{app.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{app.category}</TableCell>
                  <TableCell>
                    <Badge variant={app.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {app.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{authLabel(app.authenticationType)}</TableCell>
                  <TableCell>
                    {app.isFeatured ? (
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(app.createdAt)}</TableCell>
                  <TableCell>{formatDate(app.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPreviewId(app.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(app)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              app.status === 'ACTIVE'
                                ? deactivateMiniApp.mutate(app.id)
                                : activateMiniApp.mutate(app.id)
                            }
                          >
                            {app.status === 'ACTIVE' ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Mini App' : 'Add Mini App'}</DialogTitle>
            <DialogDescription>
              Configure appearance, authentication, and data access.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="general">
              <TabsList className="mb-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="access">Auth & Access</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={form.name}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                          slug: editing ? prev.slug : slugify(event.target.value),
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input
                      value={form.slug}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex items-center gap-3">
                    {form.iconUrl ? (
                      <Image
                        src={resolveMiniAppIconUrl(form.iconUrl)}
                        alt=""
                        width={48}
                        height={48}
                        unoptimized
                        className="rounded-lg object-cover h-12 w-12"
                      />
                    ) : null}
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={(event) => handleIconChange(event.target.files?.[0])}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sort order</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.sortOrder}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          sortOrder: Number(event.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Redirect URL</Label>
                  <Input
                    value={form.redirectUrl}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, redirectUrl: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={form.status === 'ACTIVE'}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        status: checked ? 'ACTIVE' : 'INACTIVE',
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Featured</Label>
                  <Switch
                    checked={!!form.isFeatured}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, isFeatured: checked }))
                    }
                  />
                </div>
              </TabsContent>
              <TabsContent value="access" className="space-y-4">
                <div className="space-y-2">
                  <Label>Authentication type</Label>
                  <Select
                    value={form.authenticationType}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        authenticationType: value as MiniAppAuthType,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTH_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {permissions.map((permission) => (
                      <label key={permission.code} className="flex items-start gap-2 text-sm">
                        <Checkbox
                          checked={form.permissions?.includes(permission.code)}
                          onCheckedChange={() => toggleValue('permissions', permission.code)}
                        />
                        <span>
                          <span className="font-medium">{permission.label}</span>
                          <span className="block text-xs text-gray-500">
                            {permission.code}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Allowed user data</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {USER_DATA_FIELDS.map((field) => (
                      <label key={field.value} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.allowedUserData?.includes(field.value)}
                          onCheckedChange={() =>
                            toggleValue('allowedUserData', field.value)
                          }
                        />
                        {field.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Advanced config (JSON)</Label>
                  <Textarea
                    value={configText}
                    onChange={(event) => setConfigText(event.target.value)}
                    placeholder='{"sandboxRedirectUrl":""}'
                    className="font-mono text-xs"
                  />
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || uploading}>
                {(saving || uploading) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editing ? 'Save changes' : 'Create Mini App'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewId} onOpenChange={(open) => !open && setPreviewId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mini App preview</DialogTitle>
            <DialogDescription>
              What the RukaPay app receives for this configuration.
            </DialogDescription>
          </DialogHeader>
          {previewLoading ? (
            <div className="py-8 text-center text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
              Loading preview
            </div>
          ) : preview ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                {preview.iconUrl ? (
                  <Image
                    src={resolveMiniAppIconUrl(preview.iconUrl)}
                    alt=""
                    width={40}
                    height={40}
                    unoptimized
                    className="rounded-lg object-cover"
                  />
                ) : null}
                <div>
                  <div className="font-medium">{preview.name}</div>
                  <div className="text-gray-500">{preview.slug}</div>
                </div>
              </div>
              <p>{preview.description || 'No description'}</p>
              <div>Category: {preview.category}</div>
              <div>Auth: {authLabel(preview.authenticationType)}</div>
              <div>Featured: {preview.isFeatured ? 'Yes' : 'No'}</div>
              <div className="break-all">Redirect: {preview.redirectUrl}</div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardPageLayout>
  );
}
