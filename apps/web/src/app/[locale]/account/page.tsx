'use client';

import type { User } from '@nuska/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ErrorBox } from '@/components/ui/misc';
import { meKey, useMe } from '@/hooks/use-auth';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { useToast } from '@/stores/toast';

export default function ProfilePage() {
  const { t } = useI18n();
  const me = useMe();
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const user = me.data!;
  const form = useForm({
    defaultValues: {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phone: user.phone ?? '',
    },
  });
  const save = useMutation({
    mutationFn: (values: { firstName: string; lastName: string; phone: string }) =>
      api<User>('/users/me', {
        method: 'PATCH',
        body: {
          firstName: values.firstName,
          lastName: values.lastName || null,
          phone: values.phone || null,
        },
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(meKey, updated);
      toast(t.common.saved);
    },
  });

  return (
    <form
      className="card max-w-xl space-y-4 p-6"
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
    >
      <h2 className="font-serif text-2xl">{t.account.profile}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.auth.firstName}>
          {(id) => (
            <Input
              id={id}
              required
              maxLength={100}
              {...form.register('firstName', { required: true })}
            />
          )}
        </Field>
        <Field label={t.auth.lastName}>
          {(id) => <Input id={id} maxLength={100} {...form.register('lastName')} />}
        </Field>
      </div>
      <Field label={t.auth.phone}>
        {(id) => (
          <Input id={id} type="tel" placeholder="+996 ___ ___ ___" {...form.register('phone')} />
        )}
      </Field>
      <Field label={t.auth.email}>
        {(id) => <Input id={id} value={user.email} disabled readOnly />}
      </Field>
      {save.error && <ErrorBox>{errorMessage(save.error, t.errors)}</ErrorBox>}
      <Button type="submit" loading={save.isPending}>
        {t.common.save}
      </Button>
    </form>
  );
}
