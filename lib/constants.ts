// lib/constants.ts

export const TEMPLATES = [
  {
    key: 'minimal-01',
    name: 'Minimal',
    description: 'Clean and understated. Fashion, jewellery, accessories.',
    reference: 'Arket / COS',
    businessType: 'fashion',
  },
  {
    key: 'warm-01',
    name: 'Warm',
    description: 'Soft and inviting. Beauty, wellness, skincare.',
    reference: 'Glossier / Aesop',
    businessType: 'beauty',
  },
  {
    key: 'bold-01',
    name: 'Bold',
    description: 'High energy. Sports, streetwear, general retail.',
    reference: 'Gymshark / Nike',
    businessType: 'sports',
  },
  {
    key: 'events-01',
    name: 'Events',
    description: 'Built for hire and event equipment businesses.',
    reference: 'HSS Hire',
    businessType: 'events',
  },
] as const;

export type TemplateKey = (typeof TEMPLATES)[number]['key'];

export const PAYSTACK_CURRENCIES = ['NGN', 'GHS', 'KES', 'ZAR'] as const;
export const STRIPE_CURRENCIES = ['GBP', 'USD', 'EUR', 'CAD', 'AUD'] as const;

export const ALL_CURRENCIES = [
  { code: 'GBP', name: 'British Pound', symbol: '£', gateway: 'Stripe' },
  { code: 'USD', name: 'US Dollar', symbol: '$', gateway: 'Stripe' },
  { code: 'EUR', name: 'Euro', symbol: '€', gateway: 'Stripe' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', gateway: 'Stripe' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', gateway: 'Stripe' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', gateway: 'Paystack' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', gateway: 'Paystack' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', gateway: 'Paystack' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', gateway: 'Paystack' },
] as const;

export type CurrencyCode = (typeof ALL_CURRENCIES)[number]['code'];

export function deriveGateway(currency: string): 'Stripe' | 'Paystack' {
  return (PAYSTACK_CURRENCIES as readonly string[]).includes(currency) ? 'Paystack' : 'Stripe';
}

export const NAV_ITEMS = [
  { label: 'Overview', href: '', icon: 'LayoutDashboard' },
  { label: 'Products', href: '/products', icon: 'Package' },
  { label: 'Orders', href: '/orders', icon: 'ShoppingBag' },
  { label: 'Customers', href: '/customers', icon: 'Users' },
  { label: 'Discounts', href: '/discounts', icon: 'Tag' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
] as const;
