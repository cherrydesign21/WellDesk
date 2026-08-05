import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'The terms for using WellDesk to manage clients, diet plans, payments, and appointments.',
};

export default function TermsOfUsePage() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-bold text-[#3c1d0c]">Terms of Use</h1>
      <p className="mt-6 leading-relaxed text-[#3c1d0c]/70">
        WellDesk is provided to help dietitians manage clients, diet plans, payments, and
        appointments. You are responsible for the accuracy of the data you enter and for complying
        with applicable healthcare and data-protection regulations in your jurisdiction when
        handling client information.
      </p>
    </section>
  );
}
