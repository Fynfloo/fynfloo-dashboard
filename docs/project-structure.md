```
fynfloo-dashboard/
│
├── app/                          # Next.js App Router — routing only
│   ├── (auth)/                   # Auth route group — shared dark layout
│   │   ├── layout.tsx            # Dark bg, logo, wordmark, footer
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
│   └── globals.css               # Brand tokens, base styles
│
├── features/                     # Feature modules — business logic
│   │                             # Pattern: component imports hook
│   │                             # Hook calls apiRequest directly
│   │                             # No intermediate api.ts layer
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx     # ✅ Done
│   │   │   ├── SignupForm.tsx    # ✅ Done
│   │   │   ├── ConfirmEmailForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   └── ResetPasswordForm.tsx
│   │   └── hooks/
│   │       ├── useLogin.ts       # ✅ Done — login + MFA + hydration
│   │       ├── useSignup.ts      # ✅ Done
│   │       ├── useForgotPassword.ts
│   │       └── useResetPassword.ts
│   │
│   ├── onboarding/
│   │   ├── components/
│   │   │   ├── StepStoreName.tsx
│   │   │   ├── StepTemplate.tsx
│   │   │   ├── StepCurrency.tsx
│   │   │   └── OnboardingShell.tsx
│   │   └── hooks/
│   │       └── useOnboarding.ts
│   │
│   ├── products/
│   │   ├── components/
│   │   │   ├── ProductList.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ProductImageUpload.tsx
│   │   │   ├── InventoryPanel.tsx
│   │   │   └── SeoPanel.tsx
│   │   └── hooks/
│   │       ├── useProducts.ts
│   │       └── useProduct.ts
│   │
│   ├── orders/
│   │   ├── components/
│   │   │   ├── OrderList.tsx
│   │   │   ├── OrderDetail.tsx
│   │   │   └── FulfilmentPanel.tsx
│   │   └── hooks/
│   │       ├── useOrders.ts
│   │       └── useOrder.ts
│   │
│   ├── analytics/
│   │   ├── components/
│   │   │   ├── MetricsBar.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   └── TopProducts.tsx
│   │   └── hooks/
│   │       └── useAnalytics.ts
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
│   │   └── hooks/
│   │       └── useSettings.ts
│   │
│   ├── discounts/
│   │   ├── components/
│   │   │   ├── DiscountList.tsx
│   │   │   └── DiscountForm.tsx
│   │   └── hooks/
│   │       └── useDiscounts.ts
│   │
│   └── admin/
│       ├── components/
│       │   ├── MerchantList.tsx
│       │   └── MerchantDetail.tsx
│       └── hooks/
│           └── useAdmin.ts
│
├── components/                   # Shared UI — no business logic
│   ├── ui/                       # Hand-rolled — no shadcn
│   │   ├── button.tsx            # ✅ primary, secondary, ghost, destructive
│   │   ├── input.tsx             # ✅ with error state
│   │   ├── label.tsx             # ✅
│   │   ├── card.tsx              # ✅ Card, CardHeader, CardTitle,
│   │   │                         #    CardDescription, CardContent
│   │   └── badge.tsx             # ✅ default, success, warning,
│   │                             #    destructive, accent
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
│   ├── api.ts                    # ✅ apiRequest + Bearer token
│   │                             #    + silent refresh on 401
│   ├── auth.ts                   # ✅ getMe, logout helpers
│   ├── types.ts                  # ✅ aligned with backend shapes
│   ├── utils.ts                  # ✅ cn, formatCurrency,
│   │                             #    formatDate, getInitials
│   └── constants.ts              # ✅ TEMPLATES, ALL_CURRENCIES,
│                                 #    NAV_ITEMS, deriveGateway
│
├── hooks/                        # Shared React hooks
│   ├── useAuth.ts                # ✅ reads from Zustand auth store
│   ├── useStore.ts               # ✅ current store from URL params
│   └── useDebounce.ts            # ✅
│
├── store/                        # Zustand global state
│   ├── auth.store.ts             # ✅ user, stores, isLoading,
│   │                             #    isInitialised, reset
│   └── ui.store.ts               # ✅ sidebarOpen, toggleSidebar
│
├── proxy.ts                      # Next.js middleware
└── .env.local
```
