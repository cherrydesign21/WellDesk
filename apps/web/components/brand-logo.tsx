export function BrandLogo({ className = '', iconClassName = 'h-7 w-7', wordmarkClassName = 'h-5 w-auto' }: {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="" className={iconClassName} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-welldesk.svg" alt="WellDesk" className={wordmarkClassName} />
    </span>
  );
}
