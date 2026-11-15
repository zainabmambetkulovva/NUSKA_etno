'use client';

import type { AdminAiSettings } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AdminTitle, Stat } from '@/components/admin/admin-ui';
import { NuskaOrb } from '@/components/ai/nuska-orb';
import { OrnamentLoader } from '@/components/brand/ornament';
import { Checkbox } from '@/components/ui/field';
import { Badge, ErrorBox } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { useToast } from '@/stores/toast';

/** NUSKA AI settings: on/off and the provider status. The API key lives only in the server environment. */
export default function AdminAiPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const settings = useQuery({
    queryKey: ['admin', 'ai'],
    queryFn: () => api<AdminAiSettings>('/admin/ai/settings'),
  });
  const save = useMutation({
    mutationFn: (enabled: boolean) =>
      api<AdminAiSettings>('/admin/ai/settings', { method: 'PUT', body: { enabled } }),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'ai'], data);
      void queryClient.invalidateQueries({ queryKey: ['ai-status'] });
      toast(t.common.saved);
    },
  });

  if (!settings.data) return <OrnamentLoader label={t.common.loading} />;
  const s = settings.data;
  return (
    <div className="space-y-6">
      <AdminTitle>
        <span className="flex items-center gap-3">
          <NuskaOrb className="h-9 w-9" /> {t.admin.aiTitle}
        </span>
      </AdminTitle>
      <div className="card space-y-4 p-6">
        <Checkbox
          label={t.admin.aiEnabled}
          checked={s.enabled}
          disabled={save.isPending}
          onChange={(e) => save.mutate(e.target.checked)}
        />
        {save.error && <ErrorBox>{errorMessage(save.error, t.errors)}</ErrorBox>}
        {s.providerConfigured ? (
          <Badge tone="green">{t.admin.aiConnected}</Badge>
        ) : (
          <p className="rounded-xl bg-cream-50 p-4 text-sm text-ink-muted">
            {t.admin.aiNotConfigured}
          </p>
        )}
        <p className="text-sm text-ink-soft">{t.admin.aiHowTo}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label={t.admin.aiModel} value={s.model ?? '—'} />
        <Stat label={t.admin.aiUsage} value={`${s.usedToday} / ${s.dailyLimit}`} />
      </div>
    </div>
  );
}
