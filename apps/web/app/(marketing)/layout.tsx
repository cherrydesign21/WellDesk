import { MarketingHeader } from '@/components/marketing/marketing-header';
import { MarketingFooter } from '@/components/marketing/marketing-footer';

// Site-wide facts about WellDesk as a company — kept separate from the
// SoftwareApplication/FAQPage schema on the landing page itself, since those
// describe the product rather than the organization behind it.
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'WellDesk',
  url: 'https://www.welldesk.app',
  logo: 'https://www.welldesk.app/icon-512.png',
  description:
    'WellDesk builds practice management software for dietitians — client tracking, diet plans, payments, appointments, and a branded client portal.',
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
