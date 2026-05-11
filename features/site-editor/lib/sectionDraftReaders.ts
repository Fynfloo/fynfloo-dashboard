import type { StorefrontSection } from '@/lib/types';
import type { EditableSectionDraft } from './sectionDraftTypes';

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
