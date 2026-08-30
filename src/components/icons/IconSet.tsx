// A small, dependency-free icon set (hand-written, Feather-style stroke
// icons) — enough variety for a page-builder Icon block without pulling
// in an icon library. Add more here as needed.
export const ICON_NAMES = [
  "star",
  "heart",
  "check",
  "arrow-right",
  "phone",
  "mail",
  "instagram",
  "twitter",
  "youtube",
  "facebook",
  "linkedin",
  "map-pin",
  "calendar",
  "camera",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

const PATHS: Record<IconName, React.ReactNode> = {
  star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  heart: <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />,
  check: <path d="M20 6L9 17l-5-5" />,
  "arrow-right": <path d="M5 12h14M12 5l7 7-7 7" />,
  phone: (
    <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .3 2 .6 2.9a2 2 0 01-.4 2.1L8 10a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.9.5 2.9.6a2 2 0 011.7 2.1z" />
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 6l-10 7L2 6" />
    </>
  ),
  instagram: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  twitter: <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0022.4.36a9 9 0 01-2.83 1.08 4.52 4.52 0 00-7.7 4.13A12.8 12.8 0 013 1.64a4.5 4.5 0 001.4 6.03A4.5 4.5 0 012.8 7v.06a4.5 4.5 0 003.6 4.4 4.5 4.5 0 01-2 .08 4.5 4.5 0 004.2 3.13A9 9 0 012 16.4a12.7 12.7 0 006.9 2c8.3 0 12.8-6.9 12.8-12.8v-.58A9.2 9.2 0 0023 3z" />,
  youtube: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="M10 9l6 3-6 3V9z" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" />,
  linkedin: (
    <>
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
      <path d="M10 21v-7a3 3 0 016 0v7M10 9v12" />
    </>
  ),
  "map-pin": (
    <>
      <path d="M21 10c0 6.5-9 12-9 12s-9-5.5-9-12a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  camera: (
    <>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const path = PATHS[name as IconName];
  if (!path) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}
