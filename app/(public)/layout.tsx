import { getSiteSettings } from "../../src/lib/settings";
import { SiteHeader } from "../../src/components/layout/SiteHeader";
import { SiteFooter } from "../../src/components/layout/SiteFooter";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <>
      <SiteHeader settings={settings} />
      <main>{children}</main>
      <SiteFooter settings={settings} />
    </>
  );
}
