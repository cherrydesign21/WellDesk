import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How WellDesk stores and isolates the client and health data entered by dietitian practices.',
};

export default function PrivacyPolicyPage() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-bold text-[#3c1d0c]">Privacy Policy</h1>
      <p className="mt-6 leading-relaxed text-[#3c1d0c]/70">
        WellDesk stores the client and health data you enter strictly to provide the practice
        management features you use — client records, diet plans, payments, and appointments. Data
        is isolated per practice and is never shared with, or accessible by, other practices on the
        platform. Contact your WellDesk administrator for questions about data handling or deletion
        requests.
      </p>
    </section>
  );
}
