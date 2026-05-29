'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout';
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs';
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta';
import {
  DASHBOARD_MAIN_CLASS,
  dashboardFormShellClass,
  dashboardPageShellClass,
} from '@/lib/constants/dashboard-layout';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { PERMISSIONS } from '@/lib/hooks/usePermissions';
import {
  useMobileAppReleases,
  useUpdateMobileAppRelease,
  type MobileAppRelease,
  type MobilePlatform,
} from '@/lib/hooks/useMobileAppReleases';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Smartphone, Save } from 'lucide-react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/utils';

type FormState = {
  latestVersion: string;
  storeUrl: string;
  updateMessage: string;
  isActive: boolean;
};

function emptyForm(): FormState {
  return {
    latestVersion: '',
    storeUrl: '',
    updateMessage: '',
    isActive: true,
  };
}

function releaseToForm(release: MobileAppRelease): FormState {
  return {
    latestVersion: release.latestVersion,
    storeUrl: release.storeUrl,
    updateMessage: release.updateMessage ?? '',
    isActive: release.isActive,
  };
}

function PlatformCard({
  platform,
  title,
  release,
}: {
  platform: MobilePlatform;
  title: string;
  release?: MobileAppRelease;
}) {
  const updateMutation = useUpdateMobileAppRelease();
  const [form, setForm] = useState<FormState>(emptyForm());

  useEffect(() => {
    if (release) setForm(releaseToForm(release));
  }, [release]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        platform,
        dto: {
          latestVersion: form.latestVersion.trim(),
          storeUrl: form.storeUrl.trim(),
          updateMessage: form.updateMessage.trim() || undefined,
          isActive: form.isActive,
        },
      });
      toast.success(`${title} configuration saved`);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  if (!release) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No configuration found. Run the database migration{' '}
          <code className="text-xs">20260529140000_add_mobile_app_releases</code>.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Users on a version <strong>older than</strong> latest will see a blocking
          update screen. Store link is sent to the app when an update is required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${platform}-version`}>Latest required version</Label>
          <Input
            id={`${platform}-version`}
            placeholder="1.0.0"
            value={form.latestVersion}
            onChange={(e) =>
              setForm((f) => ({ ...f, latestVersion: e.target.value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Must match <code>version:</code> in Flutter{' '}
            <code>pubspec.yaml</code> (before the + build number).
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${platform}-store`}>Store URL</Label>
          <Input
            id={`${platform}-store`}
            placeholder={
              platform === 'IOS'
                ? 'https://apps.apple.com/app/id...'
                : 'https://play.google.com/store/apps/details?id=...'
            }
            value={form.storeUrl}
            onChange={(e) => setForm((f) => ({ ...f, storeUrl: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            App Store or Play Store link opened when user taps Update on the phone.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${platform}-message`}>Update message</Label>
          <Textarea
            id={`${platform}-message`}
            rows={3}
            value={form.updateMessage}
            onChange={(e) =>
              setForm((f) => ({ ...f, updateMessage: e.target.value }))
            }
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Force update active</p>
            <p className="text-xs text-muted-foreground">
              When off, version checks pass for this platform.
            </p>
          </div>
          <Switch
            checked={form.isActive}
            onCheckedChange={(checked) =>
              setForm((f) => ({ ...f, isActive: checked }))
            }
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full sm:w-auto"
        >
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save {title}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function MobileAppVersionsPage() {
  const { data, isLoading, isError, error, refetch } = useMobileAppReleases();

  const android = data?.find((r) => r.platform === 'ANDROID');
  const ios = data?.find((r) => r.platform === 'IOS');

  return (
    <PermissionGuard permission={PERMISSIONS.SYSTEM_CONFIGURE}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className={DASHBOARD_MAIN_CLASS}>
          <DashboardPageLayout className={dashboardPageShellClass}>
            <DashboardBreadcrumbs
              items={getDashboardPageCrumbs('settings/mobile-app-versions')}
            />

            <div className={dashboardFormShellClass}>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Mobile app versions
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Configure force-update rules for the RukaPay subscriber mobile app
                  (iOS and Android). Versions and store links are stored in the database —
                  not in the Flutter project.
                </p>
              </div>

              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </div>
              )}

              {isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {extractErrorMessage(error)}
                    <Button variant="link" className="ml-2 h-auto p-0" onClick={() => refetch()}>
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {!isLoading && !isError && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <PlatformCard platform="ANDROID" title="Android" release={android} />
                  <PlatformCard platform="IOS" title="iOS" release={ios} />
                </div>
              )}

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Flutter app version</strong> is set in{' '}
                  <code>apps/rukapay_mobile_app/pubspec.yaml</code> (
                  <code>version: 1.0.0+1</code>). The app sends{' '}
                  <code>1.0.0</code> to <code>POST /app/version/check</code> on launch.
                  Bump <code>latestVersion</code> here when you publish a new build users
                  must install.
                </AlertDescription>
              </Alert>
            </div>
          </DashboardPageLayout>
        </main>
      </div>
    </PermissionGuard>
  );
}
