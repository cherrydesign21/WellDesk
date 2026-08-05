import Link from 'next/link';
import {
  Users,
  UtensilsCrossed,
  MessageCircle,
  Wallet,
  CalendarDays,
  Smartphone,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/marketing/reveal';
import { TestimonialsSection } from '@/components/marketing/testimonials-section';
import { getActiveTestimonials } from '@/lib/testimonials';
import { createPublicClient } from '@/lib/supabase/public';

// Testimonials rarely change, so an hourly revalidate keeps the page mostly
// static (served from cache) rather than opting the whole landing page into
// per-request dynamic rendering just for this one section.
export const revalidate = 3600;

const FEATURES = [
  {
    icon: Users,
    title: 'Client management',
    description: 'Every client\'s health metrics, weight trend, and history in one place — no more scattered spreadsheets.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Diet plan builder',
    description: 'Build meal plans fast with a built-in food database for accurate calories and macros as you type.',
  },
  {
    icon: Smartphone,
    title: 'Client portal',
    description: 'Clients log their own numbers, view their plan, and track progress — without a single WhatsApp message.',
  },
  {
    icon: CalendarDays,
    title: 'Appointments',
    description: 'Schedule visits, let clients request their own slots, and never lose track of who\'s due for a follow-up.',
  },
  {
    icon: Wallet,
    title: 'Payments tracking',
    description: 'Log payments against enrollment cycles and see exactly who\'s paid, due, or renewing soon.',
  },
  {
    icon: MessageCircle,
    title: 'In-app messaging',
    description: 'Chat directly with clients inside WellDesk — one thread per client, no more digging through texts.',
  },
];

const FAQS = [
  {
    q: 'Do I need to migrate my existing client data?',
    a: 'You can add clients as you go — most dietitians start with new clients and bring active ones over gradually. There\'s no bulk import requirement to get started.',
  },
  {
    q: 'Can my clients actually use the portal without help?',
    a: 'Yes. Clients get an email invite, set a password, and land on a simple dashboard built for logging weight, viewing their diet plan, and messaging you — no training needed.',
  },
  {
    q: 'Is client health data secure?',
    a: 'Every practice\'s data is fully isolated at the database level — your clients and their records are never visible to any other practice on WellDesk.',
  },
  {
    q: 'What does it cost?',
    a: 'WellDesk is currently free while we\'re in early access. We\'ll introduce simple, transparent pricing once we\'re out of beta — existing users will get advance notice.',
  },
  {
    q: 'Can I use WellDesk on my phone?',
    a: 'Yes, the dashboard and client portal both work in any mobile browser. A dedicated app isn\'t available yet.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
};

// Pricing here must match the FAQ's actual "What does it cost?" answer
// exactly — mismatched structured data is a real risk, not just an
// inconsistency, since Google explicitly penalizes it.
const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'WellDesk',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Practice management software for dietitians — client tracking, diet plan builder, payments, appointments, and a branded client portal.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free during early access',
  },
};

export default async function LandingPage() {
  const supabase = createPublicClient();
  const testimonials = await getActiveTestimonials(supabase);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-140 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(163,183,58,0.16),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-24 -right-24 -z-10 h-72 w-72 rounded-full bg-[#A3B73A]/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-52 -left-24 -z-10 h-72 w-72 rounded-full bg-[#454e17]/10 blur-3xl"
        />

        <div className="mx-auto w-full max-w-6xl px-4 pt-16 pb-8 sm:px-6 sm:pt-24">
          <Reveal className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-[#3c1d0c] sm:text-5xl">
              Run your practice.
              <br />
              Not a spreadsheet.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[#3c1d0c]/70">
              WellDesk brings client tracking, diet plans, payments, and messaging into one place —
              so you spend less time on admin and more time with clients.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button variant="brand" size="submit" render={<Link href="/register" />}>
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <a
                href="#features"
                className="text-sm font-semibold text-[#3c1d0c]/70 hover:text-[#3c1d0c]"
              >
                See how it works
              </a>
            </div>
          </Reveal>

          <Reveal delay={150} className="mx-auto mt-16 max-w-5xl">
            <div className="overflow-hidden rounded-2xl border border-[#eee8da] shadow-xl shadow-[#454e17]/5 transition-transform duration-500 hover:-translate-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/marketing/dashboard.png" alt="WellDesk dashboard" className="w-full" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Problem/solution strip */}
      <section className="border-y border-[#eee8da] bg-[#f7f1e3]">
        <Reveal className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
          <p className="text-sm font-semibold tracking-wide text-[#A3B73A] uppercase">The problem</p>
          <h2 className="mt-3 text-2xl font-bold text-[#3c1d0c] sm:text-3xl">
            Client notes in one app, plans in another, payments in a notebook, reminders on WhatsApp.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[#3c1d0c]/70">
            Every extra tool is another place things fall through the cracks. WellDesk replaces the
            whole stack with one system built specifically for how dietitians actually work.
          </p>
        </Reveal>
      </section>

      {/* Features grid */}
      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-[#3c1d0c]">Everything your practice needs</h2>
          <p className="mt-3 text-[#3c1d0c]/70">One system, built for dietitians — not adapted from generic CRM software.</p>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 80}>
              <div className="group h-full rounded-2xl border border-[#eee8da] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#A3B73A]/40 hover:shadow-lg hover:shadow-[#454e17]/5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#454e17]/10 transition-colors group-hover:bg-[#454e17]/15">
                  <feature.icon className="h-5 w-5 text-[#454e17]" />
                </div>
                <h3 className="mt-4 font-semibold text-[#3c1d0c]">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#3c1d0c]/70">{feature.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Detailed showcase: client tracking */}
      <section className="border-t border-[#eee8da] bg-[#f7f1e3]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <p className="text-sm font-semibold tracking-wide text-[#A3B73A] uppercase">Client tracking</p>
            <h2 className="mt-3 text-3xl font-bold text-[#3c1d0c]">
              See a client&apos;s full picture at a glance
            </h2>
            <p className="mt-4 leading-relaxed text-[#3c1d0c]/70">
              Health score, weight trend, payment status, and next appointment — all on one page.
              Progress charts update automatically as clients log their own numbers from the portal.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <div className="overflow-hidden rounded-2xl border border-[#eee8da] shadow-lg transition-transform duration-500 hover:-translate-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/marketing/client-detail.png" alt="Client detail page with progress chart" className="w-full" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Detailed showcase: diet plan builder */}
      <section className="border-t border-[#eee8da]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <p className="text-sm font-semibold tracking-wide text-[#A3B73A] uppercase">Diet plans</p>
            <h2 className="mt-3 text-3xl font-bold text-[#3c1d0c]">
              Build and share plans in minutes
            </h2>
            <p className="mt-4 leading-relaxed text-[#3c1d0c]/70">
              Organize meals by slot, look up accurate calories as you type, and export to PDF, Excel,
              or Word when a client wants a printed copy — or just share it straight to their portal.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <div className="overflow-hidden rounded-2xl border border-[#eee8da] shadow-lg transition-transform duration-500 hover:-translate-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/marketing/diet-plan-view.png" alt="Diet plan with export options" className="w-full" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Detailed showcase: client portal */}
      <section className="border-t border-[#eee8da] bg-[#f7f1e3]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <Reveal delay={150} className="lg:order-2">
            <div className="overflow-hidden rounded-2xl border border-[#eee8da] shadow-lg transition-transform duration-500 hover:-translate-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/marketing/portal.png" alt="Client-facing portal dashboard" className="w-full" />
            </div>
          </Reveal>
          <Reveal className="lg:order-1">
            <p className="text-sm font-semibold tracking-wide text-[#A3B73A] uppercase">Client portal</p>
            <h2 className="mt-3 text-3xl font-bold text-[#3c1d0c]">
              A dedicated space for every client
            </h2>
            <p className="mt-4 leading-relaxed text-[#3c1d0c]/70">
              Clients log in to see their diet plan, log their own weight and health numbers, upload
              progress photos, and message you directly — branded with your practice&apos;s name and logo.
            </p>
          </Reveal>
        </div>
      </section>

      <TestimonialsSection testimonials={testimonials} />

      {/* FAQ */}
      <section id="faq" className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6">
        <Reveal>
          <h2 className="text-center text-3xl font-bold text-[#3c1d0c]">Frequently asked questions</h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {FAQS.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 60}>
              <details className="group rounded-xl border border-[#eee8da] px-5 py-4 transition-colors hover:border-[#A3B73A]/40">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-[#3c1d0c]">
                  {faq.q}
                  <span className="ml-4 shrink-0 text-[#3c1d0c]/40 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#3c1d0c]/70">{faq.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[#eee8da] bg-[#454e17]">
        <Reveal className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white">Ready to run your practice better?</h2>
          <p className="mt-3 text-white/80">Get started free — no credit card, no setup fees.</p>
          <div className="mt-8">
            <Button
              size="submit"
              className="bg-white text-[#454e17] hover:bg-[#f7f1e3]"
              render={<Link href="/register" />}
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
