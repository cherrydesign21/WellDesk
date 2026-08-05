import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal } from '@/components/marketing/reveal';

export const metadata: Metadata = {
  title: 'About',
  description: 'Why WellDesk exists, who it is built for, and how it handles your practice data.',
};

export default function AboutPage() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <h1 className="text-3xl font-bold text-[#3c1d0c] sm:text-4xl">About WellDesk</h1>
      </Reveal>

      <Reveal delay={80} className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-[#3c1d0c]">Why we built it</h2>
        <p className="leading-relaxed text-[#3c1d0c]/70">
          Most dietitians we talked to were running their practice across four or five different
          tools at once — client notes in one app, diet plans in another, payments tracked in a
          notebook, check-in reminders sent over WhatsApp. Every extra tool is another place
          something falls through the cracks. WellDesk exists to replace that whole stack with one
          system, built around how a dietitian practice actually runs day to day.
        </p>
      </Reveal>

      <Reveal delay={140} className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-[#3c1d0c]">Built for dietitians specifically</h2>
        <p className="leading-relaxed text-[#3c1d0c]/70">
          WellDesk isn&apos;t a generic CRM with a nutrition label stuck on it. Enrollment cycles,
          plan renewals, a food database for building meal plans, and a client portal clients
          actually use without training — these are shaped around a dietitian&apos;s workflow from
          the ground up, not bolted on afterward.
        </p>
      </Reveal>

      <Reveal delay={200} className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-[#3c1d0c]">How we handle your data</h2>
        <p className="leading-relaxed text-[#3c1d0c]/70">
          Every practice&apos;s data is isolated at the database level — enforced by row-level
          security policies, not just application logic — so one practice&apos;s clients and
          records are never visible to another practice on the platform. See our{' '}
          <Link href="/privacy" className="font-medium text-[#454e17] underline underline-offset-2">
            Privacy Policy
          </Link>{' '}
          for the full picture.
        </p>
      </Reveal>

      <Reveal delay={260} className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-[#3c1d0c]">Get in touch</h2>
        <p className="leading-relaxed text-[#3c1d0c]/70">
          Have a question, found a bug, or want to tell us what&apos;s missing?{' '}
          <Link href="/contact" className="font-medium text-[#454e17] underline underline-offset-2">
            Contact us
          </Link>{' '}
          or{' '}
          <Link href="/suggestions" className="font-medium text-[#454e17] underline underline-offset-2">
            suggest a feature
          </Link>{' '}
          — WellDesk is being built around real requests from dietitians using it.
        </p>
      </Reveal>
    </section>
  );
}
