export function BrandLogo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/welldesk-logo-full.svg" alt="WellDesk" className={className} />
  );
}
