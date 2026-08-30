import Link from "next/link";

export function AuthCard({
  title,
  subtitle,
  notice,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  notice?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <div className="rounded-lg border border-border bg-surface p-8">
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
        {notice && (
          <p className="mt-4 rounded-md border border-success bg-success/10 px-3 py-2 text-sm text-success">{notice}</p>
        )}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 flex flex-col gap-2 text-sm">{footer}</div>}
      </div>
      <Link href="/" className="mt-4 text-center text-sm font-semibold text-ink-muted no-underline hover:text-ink">
        ← Back to home page
      </Link>
    </main>
  );
}
