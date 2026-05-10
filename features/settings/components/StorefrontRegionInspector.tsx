'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, RefreshCw, Save } from 'lucide-react';
import type {
  FooterBrandBlock,
  FooterLinkGroupBlock,
  FooterNewsletterBlock,
  HeaderNavigationBlock,
  LegalFooterBlock,
  RegionBlock,
  RegionKey,
  RegionMap,
  StorefrontLink,
  StorefrontRegionsState,
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

const REGION_COPY: Record<RegionKey, { title: string; description: string }> = {
  announcement: {
    title: 'Announcement Bar',
    description: 'Short promo text shown at the very top of your site.',
  },
  header: {
    title: 'Header',
    description: 'Primary site navigation that appears across the experience.',
  },
  footer: {
    title: 'Footer',
    description: 'Newsletter, brand story, and footer link groups.',
  },
  legalFooter: {
    title: 'Legal Footer',
    description: 'Payment/provider labels and copyright text at the very bottom.',
  },
  comingSoon: {
    title: 'Coming Soon',
    description: 'Temporary launch page content for sites that are not ready to go live.',
  },
};

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
      className="w-full rounded-[var(--radius-md)] px-3 py-2 text-sm outline-none transition-colors"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--bg-border-subtle)',
        color: 'var(--text-primary)',
      }}
    />
  );
}

function TextareaInput(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="min-h-[96px] w-full resize-y rounded-[var(--radius-md)] px-3 py-2 text-sm outline-none transition-colors"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--bg-border-subtle)',
        color: 'var(--text-primary)',
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

function getFooterGroup(draft: RegionMap, id: string): FooterLinkGroupBlock | null {
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

function renderRegionFields(
  regionKey: RegionKey,
  values: Fields,
  update: (patch: Partial<Fields>) => void,
) {
  switch (regionKey) {
    case 'announcement':
      return (
        <Field
          label="Announcement text"
          helper="Leave blank to hide the announcement bar from the storefront shell."
        >
          <TextareaInput
            value={values.announcementText}
            onChange={(e) => update({ announcementText: e.target.value })}
          />
        </Field>
      );
    case 'header':
      return (
        <Field
          label="Navigation links"
          helper="One per line. Use the format Label | /path."
        >
          <TextareaInput
            value={values.headerLinks}
            onChange={(e) => update({ headerLinks: e.target.value })}
          />
        </Field>
      );
    case 'footer':
      return (
        <div className="space-y-5">
          <Field label="Newsletter heading">
            <TextInput
              value={values.footerNewsletterHeading}
              onChange={(e) => update({ footerNewsletterHeading: e.target.value })}
            />
          </Field>
          <Field label="Newsletter body">
            <TextareaInput
              value={values.footerNewsletterBody}
              onChange={(e) => update({ footerNewsletterBody: e.target.value })}
            />
          </Field>
          <Field label="Brand body copy">
            <TextareaInput
              value={values.footerBrandBody}
              onChange={(e) => update({ footerBrandBody: e.target.value })}
            />
          </Field>
          <Field label="Shop group heading">
            <TextInput
              value={values.footerShopHeading}
              onChange={(e) => update({ footerShopHeading: e.target.value })}
            />
          </Field>
          <Field
            label="Shop group links"
            helper="One per line. Use the format Label | /path."
          >
            <TextareaInput
              value={values.footerShopLinks}
              onChange={(e) => update({ footerShopLinks: e.target.value })}
            />
          </Field>
          <Field label="Account group heading">
            <TextInput
              value={values.footerAccountHeading}
              onChange={(e) => update({ footerAccountHeading: e.target.value })}
            />
          </Field>
          <Field
            label="Account group links"
            helper="One per line. Use the format Label | /path."
          >
            <TextareaInput
              value={values.footerAccountLinks}
              onChange={(e) => update({ footerAccountLinks: e.target.value })}
            />
          </Field>
          <Field label="Help group heading">
            <TextInput
              value={values.footerHelpHeading}
              onChange={(e) => update({ footerHelpHeading: e.target.value })}
            />
          </Field>
          <Field
            label="Help group links"
            helper="One per line. Use the format Label | /path."
          >
            <TextareaInput
              value={values.footerHelpLinks}
              onChange={(e) => update({ footerHelpLinks: e.target.value })}
            />
          </Field>
        </div>
      );
    case 'legalFooter':
      return (
        <div className="space-y-5">
          <Field
            label="Copyright text"
            helper="Leave blank to let the storefront fall back to the store name and current year."
          >
            <TextInput
              value={values.legalCopyrightText}
              onChange={(e) => update({ legalCopyrightText: e.target.value })}
            />
          </Field>
          <div className="space-y-3">
            <Toggle
              checked={values.legalShowPaymentProvider}
              onChange={(checked) => update({ legalShowPaymentProvider: checked })}
              label="Show payment provider label"
            />
            <Toggle
              checked={values.legalShowPoweredBy}
              onChange={(checked) => update({ legalShowPoweredBy: checked })}
              label="Show Powered by Fynfloo label"
            />
          </div>
        </div>
      );
    case 'comingSoon':
      return (
        <div className="space-y-5">
          <Field label="Eyebrow">
            <TextInput
              value={values.comingSoonEyebrow}
              onChange={(e) => update({ comingSoonEyebrow: e.target.value })}
            />
          </Field>
          <Field label="Title">
            <TextInput
              value={values.comingSoonTitle}
              onChange={(e) => update({ comingSoonTitle: e.target.value })}
            />
          </Field>
          <Field label="Body">
            <TextareaInput
              value={values.comingSoonBody}
              onChange={(e) => update({ comingSoonBody: e.target.value })}
            />
          </Field>
          <Field label="Newsletter label">
            <TextInput
              value={values.comingSoonNewsletterLabel}
              onChange={(e) => update({ comingSoonNewsletterLabel: e.target.value })}
            />
          </Field>
          <Field label="Powered by label">
            <TextInput
              value={values.comingSoonPoweredByLabel}
              onChange={(e) => update({ comingSoonPoweredByLabel: e.target.value })}
            />
          </Field>
        </div>
      );
  }
}

function serializeFields(values: Fields): string {
  return JSON.stringify(values);
}

type StorefrontRegionInspectorProps = {
  regionKey: RegionKey;
  regions: StorefrontRegionsState | null;
  isLoading: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  isDiscarding: boolean;
  error: string | null;
  saveDraft: (draft: RegionMap) => Promise<boolean>;
  publish: () => Promise<boolean>;
  discard: () => Promise<boolean>;
};

export function StorefrontRegionInspector({
  regionKey,
  regions,
  isLoading,
  isSaving,
  isPublishing,
  isDiscarding,
  error,
  saveDraft,
  publish,
  discard,
}: StorefrontRegionInspectorProps) {
  const [values, setValues] = useState<Fields>(DEFAULT_FIELDS);
  const [saved, setSaved] = useState(false);

  const currentDraft = useMemo(() => regions?.draft ?? {}, [regions]);
  const baseValues = useMemo(
    () => (regions?.draft ? toFormValues(regions.draft) : DEFAULT_FIELDS),
    [regions],
  );

  useEffect(() => {
    setValues(baseValues);
  }, [baseValues]);

  const hasServerDraftChanges = regions?.hasUnpublishedChanges ?? false;
  const hasUnsavedLocalChanges = serializeFields(values) !== serializeFields(baseValues);

  async function handleSave() {
    const ok = await saveDraft(buildDraft(values, currentDraft));
    if (!ok) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleDiscard() {
    const ok = await discard();
    if (ok) {
      setSaved(false);
    }
  }

  if (isLoading) {
    return (
      <div
        className="rounded-[var(--radius-lg)] p-5"
        style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
      >
        <div className="h-48 animate-pulse rounded-[var(--radius-md)]" style={{ background: 'var(--bg-elevated)' }} />
      </div>
    );
  }

  const copy = REGION_COPY[regionKey];

  return (
    <div
      className="rounded-[var(--radius-lg)] p-5 space-y-5"
      style={{ border: '1px solid var(--bg-border-subtle)', background: 'var(--bg-surface)' }}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {copy.title}
          </h2>
          {hasServerDraftChanges ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
              style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Unpublished shell changes
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
              style={{ background: 'var(--green-bg)', color: 'var(--green)' }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Live shell in sync
            </span>
          )}
          {hasUnsavedLocalChanges && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Local edits not saved
            </span>
          )}
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {copy.description} Changes made here carry through your site anywhere this area appears.
        </p>
      </div>

      {saved && (
        <div
          className="rounded-[var(--radius-md)] px-4 py-3 text-sm"
          style={{
            background: 'var(--green-bg)',
            color: 'var(--green)',
            border: '1px solid var(--green-border)',
          }}
        >
          Shell draft saved. Publish when you&apos;re ready to push it live.
        </div>
      )}

      {error && (
        <div
          className="flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm"
          style={{
            borderColor: 'rgba(239, 68, 68, 0.25)',
            background: 'rgba(239, 68, 68, 0.08)',
            color: 'var(--text-primary)',
          }}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {renderRegionFields(regionKey, values, (patch) => setValues((current) => ({ ...current, ...patch })))}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium transition-opacity"
          style={{
            background: 'var(--accent)',
            color: 'white',
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving draft…' : 'Save draft'}
        </button>
        <button
          type="button"
          onClick={() => void publish()}
          disabled={isPublishing || !hasServerDraftChanges || hasUnsavedLocalChanges}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium transition-opacity"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--bg-border-subtle)',
            opacity: isPublishing || !hasServerDraftChanges || hasUnsavedLocalChanges ? 0.6 : 1,
          }}
        >
          <Eye className="h-4 w-4" />
          {isPublishing ? 'Publishing…' : 'Publish'}
        </button>
        <button
          type="button"
          onClick={() => void handleDiscard()}
          disabled={isDiscarding || (!hasServerDraftChanges && !hasUnsavedLocalChanges)}
          className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium transition-opacity"
          style={{
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--bg-border-subtle)',
            opacity: isDiscarding || (!hasServerDraftChanges && !hasUnsavedLocalChanges) ? 0.6 : 1,
          }}
        >
          {isDiscarding ? 'Discarding…' : 'Discard draft'}
        </button>
      </div>
    </div>
  );
}
