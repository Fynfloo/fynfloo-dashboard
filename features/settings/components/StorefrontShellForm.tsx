'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Eye, RefreshCw, Save } from 'lucide-react';
import {
  useStorefrontRegions,
} from '../hooks/useStorefrontRegions';
import type {
  FooterBrandBlock,
  FooterLinkGroupBlock,
  FooterNewsletterBlock,
  HeaderNavigationBlock,
  LegalFooterBlock,
  RegionBlock,
  RegionMap,
  StorefrontLink,
} from '@/lib/types';

type Fields = {
  announcementText: string;
  headerLinks: string;
  footerNewsletterHeading: string;
  footerNewsletterBody: string;
  footerBrandBody: string;
  footerShopHeading: string;
  footerShopLinks: string;
  footerAccountHeading: string;
  footerAccountLinks: string;
  footerHelpHeading: string;
  footerHelpLinks: string;
  legalCopyrightText: string;
  legalShowPaymentProvider: boolean;
  legalShowPoweredBy: boolean;
  comingSoonEyebrow: string;
  comingSoonTitle: string;
  comingSoonBody: string;
  comingSoonNewsletterLabel: string;
  comingSoonPoweredByLabel: string;
};

const DEFAULT_FIELDS: Fields = {
  announcementText: '',
  headerLinks: 'Shop | /products',
  footerNewsletterHeading: 'Stay in the loop',
  footerNewsletterBody: 'New arrivals, exclusive offers and more.',
  footerBrandBody: 'Quality products, delivered with care.',
  footerShopHeading: 'Shop',
  footerShopLinks: 'All Products | /products\nCart | /cart',
  footerAccountHeading: 'Account',
  footerAccountLinks: 'Sign in | /account/login\nCreate Account | /account/signup\nOrder History | /account/orders',
  footerHelpHeading: 'Help',
  footerHelpLinks: 'Contact Us\nShipping Policy\nReturns',
  legalCopyrightText: '',
  legalShowPaymentProvider: true,
  legalShowPoweredBy: true,
  comingSoonEyebrow: '',
  comingSoonTitle: 'Something exciting is coming',
  comingSoonBody:
    "We're putting the finishing touches on something special. Be the first to know when we launch.",
  comingSoonNewsletterLabel: 'Get notified',
  comingSoonPoweredByLabel: 'Powered by Fynfloo',
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-[var(--radius-lg)] p-5 space-y-4"
      style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
    >
      <div className="space-y-1">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
        {description && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
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

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 rounded-[var(--radius-md)] text-sm outline-none transition-colors"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--bg-border-subtle)',
        color: 'var(--text-primary)',
      }}
      onFocus={(e) => {
        props.onFocus?.(e);
        e.currentTarget.style.borderColor = 'var(--accent)';
      }}
      onBlur={(e) => {
        props.onBlur?.(e);
        e.currentTarget.style.borderColor = 'var(--bg-border-subtle)';
      }}
    />
  );
}

function TextareaInput(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full px-3 py-2 rounded-[var(--radius-md)] text-sm outline-none transition-colors resize-y min-h-[96px]"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--bg-border-subtle)',
        color: 'var(--text-primary)',
      }}
      onFocus={(e) => {
        props.onFocus?.(e);
        e.currentTarget.style.borderColor = 'var(--accent)';
      }}
      onBlur={(e) => {
        props.onBlur?.(e);
        e.currentTarget.style.borderColor = 'var(--bg-border-subtle)';
      }}
    />
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-primary)' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}

function parseLinks(text: string): StorefrontLink[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawLabel, rawHref] = line.split('|').map((part) => part.trim());
      return {
        label: rawLabel,
        href: rawHref ? rawHref : null,
      };
    })
    .filter((link) => link.label);
}

function formatLinkHref(link: StorefrontLink): string | null {
  if (link.href) return link.href;
  if (!link.target) return null;

  switch (link.target.type) {
    case 'path':
    case 'contentPage':
      return link.target.path;
    case 'systemPage': {
      const systemPaths: Record<string, string> = {
        home: '/',
        products: '/products',
        cart: '/cart',
        'account.login': '/account/login',
        'account.signup': '/account/signup',
        'account.orders': '/account/orders',
        'account.profile': '/account/profile',
        'checkout.success': '/checkout/success',
      };

      return systemPaths[link.target.page] ?? null;
    }
    case 'product':
      return `/products/${link.target.handle}`;
    case 'collection':
      return `/collections/${link.target.handle}`;
    case 'external':
      return link.target.url;
    case 'email':
      return `mailto:${link.target.email}`;
    case 'phone':
      return `tel:${link.target.phone}`;
  }
}

function stringifyLinks(links: StorefrontLink[] | undefined): string {
  return (links ?? [])
    .map((link) => {
      const href = formatLinkHref(link);
      return href ? `${link.label} | ${href}` : link.label;
    })
    .join('\n');
}

function getRegionBlocks<TType extends RegionBlock['type']>(
  draft: RegionMap,
  key: keyof RegionMap,
  type: TType,
): Array<Extract<RegionBlock, { type: TType }>> {
  const region = draft[key];
  if (!region) return [];
  return region.blocks.filter(
    (block): block is Extract<RegionBlock, { type: TType }> => block.type === type,
  );
}

function getFirstRegionBlock<TType extends RegionBlock['type']>(
  draft: RegionMap,
  key: keyof RegionMap,
  type: TType,
): Extract<RegionBlock, { type: TType }> | null {
  return getRegionBlocks(draft, key, type)[0] ?? null;
}

function getFooterGroup(
  draft: RegionMap,
  id: string,
): FooterLinkGroupBlock | null {
  const groups = getRegionBlocks(draft, 'footer', 'footer.linkGroup');
  return groups.find((block) => block.id === id) ?? null;
}

function toFormValues(draft: RegionMap): Fields {
  const announcementBlock = getFirstRegionBlock(draft, 'announcement', 'announcement.message');
  const headerBlock = getFirstRegionBlock(draft, 'header', 'header.navigation');
  const newsletterBlock = getFirstRegionBlock(draft, 'footer', 'footer.newsletter');
  const brandBlock = getFirstRegionBlock(draft, 'footer', 'footer.brand');
  const legalBlock = getFirstRegionBlock(draft, 'legalFooter', 'legal.footer');
  const comingSoonBlock = getFirstRegionBlock(draft, 'comingSoon', 'comingSoon.message');
  const shopGroup = getFooterGroup(draft, 'footer-shop-links');
  const accountGroup = getFooterGroup(draft, 'footer-account-links');
  const helpGroup = getFooterGroup(draft, 'footer-help-links');

  return {
    announcementText: announcementBlock?.data.text ?? DEFAULT_FIELDS.announcementText,
    headerLinks: stringifyLinks(headerBlock?.data.links) || DEFAULT_FIELDS.headerLinks,
    footerNewsletterHeading:
      newsletterBlock?.data.heading ?? DEFAULT_FIELDS.footerNewsletterHeading,
    footerNewsletterBody: newsletterBlock?.data.body ?? DEFAULT_FIELDS.footerNewsletterBody,
    footerBrandBody: brandBlock?.data.body ?? DEFAULT_FIELDS.footerBrandBody,
    footerShopHeading: shopGroup?.data.heading ?? DEFAULT_FIELDS.footerShopHeading,
    footerShopLinks: stringifyLinks(shopGroup?.data.links) || DEFAULT_FIELDS.footerShopLinks,
    footerAccountHeading: accountGroup?.data.heading ?? DEFAULT_FIELDS.footerAccountHeading,
    footerAccountLinks:
      stringifyLinks(accountGroup?.data.links) || DEFAULT_FIELDS.footerAccountLinks,
    footerHelpHeading: helpGroup?.data.heading ?? DEFAULT_FIELDS.footerHelpHeading,
    footerHelpLinks: stringifyLinks(helpGroup?.data.links) || DEFAULT_FIELDS.footerHelpLinks,
    legalCopyrightText:
      legalBlock?.data.copyrightText ?? DEFAULT_FIELDS.legalCopyrightText,
    legalShowPaymentProvider:
      legalBlock?.data.showPaymentProvider ?? DEFAULT_FIELDS.legalShowPaymentProvider,
    legalShowPoweredBy:
      legalBlock?.data.showPoweredBy ?? DEFAULT_FIELDS.legalShowPoweredBy,
    comingSoonEyebrow: comingSoonBlock?.data.eyebrow ?? DEFAULT_FIELDS.comingSoonEyebrow,
    comingSoonTitle: comingSoonBlock?.data.title ?? DEFAULT_FIELDS.comingSoonTitle,
    comingSoonBody: comingSoonBlock?.data.body ?? DEFAULT_FIELDS.comingSoonBody,
    comingSoonNewsletterLabel:
      comingSoonBlock?.data.newsletterLabel ?? DEFAULT_FIELDS.comingSoonNewsletterLabel,
    comingSoonPoweredByLabel:
      comingSoonBlock?.data.poweredByLabel ?? DEFAULT_FIELDS.comingSoonPoweredByLabel,
  };
}

function buildDraft(values: Fields, currentDraft: RegionMap): RegionMap {
  const announcementBlock = getFirstRegionBlock(currentDraft, 'announcement', 'announcement.message');
  const headerBlock = getFirstRegionBlock(currentDraft, 'header', 'header.navigation');
  const newsletterBlock = getFirstRegionBlock(currentDraft, 'footer', 'footer.newsletter');
  const brandBlock = getFirstRegionBlock(currentDraft, 'footer', 'footer.brand');
  const shopGroup = getFooterGroup(currentDraft, 'footer-shop-links');
  const accountGroup = getFooterGroup(currentDraft, 'footer-account-links');
  const helpGroup = getFooterGroup(currentDraft, 'footer-help-links');
  const legalBlock = getFirstRegionBlock(currentDraft, 'legalFooter', 'legal.footer');
  const comingSoonBlock = getFirstRegionBlock(currentDraft, 'comingSoon', 'comingSoon.message');

  return {
    announcement: {
      key: 'announcement',
      blocks: [
        {
          id: announcementBlock?.id ?? 'announcement-message',
          type: 'announcement.message',
          visible: Boolean(values.announcementText.trim()),
          data: {
            text: values.announcementText.trim(),
            dismissible: announcementBlock?.data.dismissible ?? true,
          },
        },
      ],
    },
    header: {
      key: 'header',
      blocks: [
        {
          id: headerBlock?.id ?? 'header-navigation',
          type: 'header.navigation',
          visible: headerBlock?.visible ?? true,
          data: {
            links: parseLinks(values.headerLinks),
          },
        } satisfies HeaderNavigationBlock,
      ],
    },
    footer: {
      key: 'footer',
      blocks: [
        {
          id: newsletterBlock?.id ?? 'footer-newsletter',
          type: 'footer.newsletter',
          visible: newsletterBlock?.visible ?? true,
          data: {
            heading: values.footerNewsletterHeading.trim(),
            body: values.footerNewsletterBody.trim(),
          },
        } satisfies FooterNewsletterBlock,
        {
          id: brandBlock?.id ?? 'footer-brand',
          type: 'footer.brand',
          visible: brandBlock?.visible ?? true,
          data: {
            body: values.footerBrandBody.trim(),
            socialLinks: brandBlock?.data.socialLinks ?? [],
          },
        } satisfies FooterBrandBlock,
        {
          id: shopGroup?.id ?? 'footer-shop-links',
          type: 'footer.linkGroup',
          visible: shopGroup?.visible ?? true,
          data: {
            heading: values.footerShopHeading.trim(),
            links: parseLinks(values.footerShopLinks),
          },
        } satisfies FooterLinkGroupBlock,
        {
          id: accountGroup?.id ?? 'footer-account-links',
          type: 'footer.linkGroup',
          visible: accountGroup?.visible ?? true,
          data: {
            heading: values.footerAccountHeading.trim(),
            links: parseLinks(values.footerAccountLinks),
          },
        } satisfies FooterLinkGroupBlock,
        {
          id: helpGroup?.id ?? 'footer-help-links',
          type: 'footer.linkGroup',
          visible: helpGroup?.visible ?? true,
          data: {
            heading: values.footerHelpHeading.trim(),
            links: parseLinks(values.footerHelpLinks),
          },
        } satisfies FooterLinkGroupBlock,
      ],
    },
    legalFooter: {
      key: 'legalFooter',
      blocks: [
        {
          id: legalBlock?.id ?? 'legal-footer',
          type: 'legal.footer',
          visible: legalBlock?.visible ?? true,
          data: {
            copyrightText: values.legalCopyrightText.trim() || undefined,
            showPaymentProvider: values.legalShowPaymentProvider,
            showPoweredBy: values.legalShowPoweredBy,
          },
        } satisfies LegalFooterBlock,
      ],
    },
    comingSoon: {
      key: 'comingSoon',
      blocks: [
        {
          id: comingSoonBlock?.id ?? 'coming-soon-message',
          type: 'comingSoon.message',
          visible: comingSoonBlock?.visible ?? true,
          data: {
            eyebrow: values.comingSoonEyebrow.trim() || undefined,
            title: values.comingSoonTitle.trim(),
            body: values.comingSoonBody.trim(),
            newsletterLabel: values.comingSoonNewsletterLabel.trim() || undefined,
            poweredByLabel: values.comingSoonPoweredByLabel.trim() || undefined,
          },
        },
      ],
    },
  };
}

export function StorefrontShellForm() {
  const params = useParams();
  const storeId = params.storeId as string;
  const {
    regions,
    isLoading,
    isSaving,
    isPublishing,
    isDiscarding,
    error,
    saveDraft,
    publish,
    discard,
  } = useStorefrontRegions(storeId);
  const [saved, setSaved] = useState(false);

  const form = useForm<Fields>({
    defaultValues: DEFAULT_FIELDS,
  });
  const legalShowPaymentProvider = useWatch({
    control: form.control,
    name: 'legalShowPaymentProvider',
  });
  const legalShowPoweredBy = useWatch({
    control: form.control,
    name: 'legalShowPoweredBy',
  });

  const currentDraft = useMemo(() => regions?.draft ?? {}, [regions]);

  useEffect(() => {
    if (regions?.draft) {
      form.reset(toFormValues(regions.draft));
    }
  }, [regions, form]);

  async function handleSave(values: Fields) {
    const ok = await saveDraft(buildDraft(values, currentDraft));
    if (ok) {
      setSaved(true);
      form.reset(values);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  async function handleDiscard() {
    const ok = await discard();
    if (ok) {
      setSaved(false);
    }
  }

  const hasServerDraftChanges = regions?.hasUnpublishedChanges ?? false;
  const hasUnsavedLocalChanges = form.formState.isDirty;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-4xl">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-[var(--radius-lg)]"
            style={{ background: 'var(--bg-elevated)' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div
        className="rounded-[var(--radius-lg)] p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Storefront Shell
            </h2>
            {hasServerDraftChanges ? (
              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Unpublished changes
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                style={{ background: 'var(--green-bg)', color: 'var(--green)' }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Published state in sync
              </span>
            )}
            {hasUnsavedLocalChanges && (
              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Local edits not saved
              </span>
            )}
          </div>
          <p className="text-sm max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            Edit the announcement bar, navigation, footer, legal strip, and coming-soon shell.
            This workspace gives those shared areas a dedicated editing surface.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={form.handleSubmit(handleSave)}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-opacity"
            style={{
              background: 'var(--accent)',
              color: 'white',
              opacity: isSaving ? 0.6 : 1,
              cursor: isSaving ? 'not-allowed' : 'pointer',
            }}
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving draft…' : 'Save draft'}
          </button>
          <button
            type="button"
            onClick={() => void publish()}
            disabled={isPublishing || !hasServerDraftChanges || hasUnsavedLocalChanges}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-opacity"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--bg-border-subtle)',
              opacity: isPublishing || !hasServerDraftChanges || hasUnsavedLocalChanges ? 0.6 : 1,
              cursor:
                isPublishing || !hasServerDraftChanges || hasUnsavedLocalChanges
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            <Eye className="h-4 w-4" />
            {isPublishing ? 'Publishing…' : 'Publish'}
          </button>
          <button
            type="button"
            onClick={() => void handleDiscard()}
            disabled={isDiscarding || (!hasServerDraftChanges && !hasUnsavedLocalChanges)}
            className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-opacity"
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--bg-border-subtle)',
              opacity: isDiscarding || (!hasServerDraftChanges && !hasUnsavedLocalChanges) ? 0.6 : 1,
              cursor:
                isDiscarding || (!hasServerDraftChanges && !hasUnsavedLocalChanges)
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            {isDiscarding ? 'Discarding…' : 'Discard draft'}
          </button>
        </div>
      </div>

      {saved && (
        <div
          className="px-4 py-3 rounded-[var(--radius-md)] text-sm"
          style={{
            background: 'var(--green-bg)',
            color: 'var(--green)',
            border: '1px solid var(--green-border)',
          }}
        >
          Draft saved. Publish when you&apos;re ready to push these shell changes live.
        </div>
      )}

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

      <Section
        title="Announcement Bar"
        description="Shown above the header when there is active announcement copy."
      >
        <Field
          label="Announcement text"
          helper="Leave blank to hide the announcement bar."
        >
          <TextInput {...form.register('announcementText')} placeholder="Free UK shipping on orders over £80" />
        </Field>
      </Section>

      <Section
        title="Header Navigation"
        description="One link per line using the format Label | /path."
      >
        <Field
          label="Navigation links"
          helper="Example: Shop | /products"
        >
          <TextareaInput {...form.register('headerLinks')} />
        </Field>
      </Section>

      <Section
        title="Footer"
        description="Newsletter copy, brand statement, and footer link groups."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Newsletter heading">
            <TextInput {...form.register('footerNewsletterHeading')} />
          </Field>
          <Field label="Brand body">
            <TextInput {...form.register('footerBrandBody')} />
          </Field>
        </div>

        <Field label="Newsletter body">
          <TextareaInput {...form.register('footerNewsletterBody')} />
        </Field>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3">
            <Field label="Shop group heading">
              <TextInput {...form.register('footerShopHeading')} />
            </Field>
            <Field
              label="Shop links"
              helper="One per line using Label | /path."
            >
              <TextareaInput {...form.register('footerShopLinks')} />
            </Field>
          </div>

          <div className="space-y-3">
            <Field label="Account group heading">
              <TextInput {...form.register('footerAccountHeading')} />
            </Field>
            <Field
              label="Account links"
              helper="One per line using Label | /path."
            >
              <TextareaInput {...form.register('footerAccountLinks')} />
            </Field>
          </div>

          <div className="space-y-3">
            <Field label="Help group heading">
              <TextInput {...form.register('footerHelpHeading')} />
            </Field>
            <Field
              label="Help links"
              helper="Use plain text with no path to keep a line non-clickable."
            >
              <TextareaInput {...form.register('footerHelpLinks')} />
            </Field>
          </div>
        </div>
      </Section>

      <Section
        title="Legal Footer"
        description="The bottom strip below the main footer content."
      >
        <Field
          label="Copyright text"
          helper="Leave blank to use the default year + store name format."
        >
          <TextInput {...form.register('legalCopyrightText')} placeholder="© 2026 Brand Name. All rights reserved." />
        </Field>
        <div className="flex flex-col gap-3">
          <Toggle
            checked={legalShowPaymentProvider}
            onChange={(checked) => form.setValue('legalShowPaymentProvider', checked, { shouldDirty: true })}
            label="Show payment provider label"
          />
          <Toggle
            checked={legalShowPoweredBy}
            onChange={(checked) => form.setValue('legalShowPoweredBy', checked, { shouldDirty: true })}
            label="Show Powered by Fynfloo"
          />
        </div>
      </Section>

      <Section
        title="Coming Soon"
        description="Copy shown when the store is set to inactive."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Eyebrow"
            helper="Defaults to the store name when left blank."
          >
            <TextInput {...form.register('comingSoonEyebrow')} />
          </Field>
          <Field label="Newsletter label">
            <TextInput {...form.register('comingSoonNewsletterLabel')} />
          </Field>
        </div>

        <Field label="Title">
          <TextInput {...form.register('comingSoonTitle')} />
        </Field>

        <Field label="Body">
          <TextareaInput {...form.register('comingSoonBody')} />
        </Field>

        <Field label="Powered by label">
          <TextInput {...form.register('comingSoonPoweredByLabel')} />
        </Field>
      </Section>
    </div>
  );
}
