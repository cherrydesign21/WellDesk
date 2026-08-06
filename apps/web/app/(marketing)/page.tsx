import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/marketing/reveal';
import { TestimonialsSection } from '@/components/marketing/testimonials-section';
import { FaqAccordion } from '@/components/marketing/faq-accordion';
import { getActiveTestimonials } from '@/lib/testimonials';
import { createPublicClient } from '@/lib/supabase/public';

// Testimonials rarely change, so an hourly revalidate keeps the page mostly
// static (served from cache) rather than opting the whole landing page into
// per-request dynamic rendering just for this one section.
export const revalidate = 3600;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#A3B73A]/50 bg-[#A3B73A]/25 px-5 py-2.5 text-xs font-semibold tracking-[0.15em] text-[#454e17] uppercase sm:text-sm">
      {children}
    </span>
  );
}

const FEATURES = [
  {
    title: 'Client records that stay tidy',
    description: 'Intake forms, allergies, goals, notes and history — one profile per client, always current.',
    image: '/marketing/redesign/images/feature-doctor-consult.jpg',
  },
  {
    title: 'Check-ins between sessions',
    description: 'Keep the conversation going with structured check-ins instead of scattered messages.',
    image: '/marketing/redesign/images/feature-health-tablet.jpg',
  },
  {
    title: 'Appointments without the back-and-forth',
    description: 'Share availability, take bookings and send reminders. Your day arrives already organised.',
    image: '/marketing/redesign/images/feature-waist-measurement.jpg',
  },
  {
    title: 'Diet plans in minutes',
    description: 'Build plans from reusable meal blocks, adjust macros, and deliver them straight to the client.',
    image: '/marketing/redesign/images/feature-diet-plan-flatlay.jpg',
  },
  {
    title: 'Progress you can prove',
    description: 'Weight, measurements, adherence and habits charted over time so every review has evidence.',
    image: '/marketing/redesign/images/feature-celebrating-client.jpg',
  },
];

const STEPS = [
  {
    step: 'Step 1',
    title: 'Create and Organize Your Client Profiles',
    description:
      'Add new clients with all their essential information, including health history, goals, consultation notes, and dietary preferences. Keep every record securely stored and easily accessible whenever you need it.',
    image: '/marketing/client-detail.png',
    alt: 'A client profile in WellDesk showing health history and progress chart',
  },
  {
    step: 'Step 2',
    title: 'Build Personalized Meal Plans with Ease',
    description:
      'Design customized nutrition plans that match each client’s unique lifestyle and health goals. Update meal plans anytime and share them instantly without the hassle of manual paperwork.',
    image: '/marketing/diet-plan-view.png',
    alt: 'A diet plan being built in WellDesk with export options',
  },
  {
    step: 'Step 3',
    title: 'Schedule Appointments and Manage Your Calendar',
    description:
      'Let clients book appointments online while keeping your calendar organized. Automated reminders help reduce missed sessions and save valuable administrative time.',
    image: '/marketing/dashboard.png',
    alt: 'The WellDesk dashboard showing today’s schedule',
  },
  {
    step: 'Step 4',
    title: 'Track Progress and Deliver Better Results',
    description:
      'Monitor weight changes, body measurements, habits, and overall progress through interactive dashboards. Stay connected with clients and make informed adjustments to their nutrition journey.',
    image: '/marketing/portal.png',
    alt: 'The client-facing portal showing a progress chart',
  },
];

const FAQS = [
  {
    q: 'Do I need to migrate my existing client data?',
    a: 'You can add clients as you go — most dietitians start with new clients and bring active ones over gradually. There’s no bulk import requirement to get started.',
  },
  {
    q: 'Can my clients actually use the portal without help?',
    a: 'Yes. Clients get an email invite, set a password, and land on a simple dashboard built for logging weight, viewing their diet plan, and messaging you — no training needed.',
  },
  {
    q: 'Is client health data secure?',
    a: 'Every practice’s data is fully isolated at the database level — your clients and their records are never visible to any other practice on WellDesk.',
  },
  {
    q: 'What does it cost?',
    a: 'WellDesk is currently free while we’re in early access. We’ll introduce simple, transparent pricing once we’re out of beta — existing users will get advance notice.',
  },
  {
    q: 'Can I use WellDesk on my phone?',
    a: 'Yes, the dashboard and client portal both work in any mobile browser. A dedicated app isn’t available yet.',
  },
  {
    q: 'Is WellDesk only for registered dietitians?',
    a: 'No — WellDesk works for anyone running a nutrition or wellness practice, registered dietitian or not. If you manage clients, plans, and progress, it fits.',
  },
  {
    q: 'Can I import my existing client list?',
    a: 'Not as a bulk CSV import today — you add clients one at a time as you bring them onto WellDesk, which only takes a minute each. A bulk import is on the roadmap.',
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
      <section className="relative overflow-hidden bg-[#f9f3e7]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-140 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(163,183,58,0.2),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-24 -right-24 -z-10 h-72 w-72 rounded-full bg-[#A3B73A]/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-52 -left-24 -z-10 h-72 w-72 rounded-full bg-[#454e17]/10 blur-3xl"
        />

        <div className="mx-auto w-full max-w-6xl px-4 pt-12 pb-8 sm:px-6 sm:pt-16">
          <Reveal className="mx-auto max-w-3xl text-center">
            <Eyebrow>For dietitians &amp; nutritionists</Eyebrow>
            <h1 className="mt-6 text-5xl leading-[1.05] font-bold tracking-tight text-[#242b00] sm:text-6xl lg:text-7xl">
              Your whole practice,
              <br />
              on one Well<span className="text-[#a3b73a]">Desk</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#333]">
              WellDesk holds your clients, appointments, diet plans and progress data together — so you spend the
              hour on nutrition, not admin.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <a
                href="https://my.welldesk.app/register"
                className="flex items-center gap-2 rounded-full bg-[#a3b73a] px-8 py-4 text-sm font-medium tracking-wider text-[#151a01] uppercase transition-colors hover:bg-[#909f31]"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#features" className="text-sm font-semibold text-[#333] hover:text-[#242b00]">
                See how it works
              </a>
            </div>
          </Reveal>

          <Reveal delay={150} className="relative mx-auto mt-14 max-w-5xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marketing/redesign/images/hero-device-mockup.png"
              alt="WellDesk dashboard and client portal shown on a laptop and phone"
              className="w-full"
            />
            <div className="absolute -top-2 -left-2 hidden w-44 rounded-2xl bg-white p-4 shadow-lg sm:block lg:-left-8">
              <p className="text-xs font-semibold tracking-wide text-[#666] uppercase">Progress</p>
              <p className="mt-1 text-2xl font-bold text-[#111]">-4.2 kg</p>
              <div className="mt-4 flex items-end gap-1.5">
                {[17, 23, 20, 29, 26, 34, 39].map((h, i) => (
                  <div key={i} className="w-2.5 rounded-full bg-[#97d030]" style={{ height: `${h}px` }} />
                ))}
              </div>
              <p className="mt-3 text-xs text-[#333]">8-week adherence trend</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features strip */}
      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>Everything included</Eyebrow>
          <h2 className="mt-6 text-4xl font-bold text-[#242b00] sm:text-5xl">
            The tools a <span className="text-[#a3b73a]">nutrition practice</span> actually runs on
          </h2>
        </Reveal>
        <div className="mt-12 flex snap-x gap-5 overflow-x-auto pb-4 lg:grid lg:grid-cols-5 lg:overflow-visible">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 80} className="w-72 shrink-0 snap-start lg:w-auto">
              <div
                className="relative flex h-[420px] flex-col justify-end overflow-hidden rounded-2xl bg-cover bg-center p-6"
                style={{ backgroundImage: `url(${feature.image})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/0 from-25% to-[#131601]/90" />
                <div className="relative text-white">
                  <h3 className="text-xl leading-tight font-bold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/85">{feature.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How to start */}
      <section className="border-t border-[#eee8da] bg-[#f9f3e7]">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow>How to start</Eyebrow>
            <h2 className="mt-6 text-4xl font-bold text-[#242b00] sm:text-5xl">
              From first enquiry to <span className="text-[#a3b73a]">lasting results</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-[#333]">
              Beyond simple record-keeping, WellDesk shapes the whole client journey — from the first intake form to
              the review where the numbers speak for themselves.
            </p>
          </Reveal>

          <div className="relative mt-16 space-y-16 lg:space-y-24">
            <div
              aria-hidden
              className="absolute top-4 bottom-4 left-1/2 hidden w-px -translate-x-1/2 bg-[#454e17]/20 lg:block"
            />
            {STEPS.map((s, i) => {
              const imageFirst = i % 2 === 1;
              return (
                <div key={s.step} className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
                  <div
                    aria-hidden
                    className="absolute top-8 left-1/2 hidden h-4 w-4 -translate-x-1/2 rounded-full border-4 border-[#f9f3e7] bg-[#a3b73a] lg:block"
                  />
                  <Reveal className={imageFirst ? 'lg:order-2' : 'lg:order-1'}>
                    <span className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm text-black shadow-sm">
                      {s.step}
                    </span>
                    <h3 className="mt-6 text-2xl font-medium text-black sm:text-3xl">{s.title}</h3>
                    <p className="mt-4 max-w-md text-[#333]">{s.description}</p>
                  </Reveal>
                  <Reveal delay={120} className={imageFirst ? 'lg:order-1' : 'lg:order-2'}>
                    <div className="overflow-hidden rounded-2xl border-2 border-black/80 shadow-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.image} alt={s.alt} className="w-full" />
                    </div>
                  </Reveal>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Diet plan CTA banner */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="relative flex min-h-[420px] items-end overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marketing/redesign/images/cta-meal-plan-flatlay.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'linear-gradient(250deg, rgba(29,34,3,0.15) 5%, rgba(29,34,3,0.88) 55%)',
              }}
            />
            <div className="relative max-w-lg space-y-6 p-8 sm:p-14">
              <h2 className="text-4xl leading-tight font-bold text-white sm:text-5xl">
                Diet plans your clients will follow
              </h2>
              <p className="text-lg text-white/90">
                Compose plans from your own meal library, set targets per client, and send them as a clean, readable
                schedule — no PDFs to re-edit every week.
              </p>
              <a
                href="https://my.welldesk.app/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#a3b73a] px-8 py-4 text-sm font-medium tracking-wider text-[#151a01] uppercase transition-colors hover:bg-[#c3d867]"
              >
                Build your first plan
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <TestimonialsSection testimonials={testimonials} />

      {/* FAQ */}
      <section id="faq" className="border-t border-[#eee8da] bg-[#f9f3e7]">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-16 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <Reveal className="flex flex-col gap-10">
            <div>
              <Eyebrow>Questions &amp; answers</Eyebrow>
              <h2 className="mt-6 text-4xl font-bold text-[#242b00] sm:text-5xl">
                Clear answers for <span className="text-[#a3b73a]">your practice</span>
              </h2>
              <p className="mt-4 max-w-md text-lg text-[#333]">
                Everything you need to know about getting started, inviting clients, building plans and keeping data
                safe.
              </p>
            </div>
            <div className="max-w-sm rounded-2xl border border-[#f0dab5] bg-[#f3ead6] p-6">
              <h3 className="text-2xl font-semibold text-black">Still have questions?</h3>
              <p className="mt-3 text-sm text-[#333]">
                Reach out and get direct answers about onboarding and features tailored to your workflow.
              </p>
              <a
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#a3b73a] px-6 py-3.5 text-xs font-medium tracking-wider text-[#151a01] uppercase transition-colors hover:bg-[#909f31]"
              >
                Contact us
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <FaqAccordion items={FAQS} />
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[#eee8da] bg-[#454e17]">
        <Reveal className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-xs font-semibold tracking-[0.15em] text-white uppercase backdrop-blur-sm">
            Built with feedback from real dietitians
          </span>
          <h2 className="mt-6 text-4xl leading-tight font-bold text-white sm:text-5xl">
            Still thinking about it? Let&apos;s start — <span className="text-[#cfde7e]">for free.</span>
          </h2>
          <p className="mt-4 text-lg text-white/80">Get started in minutes — no credit card, no setup fees.</p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <a
              href="https://my.welldesk.app/register"
              className="flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-medium tracking-wider text-[#454e17] uppercase transition-colors hover:bg-[#f7f1e3]"
            >
              Start your journey now
              <ArrowRight className="h-4 w-4" />
            </a>
            <p className="text-sm text-white/70">✓ No credit card &nbsp; ✓ Free during early access &nbsp; ✓ Cancel anytime</p>
          </div>
        </Reveal>
      </section>
    </>
  );
}
