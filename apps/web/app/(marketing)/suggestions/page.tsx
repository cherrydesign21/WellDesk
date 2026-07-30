import { SuggestionForm } from '@/components/marketing/suggestion-form';

export default function SuggestionsPage() {
  return (
    <section className="mx-auto w-full max-w-lg px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#3c1d0c]">Suggest a feature</h1>
        <p className="mt-3 text-[#3c1d0c]/70">
          Building WellDesk around what dietitians actually need — tell us what&apos;s missing.
        </p>
      </div>
      <div className="mt-10">
        <SuggestionForm />
      </div>
    </section>
  );
}
