```
fynfloo-dashboard/
│
├── app/                          # Next.js App Router — routing only
│   ├── (auth)/                   # Auth route group — no layout
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── confirm-email/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   └── reset-password/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/              # Dashboard route group — sidebar layout
│   │   ├── layout.tsx            # Sidebar + header shell
│   │   ├── dashboard/
│   │   │   └── [storeId]/
│   │   │       ├── page.tsx      # Overview / analytics
│   │   │       ├── products/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── new/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx
│   │   │       ├── orders/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx
│   │   │       ├── customers/
│   │   │       │   └── page.tsx
│   │   │       ├── discounts/
│   │   │       │   └── page.tsx
│   │   │       └── settings/
│   │   │           ├── page.tsx
│   │   │           ├── theme/
│   │   │           │   └── page.tsx
│   │   │           ├── payments/
│   │   │           │   └── page.tsx
│   │   │           ├── shipping/
│   │   │           │   └── page.tsx
│   │   │           ├── domain/
│   │   │           │   └── page.tsx
│   │   │           ├── security/
│   │   │           │   └── page.tsx
│   │   │           ├── pages/
│   │   │           │   └── page.tsx
│   │   │           └── delivery/
│   │   │               └── page.tsx
│   │   └── dashboard/
│   │       └── page.tsx          # Redirects to first store
│   │
│   ├── onboarding/               # Onboarding wizard — own layout
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── admin/                    # Platform admin — own layout
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Redirects to /admin/merchants
│   │   └── merchants/
│   │       ├── page.tsx
│   │       └── [tenantId]/
│   │           └── page.tsx
│   │
│   ├── layout.tsx                # Root layout — Providers only
│   ├── page.tsx                  # Redirects to /login
│   ├── providers.tsx             # TanStack Query provider
│   └── globals.css
│
├── features/                     # Feature modules — business logic
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── MfaForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   └── ResetPasswordForm.tsx
│   │   ├── hooks/
│   │   │   ├── useLogin.ts
│   │   │   ├── useSignup.ts
│   │   │   └── useMfa.ts
│   │   └── api.ts                # Auth API calls
│   │
│   ├── onboarding/
│   │   ├── components/
│   │   │   ├── StepStoreName.tsx
│   │   │   ├── StepTemplate.tsx
│   │   │   ├── StepCurrency.tsx
│   │   │   └── OnboardingShell.tsx
│   │   ├── hooks/
│   │   │   └── useOnboarding.ts
│   │   └── api.ts
│   │
│   ├── products/
│   │   ├── components/
│   │   │   ├── ProductList.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ProductImageUpload.tsx
│   │   │   ├── InventoryPanel.tsx
│   │   │   └── SeoPanel.tsx
│   │   ├── hooks/
│   │   │   ├── useProducts.ts
│   │   │   └── useProduct.ts
│   │   └── api.ts
│   │
│   ├── orders/
│   │   ├── components/
│   │   │   ├── OrderList.tsx
│   │   │   ├── OrderDetail.tsx
│   │   │   └── FulfilmentPanel.tsx
│   │   ├── hooks/
│   │   │   ├── useOrders.ts
│   │   │   └── useOrder.ts
│   │   └── api.ts
│   │
│   ├── analytics/
│   │   ├── components/
│   │   │   ├── MetricsBar.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   └── TopProducts.tsx
│   │   ├── hooks/
│   │   │   └── useAnalytics.ts
│   │   └── api.ts
│   │
│   ├── settings/
│   │   ├── components/
│   │   │   ├── GeneralSettings.tsx
│   │   │   ├── ThemeSettings.tsx
│   │   │   ├── PaymentSettings.tsx
│   │   │   ├── ShippingSettings.tsx
│   │   │   ├── DomainSettings.tsx
│   │   │   ├── SecuritySettings.tsx
│   │   │   └── DeliverySettings.tsx
│   │   ├── hooks/
│   │   │   └── useSettings.ts
│   │   └── api.ts
│   │
│   ├── discounts/
│   │   ├── components/
│   │   │   ├── DiscountList.tsx
│   │   │   └── DiscountForm.tsx
│   │   ├── hooks/
│   │   │   └── useDiscounts.ts
│   │   └── api.ts
│   │
│   └── admin/
│       ├── components/
│       │   ├── MerchantList.tsx
│       │   └── MerchantDetail.tsx
│       ├── hooks/
│       │   └── useAdmin.ts
│       └── api.ts
│
├── components/                   # Shared UI — no business logic
│   ├── ui/                       # shadcn primitives (auto-generated)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── layout/                   # Layout building blocks
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── StoreSelector.tsx
│   │   ├── UserMenu.tsx
│   │   └── MfaNudgeBanner.tsx
│   └── shared/                   # Reusable across features
│       ├── PageHeader.tsx        # Page title + actions bar
│       ├── EmptyState.tsx        # Empty list state
│       ├── ErrorMessage.tsx      # Inline error display
│       ├── LoadingSpinner.tsx
│       ├── ConfirmDialog.tsx     # Delete confirmations
│       ├── DataTable.tsx         # Shared table component
│       └── StatusBadge.tsx       # Order/payment status badges
│
├── lib/                          # Pure utilities — no React
│   ├── api.ts                    # apiRequest + token management
│   ├── auth.ts                   # getMe, logout helpers
│   ├── types.ts                  # Shared TypeScript types
│   ├── utils.ts                  # cn(), formatCurrency(), formatDate()
│   └── constants.ts              # TEMPLATES, CURRENCIES, etc.
│
├── hooks/                        # Shared React hooks
│   ├── useAuth.ts                # useAuth — user + stores state
│   ├── useStore.ts               # Current store from URL params
│   └── useDebounce.ts
│
├── store/                        # Zustand global state
│   ├── auth.store.ts             # user, stores, accessToken
│   └── ui.store.ts               # sidebar open/close, etc.
│
├── middleware.ts                 # Next.js middleware
└── .env.local
```
