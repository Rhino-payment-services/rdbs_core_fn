'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout';
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs';
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta';
import { PERMISSIONS, usePermissions } from '@/lib/hooks/usePermissions';
import {
  AppConfigEntry,
  AppConfigRegistryItem,
  ICON_NAMES,
  useAppConfigEntries,
  useAppConfigHistory,
  useAppConfigRegistry,
  useSetAppConfigStatus,
  useUpsertAppConfig,
} from '@/lib/hooks/useAppConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { AlertCircle, ArrowLeft, History, Loader2, Save } from 'lucide-react';

const TABS = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'icons', label: 'Icons' },
  { id: 'home', label: 'Home Screen' },
  { id: 'navigation', label: 'Navigation' },
] as const;

function mergeRow(
  registry: AppConfigRegistryItem,
  entries: AppConfigEntry[],
): { registry: AppConfigRegistryItem; entry?: AppConfigEntry; value: Record<string, unknown> } {
  const entry = entries.find((item) => item.key === registry.key);
  return {
    registry,
    entry,
    value: entry?.value ?? registry.defaultValue,
  };
}

export default function AppConfigPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.APP_CONFIG_MANAGE);
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('appearance');
  const [historyKey, setHistoryKey] = useState<string | null>(null);

  const { data: registry = [], isLoading: loadingRegistry } = useAppConfigRegistry();
  const { data: entries = [], isLoading: loadingEntries } = useAppConfigEntries(tab);
  const { data: history = [], isLoading: loadingHistory } = useAppConfigHistory(historyKey);

  if (!hasPermission(PERMISSIONS.APP_CONFIG_VIEW)) {
    return (
      <DashboardPageLayout>
        <DashboardBreadcrumbs items={getDashboardPageCrumbs('settings/app-config')} />
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don&apos;t have permission to view app configuration.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardPageLayout>
    );
  }

  const rows = registry
    .filter((item) => item.category === tab)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => mergeRow(item, entries));

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('settings/app-config')} />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">App Configuration</h1>
        <p className="text-gray-600 mt-1">
          Control supported RukaPay icons, colors, and home navigation. Missing values fall back to the app defaults.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList className="mb-4">
          {TABS.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((item) => (
          <TabsContent key={item.id} value={item.id} className="space-y-4">
            {loadingRegistry || loadingEntries ? (
              <div className="py-10 text-center text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                Loading configuration
              </div>
            ) : (
              rows.map((row) => (
                <ConfigCard
                  key={`${row.registry.key}-${row.entry?.id ?? 'default'}-${row.entry?.updatedAt ?? ''}`}
                  registry={row.registry}
                  entry={row.entry}
                  initialValue={row.value}
                  canManage={canManage}
                  onHistory={() => setHistoryKey(row.registry.key)}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!historyKey} onOpenChange={(open) => !open && setHistoryKey(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change history</DialogTitle>
            <DialogDescription>{historyKey}</DialogDescription>
          </DialogHeader>
          {loadingHistory ? (
            <div className="py-6 text-center text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Loading
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-500">No changes recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="rounded-md border p-3 text-sm">
                  <div className="font-medium">
                    {item.changedByEmail || item.changedBy}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                  <pre className="text-xs bg-slate-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(
                      { previous: item.previousValue, next: item.newValue },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardPageLayout>
  );
}

function ConfigCard({
  registry,
  entry,
  initialValue,
  canManage,
  onHistory,
}: {
  registry: AppConfigRegistryItem;
  entry?: AppConfigEntry;
  initialValue: Record<string, unknown>;
  canManage: boolean;
  onHistory: () => void;
}) {
  const upsert = useUpsertAppConfig();
  const setStatus = useSetAppConfigStatus();
  const [value, setValue] = useState<Record<string, unknown>>(initialValue);

  const preview = useMemo(() => value, [value]);

  const save = () => {
    upsert.mutate({
      key: registry.key,
      value,
      status: entry?.status ?? 'ACTIVE',
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{registry.label}</CardTitle>
            <p className="text-xs text-gray-500 mt-1">{registry.key}</p>
          </div>
          <div className="flex items-center gap-2">
            {entry ? (
              <Badge variant={entry.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {entry.status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </Badge>
            ) : (
              <Badge variant="outline">Default</Badge>
            )}
            <Button variant="ghost" size="icon" onClick={onHistory}>
              <History className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {registry.type === 'COLOR' && (
          <ColorEditor value={value} onChange={setValue} preview={preview} />
        )}
        {registry.type === 'ICON' && (
          <IconEditor value={value} onChange={setValue} />
        )}
        {(registry.type === 'QUICK_ACTION' || registry.type === 'HOME') && (
          <QuickActionEditor value={value} onChange={setValue} />
        )}
        {registry.type === 'BOTTOM_NAV' && (
          <BottomNavEditor value={value} onChange={setValue} />
        )}
        {canManage && (
          <div className="flex items-center justify-between pt-2">
            {entry ? (
              <div className="flex items-center gap-2 text-sm">
                <Switch
                  checked={entry.status === 'ACTIVE'}
                  onCheckedChange={(checked) =>
                    setStatus.mutate({ id: entry.id, active: checked })
                  }
                />
                Active
              </div>
            ) : (
              <span />
            )}
            <Button onClick={save} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ColorEditor({
  value,
  onChange,
  preview,
}: {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  preview: Record<string, unknown>;
}) {
  const hex = String(value.hex || '#0948B6');
  return (
    <div className="flex items-center gap-4">
      <div
        className="h-12 w-12 rounded-lg border"
        style={{ backgroundColor: String(preview.hex || hex) }}
      />
      <div className="flex-1 space-y-2">
        <Label>Hex</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            className="w-14 p-1 h-10"
            value={hex.slice(0, 7)}
            onChange={(event) => onChange({ hex: event.target.value.toUpperCase() })}
          />
          <Input
            value={hex}
            onChange={(event) => onChange({ hex: event.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function IconEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}) {
  const format = String(value.format || 'ICON_NAME') === 'IMAGE_URL' ? 'IMAGE_URL' : 'ICON_NAME';
  const name = String(value.name || 'apps_rounded');
  const url = String(value.url || '');

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Format</Label>
        <Select
          value={format}
          onValueChange={(next) => {
            if (next === 'IMAGE_URL') {
              onChange({ format: 'IMAGE_URL', url: url || '' });
            } else {
              onChange({ format: 'ICON_NAME', name });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ICON_NAME">Material icon name</SelectItem>
            <SelectItem value="IMAGE_URL">Image URL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg border bg-slate-50 flex items-center justify-center overflow-hidden text-[10px] text-center px-1 shrink-0">
          {format === 'IMAGE_URL' && url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            name.replace(/_/g, ' ')
          )}
        </div>
        <div className="flex-1 space-y-2">
          {format === 'IMAGE_URL' ? (
            <>
              <Label>Image URL</Label>
              <Input
                placeholder="https://cdn.example.com/icon.png"
                value={url}
                onChange={(event) =>
                  onChange({ format: 'IMAGE_URL', url: event.target.value })
                }
              />
            </>
          ) : (
            <>
              <Label>Icon name</Label>
              <Select
                value={name}
                onValueChange={(next) => onChange({ format: 'ICON_NAME', name: next })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_NAMES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickActionEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <PreviewTile
        label={String(value.label || '')}
        hint={String(value.iconKey || '')}
        muted={value.visible === false}
      />
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            value={String(value.label || '')}
            onChange={(event) => onChange({ ...value, label: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Order</Label>
          <Input
            type="number"
            min={0}
            value={Number(value.order || 0)}
            onChange={(event) =>
              onChange({ ...value, order: Number(event.target.value) || 0 })
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Visible</Label>
          <Switch
            checked={value.visible !== false}
            onCheckedChange={(checked) => onChange({ ...value, visible: checked })}
          />
        </div>
      </div>
    </div>
  );
}

function BottomNavEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <PreviewTile
        label={String(value.label || '')}
        hint={String(value.itemId || '')}
        muted={value.visible === false}
      />
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            value={String(value.label || '')}
            onChange={(event) => onChange({ ...value, label: event.target.value })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Visible</Label>
          <Switch
            checked={value.visible !== false}
            onCheckedChange={(checked) => onChange({ ...value, visible: checked })}
          />
        </div>
      </div>
    </div>
  );
}

function PreviewTile({
  label,
  hint,
  muted,
}: {
  label: string;
  hint: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 flex flex-col items-center justify-center min-h-[96px] ${
        muted ? 'opacity-40' : ''
      }`}
    >
      <div className="h-10 w-10 rounded-full bg-[#0948B6]/10 mb-2" />
      <div className="text-sm font-medium">{label || 'Preview'}</div>
      <div className="text-[11px] text-gray-500">{hint}</div>
    </div>
  );
}
