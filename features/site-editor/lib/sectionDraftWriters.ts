import type { StorefrontSection } from '@/lib/types';
import type { EditableSectionDraft, HeroVariantKey } from './sectionDraftTypes';
import { buildEditableSectionDraft } from './sectionDraftReaders';

function normalizeOptionalText(value: string): string | undefined {
  const cleaned = value.trim();
  return cleaned ? cleaned : undefined;
}

function normalizeNullableText(value: string): string | null {
  const cleaned = value.trim();
  return cleaned ? cleaned : null;
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

function parseCategories(text: string): Array<{ label: string; handle: string; imageUrl?: string }> {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, handlePart = '', imageUrlPart = ''] = line.split('|');
      return {
        label: labelPart.trim(),
        handle: handlePart.trim(),
        imageUrl: imageUrlPart.trim() || undefined,
      };
    })
    .filter((item) => item.label && item.handle);
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

    case 'content.testimonials': {
      const parsed = draft.testimonialsText.trim() ? parseTestimonials(draft.testimonialsText) : null;
      return {
        ...section,
        visible: draft.visible,
        data: {
          ...section.data,
          heading: draft.heading.trim(),
          ...(parsed !== null && { testimonials: parsed }),
        },
      };
    }

    case 'commerce.categoryGrid': {
      const parsed = draft.categoriesText.trim() ? parseCategories(draft.categoriesText) : null;
      return {
        ...section,
        visible: draft.visible,
        data: {
          ...section.data,
          heading: normalizeOptionalText(draft.heading),
          ...(parsed !== null && { categories: parsed }),
        },
      };
    }

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

    case 'commerce.productHero':
      return {
        ...section,
        visible: draft.visible,
        data: {
          ...section.data,
          showBreadcrumbs: draft.showBreadcrumbs,
          showBadges: draft.showBadges,
        },
      };

    case 'commerce.productSpecs':
      return {
        ...section,
        visible: draft.visible,
        data: {
          ...section.data,
          showDescription: draft.showDescription,
          showDetailsList: draft.showDetailsList,
        },
      };

    case 'commerce.relatedProducts':
      return {
        ...section,
        visible: draft.visible,
        data: {
          ...section.data,
          heading: draft.heading.trim() || 'You may also like',
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

  return applyEditableSectionDraft(section, { ...draft, variant });
}

export function getHeroVariant(section: StorefrontSection): HeroVariantKey {
  const draft = buildEditableSectionDraft(section);
  return draft && draft.type === 'hero.basic' ? draft.variant : 'split';
}
