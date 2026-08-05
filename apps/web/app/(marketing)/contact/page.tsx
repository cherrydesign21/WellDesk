import type { Metadata } from 'next';
import { ContactForm } from '@/components/marketing/contact-form';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Questions, feedback, or a bug to report — get in touch with the WellDesk team.',
};

export default function ContactPage() {
  return (
    <section className="mx-auto w-full max-w-lg px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#3c1d0c]">Get in touch</h1>
        <p className="mt-3 text-[#3c1d0c]/70">
          Questions, feedback, or just want to say hi — we&apos;d love to hear from you.
        </p>
      </div>
      <div className="mt-10">
        <ContactForm />
      </div>
    </section>
  );
}
