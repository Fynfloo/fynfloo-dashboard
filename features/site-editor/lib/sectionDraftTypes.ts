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
    }
  | {
      type: 'commerce.productHero';
      visible: boolean;
      showBreadcrumbs: boolean;
      showBadges: boolean;
    }
  | {
      type: 'commerce.productSpecs';
      visible: boolean;
      showDescription: boolean;
      showDetailsList: boolean;
    }
  | {
      type: 'commerce.relatedProducts';
      visible: boolean;
      heading: string;
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
