import { getSiteSettings } from "../../../src/lib/settings";
import { ContactForm } from "./ContactForm";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <section className="mx-auto max-w-[640px] px-5 py-10">
      <h1 className="text-2xl font-bold text-ink">Contact us</h1>
      <p className="mt-1 text-ink-muted">Have a general question, booking request, or press inquiry? Send us a message.</p>
      <div className="mt-6">
        <ContactForm />
      </div>
      {settings.contactEmail && (
        <p className="mt-4 text-sm text-ink-muted">
          Or email us directly at{" "}
          <a href={`mailto:${settings.contactEmail}`} className="text-brand">
            {settings.contactEmail}
          </a>
        </p>
      )}
    </section>
  );
}
