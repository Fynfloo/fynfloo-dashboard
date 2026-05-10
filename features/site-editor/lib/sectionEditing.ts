import type { StorefrontSection } from '@/lib/types';

export type HeroVariantKey = 'split' | 'fullbleed';

export type EditableSectionDraft =
  | {
      type: 'hero.basic';
      visible: boolean;
      variant: HeroVariantKey;
      eyebrow: string;
      title: string;
      subtitle: string;
      imageUrl: string;
      primaryCtaLabel: string;
      secondaryCtaLabel: string;
    }
  | {
      type: 'content.textWithMedia';
      visible: boolean;
      eyebrow: string;
      title: string;
      body: string;
      imageUrl: string;
      imageAlt: string;
      imagePosition: 'left' | 'right';
    }
  | {
      type: 'content.testimonials';
      visible: boolean;
      heading: string;
      testimonialsText: string;
    }
  | {
      type: 'commerce.categoryGrid';
      visible: boolean;
      heading: string;
      categoriesText: string;
    }
  | {
      type: 'commerce.featuredCarousel';
      visible: boolean;
      heading: string;
      headingMuted: string;
      promoHeading: string;
      promoSubheading: string;
      promoCtaLabel: string;
    }
  | {
      type: 'commerce.productGrid';
      visible: boolean;
      heading: string;
      subheading: string;
      collectionHandle: string;
      columns: number;
    };

export type HeroVariantOption = {
  key: HeroVariantKey;
  label: string;
  description: string;
};

export const HERO_VARIANT_OPTIONS: HeroVariantOption[] = [
  {
    key: 'split',
    label: 'Split hero',
    description: 'Text on one side with supporting imagery beside it.',
  },
  {
    key: 'fullbleed',
    label: 'Full-bleed hero',
    description: 'Large image-led layout with centered copy.',
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function readBoolean(value: unknown, fallback = true): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function readNumber(record: Record<string, unknown>, key: string, fallback: number): number {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeOptionalText(value: string): string | undefined {
  const cleaned = value.trim();
  return cleaned ? cleaned : undefined;
}

function normalizeNullableText(value: string): string | null {
  const cleaned = value.trim();
  return cleaned ? cleaned : null;
}

function formatTestimonials(record: Record<string, unknown>): string {
  const items = record.testimonials;
  if (!Array.isArray(items)) return '';

  return items
    .filter(isRecord)
    .map((item) => {
      const quote = readString(item, 'quote').trim();
      const name = readString(item, 'name').trim();
      if (!quote && !name) return '';
      return name ? `${quote} | ${name}` : quote;
    })
    .filter(Boolean)
    .join('\n');
}

function parseTestimonials(text: string): Array<{ quote: string; name: string }> {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [quotePart, namePart = ''] = line.split('|');
      return {
        quote: quotePart.trim(),
        name: namePart.trim(),
      };
    })
    .filter((item) => item.quote);
}

function formatCategories(record: Record<string, unknown>): string {
  const items = record.categories;
  if (!Array.isArray(items)) return '';

  return items
    .filter(isRecord)
    .map((item) => {
      const label = readString(item, 'label').trim();
      const handle = readString(item, 'handle').trim();
      const imageUrl = readString(item, 'imageUrl').trim();
      if (!label && !handle && !imageUrl) return '';
      const parts = [label, handle];
      if (imageUrl) parts.push(imageUrl);
      return parts.join(' | ');
    })
    .filter(Boolean)
    .join('\n');
}

function parseCategories(text: string): Array<{ label: string; handle: string; imageUrl?: string }> {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, handlePart = '', imageUrlPart = ''] = line.split('|');
      const label = labelPart.trim();
      const handle = handlePart.trim();
      const imageUrl = imageUrlPart.trim();

      return {
        label,
        handle,
        imageUrl: imageUrl || undefined,
      };
    })
    .filter((item) => item.label && item.handle);
}

export function buildEditableSectionDraft(
  section: StorefrontSection,
): EditableSectionDraft | null {
  if (!isRecord(section.data)) {
    return null;
  }

  const visible = readBoolean(section.visible, true);

  switch (section.type) {
    case 'hero.basic':
      return {
        type: 'hero.basic',
        visible,
        variant: readString(section.data, 'variant') === 'fullbleed' ? 'fullbleed' : 'split',
        eyebrow: readString(section.data, 'eyebrow'),
        title: readString(section.data, 'title'),
        subtitle: readString(section.data, 'subtitle'),
        imageUrl: readString(section.data, 'imageUrl'),
        primaryCtaLabel: readString(section.data, 'primaryCtaLabel'),
        secondaryCtaLabel: readString(section.data, 'secondaryCtaLabel'),
      };

    case 'content.textWithMedia':
      return {
        type: 'content.textWithMedia',
        visible,
        eyebrow: readString(section.data, 'eyebrow'),
        title: readString(section.data, 'title'),
        body: readString(section.data, 'body'),
        imageUrl: readString(section.data, 'imageUrl'),
        imageAlt: readString(section.data, 'imageAlt'),
        imagePosition: readString(section.data, 'imagePosition') === 'left' ? 'left' : 'right',
      };

    case 'content.testimonials':
      return {
        type: 'content.testimonials',
        visible,
        heading: readString(section.data, 'heading'),
        testimonialsText: formatTestimonials(section.data),
      };

    case 'commerce.categoryGrid':
      return {
        type: 'commerce.categoryGrid',
        visible,
        heading: readString(section.data, 'heading'),
        categoriesText: formatCategories(section.data),
      };

    case 'commerce.featuredCarousel':
      return {
        type: 'commerce.featuredCarousel',
        visible,
        heading: readString(section.data, 'heading'),
        headingMuted: readString(section.data, 'headingMuted'),
        promoHeading: readString(section.data, 'promoHeading'),
        promoSubheading: readString(section.data, 'promoSubheading'),
        promoCtaLabel: readString(section.data, 'promoCtaLabel'),
      };

    case 'commerce.productGrid':
      return {
        type: 'commerce.productGrid',
        visible,
        heading: readString(section.data, 'heading'),
        subheading: readString(section.data, 'subheading'),
        collectionHandle: readString(section.data, 'collectionHandle'),
        columns: readNumber(section.data, 'columns', 4),
      };

    default:
      return null;
  }
}

export function applyEditableSectionDraft(
  section: StorefrontSection,
  draft: EditableSectionDraft,
): StorefrontSection {
  switch (draft.type) {
    case 'hero.basic':
      return {
        ...section,
        visible: draft.visible,
        variantKey: draft.variant,
        data: {
          ...section.data,
          variant: draft.variant,
          eyebrow: normalizeOptionalText(draft.eyebrow),
          title: draft.title.trim() || 'Untitled hero',
          subtitle: normalizeOptionalText(draft.subtitle),
          imageUrl: normalizeOptionalText(draft.imageUrl),
          primaryCtaLabel: normalizeOptionalText(draft.primaryCtaLabel),
          secondaryCtaLabel: normalizeOptionalText(draft.secondaryCtaLabel),
        },
      };

    case 'content.textWithMedia':
      return {
        ...section,
        visible: draft.visible,
        variantKey: draft.imagePosition,
        data: {
          ...section.data,
          eyebrow: normalizeOptionalText(draft.eyebrow),
          title: draft.title.trim() || 'Untitled section',
          body: draft.body.trim(),
          imageUrl: normalizeOptionalText(draft.imageUrl),
          imageAlt: normalizeOptionalText(draft.imageAlt),
          imagePosition: draft.imagePosition,
        },
      };

    case 'content.testimonials':
      return {
        ...section,
        visible: draft.visible,
        data: {
          ...section.data,
          heading: draft.heading.trim(),
          testimonials: parseTestimonials(draft.testimonialsText),
        },
      };

    case 'commerce.categoryGrid':
      return {
        ...section,
        visible: draft.visible,
        data: {
          ...section.data,
          heading: normalizeOptionalText(draft.heading),
          categories: parseCategories(draft.categoriesText),
        },
      };

    case 'commerce.featuredCarousel':
      return {
        ...section,
        visible: draft.visible,
        data: {
          ...section.data,
          heading: draft.heading.trim(),
          headingMuted: normalizeOptionalText(draft.headingMuted),
          promoHeading: normalizeOptionalText(draft.promoHeading),
          promoSubheading: normalizeOptionalText(draft.promoSubheading),
          promoCtaLabel: normalizeOptionalText(draft.promoCtaLabel),
        },
      };

    case 'commerce.productGrid':
      return {
        ...section,
        visible: draft.visible,
        data: {
          ...section.data,
          heading: normalizeOptionalText(draft.heading),
          subheading: normalizeOptionalText(draft.subheading),
          collectionHandle: normalizeNullableText(draft.collectionHandle),
          columns: Math.min(4, Math.max(1, Math.round(draft.columns))),
        },
      };
  }
}

export function applyHeroVariant(
  section: StorefrontSection,
  variant: HeroVariantKey,
): StorefrontSection {
  const draft = buildEditableSectionDraft(section);

  if (!draft || draft.type !== 'hero.basic') {
    return section;
  }

  return applyEditableSectionDraft(section, {
    ...draft,
    variant,
  });
}

export function getHeroVariant(section: StorefrontSection): HeroVariantKey {
  const draft = buildEditableSectionDraft(section);
  return draft && draft.type === 'hero.basic' ? draft.variant : 'split';
}
