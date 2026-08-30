import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand text-white hover:brightness-95",
  secondary: "bg-surface text-ink border border-border hover:brightness-95",
  ghost: "bg-transparent text-ink border border-border hover:brightness-95",
  danger: "bg-error/10 text-error hover:brightness-95",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-[18px] py-2.5 text-[0.95rem]",
  lg: "px-[26px] py-3.5 text-[1.05rem]",
};

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
}

// Matches the .btn/.btn-primary/.btn-ghost/etc. classes in
// public/css/base.css — same visual language, ported to Tailwind.
export function ButtonLink({ href, variant = "primary", size = "md", className = "", children, ...rest }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-semibold no-underline transition ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
