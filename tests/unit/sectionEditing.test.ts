import { describe, expect, it } from 'vitest';
import type { StorefrontSection } from '@/lib/types';
import {
  applyEditableSectionDraft,
  applyHeroVariant,
  buildEditableSectionDraft,
  getHeroVariant,
} from '@/features/site-editor/lib/sectionEditing';

describe('section editing helpers', () => {
  it('builds an editable hero draft from section data', () => {
    const section: StorefrontSection = {
      id: 'hero',
      type: 'hero.basic',
      variantKey: 'fullbleed',
      visible: true,
      data: {
        variant: 'fullbleed',
        eyebrow: 'New season',
        title: 'Summer essentials',
        subtitle: 'Pieces designed for warm days.',
        imageUrl: 'https://example.com/hero.jpg',
        primaryCtaLabel: 'Shop now',
        secondaryCtaLabel: 'Learn more',
      },
    };

    expect(buildEditableSectionDraft(section)).toEqual({
      type: 'hero.basic',
      visible: true,
      variant: 'fullbleed',
      eyebrow: 'New season',
      title: 'Summer essentials',
      subtitle: 'Pieces designed for warm days.',
      imageUrl: 'https://example.com/hero.jpg',
      primaryCtaLabel: 'Shop now',
      secondaryCtaLabel: 'Learn more',
    });
  });

  it('changes hero layout without dropping shared content fields', () => {
    const section: StorefrontSection = {
      id: 'hero',
      type: 'hero.basic',
      variantKey: 'split',
      visible: true,
      data: {
        variant: 'split',
        eyebrow: 'New season',
        title: 'Summer essentials',
        subtitle: 'Pieces designed for warm days.',
      },
    };

    const replaced = applyHeroVariant(section, 'fullbleed');

    expect(getHeroVariant(replaced)).toBe('fullbleed');
    expect(replaced.variantKey).toBe('fullbleed');
    expect(replaced.data).toMatchObject({
      variant: 'fullbleed',
      eyebrow: 'New season',
      title: 'Summer essentials',
      subtitle: 'Pieces designed for warm days.',
    });
  });

  it('normalizes text-with-image section edits into section data', () => {
    const section: StorefrontSection = {
      id: 'story',
      type: 'content.textWithMedia',
      visible: true,
      data: {
        title: 'Our story',
        body: 'Original copy',
        imagePosition: 'right',
      },
    };

    const nextSection = applyEditableSectionDraft(section, {
      type: 'content.textWithMedia',
      visible: false,
      eyebrow: 'About us',
      title: 'Our story',
      body: 'Fresh copy for this section.',
      imageUrl: 'https://example.com/story.jpg',
      imageAlt: 'Founder portrait',
      imagePosition: 'left',
    });

    expect(nextSection.visible).toBe(false);
    expect(nextSection.variantKey).toBe('left');
    expect(nextSection.data).toMatchObject({
      eyebrow: 'About us',
      title: 'Our story',
      body: 'Fresh copy for this section.',
      imageUrl: 'https://example.com/story.jpg',
      imageAlt: 'Founder portrait',
      imagePosition: 'left',
    });
  });
});
