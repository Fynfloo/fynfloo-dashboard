'use client';

type Props = { businessName: string };

export function BuildingScreen({ businessName }: Props) {
  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
      />
      <p className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
        Setting up {businessName}&apos;s website…
      </p>
    </div>
  );
}
