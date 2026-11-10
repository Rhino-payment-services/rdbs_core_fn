'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout';
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs';
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta';
import { PERMISSIONS, usePermissions } from '@/lib/hooks/usePermissions';
import {
  DataBundleNetwork,
  DataBundlePackage,
  DataBundlePackageInput,
  DataBundleUnit,
  DataBundleValidity,
  useCreateDataBundlePackage,
  useDataBundlePackages,
  useUpdateDataBundlePackage,
} from '@/lib/hooks/useDataBundlePackages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, ArrowLeft, Loader2, Pencil, Plus } from 'lucide-react';

type FormState = {
  bundleCode: string;
  network: DataBundleNetwork;
  displayName: string;
  productName: string;
  quantity: string;
  unit: DataBundleUnit;
  validity: DataBundleValidity;
  providerCost: string;
  sellingPrice: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  bundleCode: '',
  network: 'MTN',
  displayName: '',
  productName: 'Mobile Data',
  quantity: '',
  unit: 'GB',
  validity: 'Week',
  providerCost: '',
  sellingPrice: '',
  isActive: true,
};

const formatUgx = (value: string | number) =>
  `UGX ${Number(value).toLocaleString('en-UG', { maximumFractionDigits: 2 })}`;

export default function DataBundlePackagesPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.TARIFF_UPDATE);
  const { data: packages = [], isLoading } = useDataBundlePackages(true);
  const createPackage = useCreateDataBundlePackage();
  const updatePackage = useUpdateDataBundlePackage();

  const [editing, setEditing] = useState<DataBundlePackage | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  if (!hasPermission(PERMISSIONS.TARIFF_VIEW)) {
    return (
      <DashboardPageLayout>
        <DashboardBreadcrumbs items={getDashboardPageCrumbs('settings/data-bundle-packages')} />
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don&apos;t have permission to view data bundle packages.
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
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (pkg: DataBundlePackage) => {
    setEditing(pkg);
    setForm({
      bundleCode: pkg.bundleCode,
      network: pkg.network,
      displayName: pkg.displayName,
      productName: pkg.productName,
      quantity: String(Number(pkg.quantity)),
      unit: pkg.unit,
      validity: pkg.validity,
      providerCost: String(Number(pkg.providerCost)),
      sellingPrice: String(Number(pkg.sellingPrice)),
      isActive: pkg.isActive,
    });
    setOpen(true);
  };

  const quantity = Number(form.quantity);
  const providerCost = Number(form.providerCost);
  const sellingPrice = Number(form.sellingPrice);
  const formValid =
    (!!editing || /^[A-Za-z0-9_-]+$/.test(form.bundleCode)) &&
    form.displayName.trim().length > 0 &&
    quantity > 0 &&
    providerCost >= 0 &&
    sellingPrice >= 1;

  const save = async () => {
    if (!formValid) return;
    const common = {
      network: form.network,
      displayName: form.displayName.trim(),
      productName: form.productName.trim() || 'Mobile Data',
      quantity,
      unit: form.unit,
      validity: form.validity,
      providerCost,
      sellingPrice,
      isActive: form.isActive,
    };
    if (editing) {
      await updatePackage.mutateAsync({ id: editing.id, input: common });
    } else {
      const input: DataBundlePackageInput = {
        ...common,
        bundleCode: form.bundleCode.trim().toUpperCase(),
        country: 'UG',
      };
      await createPackage.mutateAsync(input);
    }
    setOpen(false);
  };

  const saving = createPackage.isPending || updatePackage.isPending;

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('settings/data-bundle-packages')} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Bundle Packages</h1>
          <p className="text-gray-600 mt-1">
            Approved catalogue used to price merchant Data Bundles Distribution batches. Prices in
            uploaded Excel files are ignored.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add package
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Packages</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : packages.length === 0 ? (
            <p className="py-10 text-center text-gray-500">No packages yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Network</th>
                    <th className="py-2 pr-4">Bundle</th>
                    <th className="py-2 pr-4 text-right">Provider cost</th>
                    <th className="py-2 pr-4 text-right">Selling price</th>
                    <th className="py-2 pr-4">Status</th>
                    {canManage && <th className="py-2" />}
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{pkg.bundleCode}</td>
                      <td className="py-2 pr-4">{pkg.displayName}</td>
                      <td className="py-2 pr-4">{pkg.network}</td>
                      <td className="py-2 pr-4">
                        {Number(pkg.quantity)}
                        {pkg.unit} / {pkg.validity}
                      </td>
                      <td className="py-2 pr-4 text-right">{formatUgx(pkg.providerCost)}</td>
                      <td className="py-2 pr-4 text-right font-medium">
                        {formatUgx(pkg.sellingPrice)}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant={pkg.isActive ? 'default' : 'secondary'}>
                          {pkg.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      {canManage && (
                        <td className="py-2 text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(pkg)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit package' : 'Add package'}</DialogTitle>
            <DialogDescription>
              Quantity, unit and validity are sent to Africa&apos;s Talking exactly as entered.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="bundleCode">Bundle code</Label>
              <Input
                id="bundleCode"
                value={form.bundleCode}
                disabled={!!editing}
                placeholder="MTN_UG_1GB_WEEK"
                onChange={(e) => setForm({ ...form, bundleCode: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Network</Label>
              <Select
                value={form.network}
                onValueChange={(v) => setForm({ ...form, network: v as DataBundleNetwork })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MTN">MTN</SelectItem>
                  <SelectItem value="AIRTEL">Airtel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="productName">Product name</Label>
              <Input
                id="productName"
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Unit</Label>
              <Select
                value={form.unit}
                onValueChange={(v) => setForm({ ...form, unit: v as DataBundleUnit })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MB">MB</SelectItem>
                  <SelectItem value="GB">GB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Validity</Label>
              <Select
                value={form.validity}
                onValueChange={(v) => setForm({ ...form, validity: v as DataBundleValidity })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Day">Day</SelectItem>
                  <SelectItem value="Week">Week</SelectItem>
                  <SelectItem value="Month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="providerCost">Provider cost (UGX)</Label>
              <Input
                id="providerCost"
                type="number"
                min="0"
                value={form.providerCost}
                onChange={(e) => setForm({ ...form, providerCost: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sellingPrice">Selling price (UGX)</Label>
              <Input
                id="sellingPrice"
                type="number"
                min="1"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">Active</div>
                <div className="text-xs text-gray-500">Inactive packages cannot be used in new uploads.</div>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!formValid || saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardPageLayout>
  );
}
