// features/settings/components/GeneralSettingsForm.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateStoreSettings, useSettings } from '../hooks/useSettings';
import { useParams } from 'next/navigation';
import { LogoUpload } from './LogoUpload';

const schema = z.object({
  name: z.string().min(1, 'Store name is required').max(255),
  email: z.email('Enter a valid email').or(z.literal('')),
  phone: z.string().optional(),
});

type Fields = z.infer<typeof schema>;

function Field({
  id,
  label,
  helper,
  children,
}: {
  id?: string;
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        {label}
      </label>
      {children}
      {helper && (
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {helper}
        </p>
      )}
    </div>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  readOnly,
  type = 'text',
}: {
  id?: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      readOnly={readOnly}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full px-3 py-2 rounded-[var(--radius-md)] text-sm outline-none transition-colors"
      style={{
        background: readOnly ? 'var(--bg-surface)' : 'var(--bg-elevated)',
        border: '1px solid var(--bg-border-subtle)',
        color: readOnly ? 'var(--text-secondary)' : 'var(--text-primary)',
        cursor: readOnly ? 'not-allowed' : 'text',
      }}
      onFocus={(e) => {
        if (!readOnly) e.currentTarget.style.borderColor = 'var(--accent)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--bg-border-subtle)';
      }}
    />
  );
}

export function GeneralSettingsForm() {
  const params = useParams();
  const storeId = params.storeId as string;
  const { settings, isLoading, isSaving, error, saveSettings, setSettings } = useSettings(storeId);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [saved, setSaved] = useState(false);
  const loadedRef = useRef(false);

  const form = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  const name = useWatch({ control: form.control, name: 'name' });
  const email = useWatch({ control: form.control, name: 'email' });
  const phone = useWatch({ control: form.control, name: 'phone' });

  useEffect(() => {
    if (settings) {
      form.reset({
        name: settings.name,
        email: settings.email ?? '',
        phone: settings.phone ?? '',
      });
      loadedRef.current = true;
    }
  }, [settings, form]);

  async function onSubmit(data: Fields) {
    const ok = await saveSettings(data);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  async function handleToggleStatus() {
    if (!settings) return;
    const newStatus = settings.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setIsTogglingStatus(true);
    try {
      const updated = await updateStoreSettings(storeId, { status: newStatus });
      setSettings(updated);
    } catch {
      // silent — useSettings error state handles display
    } finally {
      setIsTogglingStatus(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-xl space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 rounded-[var(--radius-md)]"
            style={{ background: 'var(--bg-elevated)' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      {error && (
        <div
          className="px-4 py-3 rounded-[var(--radius-md)] text-sm"
          style={{
            background: 'var(--red-bg)',
            color: 'var(--red)',
            border: '1px solid var(--red-border)',
          }}
        >
          {error}
        </div>
      )}

      <Field id="name" label="Store name">
        {form.formState.errors.name && (
          <p className="text-xs" style={{ color: 'var(--red)' }}>
            {form.formState.errors.name.message}
          </p>
        )}
        <TextInput
          id="name"
          value={name}
          onChange={(v) => form.setValue('name', v)}
          placeholder="My Store"
        />
      </Field>

      <Field label="Logo">
        <LogoUpload
          tenantId={storeId}
          settings={settings!}
          onUpdate={(updated) => setSettings(updated)}
        />
      </Field>

      <Field
        id="slug"
        label="Subdomain"
        helper="Subdomain cannot be changed after your first order."
      >
        <div className="flex">
          <input
            id="slug"
            value={settings?.slug ?? ''}
            readOnly
            className="flex-1 px-3 py-2 text-sm rounded-l-[var(--radius-md)]"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border-subtle)',
              borderRight: 'none',
              color: 'var(--text-secondary)',
              cursor: 'not-allowed',
            }}
          />
          <span
            className="px-3 py-2 text-sm rounded-r-[var(--radius-md)] shrink-0"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            .fynfloo.com
          </span>
        </div>
      </Field>

      <Field
        id="currency"
        label="Currency"
        helper="Currency cannot be changed after your first order."
      >
        <TextInput id="currency" value={settings?.currency ?? ''} readOnly />
      </Field>

      <Field
        id="email"
        label="Contact email"
        helper="Shown to customers on receipts and order emails."
      >
        {form.formState.errors.email && (
          <p className="text-xs" style={{ color: 'var(--red)' }}>
            {form.formState.errors.email.message}
          </p>
        )}
        <TextInput
          id="email"
          type="email"
          value={email}
          onChange={(v) => form.setValue('email', v)}
          placeholder="hello@yourstore.com"
        />
      </Field>

      <Field id="phone" label="Phone (optional)">
        {form.formState.errors.phone && (
          <p className="text-xs" style={{ color: 'var(--red)' }}>
            {form.formState.errors.phone.message}
          </p>
        )}
        <TextInput
          id="phone"
          type="tel"
          value={phone ?? ''}
          onChange={(v) => form.setValue('phone', v)}
          placeholder="+44 20 1234 5678"
        />
      </Field>

      {/* Store status */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)]"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--bg-border-subtle)',
        }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {settings?.status === 'ACTIVE' ? 'Store is live' : 'Store is offline'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {settings?.status === 'ACTIVE'
              ? 'Your store is visible to customers.'
              : 'Customers see a coming soon page.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleStatus}
          disabled={isTogglingStatus}
          className="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200"
          style={{
            background: settings?.status === 'ACTIVE' ? 'var(--green)' : 'var(--bg-border-subtle)',
            opacity: isTogglingStatus ? 0.6 : 1,
            cursor: isTogglingStatus ? 'not-allowed' : 'pointer',
          }}
        >
          <span
            className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 mt-0.5"
            style={{
              transform: settings?.status === 'ACTIVE' ? 'translateX(22px)' : 'translateX(2px)',
            }}
          />
        </button>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSaving}
          className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-opacity"
          style={{
            background: 'var(--accent)',
            color: 'white',
            opacity: isSaving ? 0.6 : 1,
            cursor: isSaving ? 'not-allowed' : 'pointer',
          }}
        >
          {isSaving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && (
          <span className="text-sm" style={{ color: 'var(--green)' }}>
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
